import os
from io import BytesIO
from uuid import UUID

from celery import shared_task
from celery.states import SUCCESS, FAILURE
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.core.config import settings
from src.core.minio_client import get_minio_client, get_file
from src.models.attachment import Attachment


def _get_sync_session():
    """Create a synchronous DB session for Celery tasks."""
    # Convert asyncpg URL to psycopg2 for sync usage
    db_url = str(settings.database_url).replace("postgresql+asyncpg://", "postgresql://")
    if db_url.startswith("sqlite+aiosqlite://"):
        db_url = db_url.replace("sqlite+aiosqlite://", "sqlite://")
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    return Session()


def _extract_text(mime_type: str, file_bytes: bytes) -> str:
    """Extract text from supported file types."""
    if mime_type == "text/plain" or mime_type == "text/markdown":
        return file_bytes.decode("utf-8", errors="replace")

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try:
            from docx import Document as DocxDocument
            doc = DocxDocument(BytesIO(file_bytes))
            return "\n".join(p.text for p in doc.paragraphs if p.text)
        except Exception as exc:
            raise RuntimeError(f"DOCX extraction failed: {exc}")

    if mime_type == "application/pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(file_bytes))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise RuntimeError(f"PDF extraction failed: {exc}")

    # Images: store but don't OCR in Phase 1
    if mime_type.startswith("image/"):
        return ""

    return ""


def _generate_embedding(text: str) -> list:
    """Generate embedding vector. Falls back to simple mock if sentence-transformers unavailable."""
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        embedding = model.encode(text).tolist()
        return embedding
    except Exception:
        # Fallback: return a zero vector of correct dimension
        # In production, sentence-transformers should be installed
        return [0.0] * 384


@shared_task(bind=True, max_retries=3)
def process_attachment_task(self, attachment_id: str):
    """Process an attachment: extract text, generate embedding, update status."""
    db = _get_sync_session()
    try:
        attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
        if not attachment:
            raise ValueError(f"Attachment {attachment_id} not found")

        attachment.status = "processing"
        db.commit()

        # Download from MinIO
        client = get_minio_client()
        bucket_name = f"bmad-attachments-{attachment.project_id}"
        object_name = attachment.storage_path.replace(f"{bucket_name}/", "")
        file_bytes = get_file(client, bucket_name, object_name).read()

        # Extract text
        parsed_text = _extract_text(attachment.mime_type, file_bytes)

        # Generate embedding if text was extracted
        embedding = None
        if parsed_text:
            embedding = _generate_embedding(parsed_text)

        attachment.parsed_text = parsed_text or None
        attachment.embedding = embedding
        attachment.status = "ready"
        db.commit()

        return {"status": "ready", "attachment_id": attachment_id}

    except Exception as exc:
        db.rollback()
        attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
        if attachment:
            attachment.status = "error"
            attachment.error_message = str(exc)
            db.commit()
        self.retry(exc=exc, countdown=10)
        raise

    finally:
        db.close()
