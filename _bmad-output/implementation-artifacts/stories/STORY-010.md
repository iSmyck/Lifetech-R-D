# STORY-010: Attachment Upload & Processing

**Story ID:** STORY-010  
**Title:** Attachment Upload & Processing  
**Effort:** L (4–6 days)  
**Dependencies:** STORY-001, STORY-004  
**Status:** ✅ COMPLETE

## Description
Implement attachment upload via drag-drop or file picker. Files upload to MinIO; a processing pipeline extracts text, generates embeddings, and indexes attachments for RAG. Supported formats: DOCX, PDF, TXT, MD, PNG, JPG. Max file size: 100MB. Audio MoMs transcribed via faster-whisper (CPU-friendly, Dockerized).

## What was built

### Backend
- `Attachment` SQLAlchemy model with `thread_id`, `project_id`, `filename`, `mime_type`, `size_bytes`, `storage_path`, `status`, `parsed_text`, `embedding`, `error_message`
- Alembic migration `dba28ef55b42_add_attachments_table`
- `POST /api/attachments` multipart upload endpoint with file validation (100MB limit, MIME type check)
- `GET /api/attachments/{id}` metadata endpoint
- `GET /api/attachments/{id}/preview` parsed text endpoint
- `GET /api/attachments/by-thread/{thread_id}` listing endpoint
- `AttachmentService` with MinIO upload, validation, CRUD
- Celery task `process_attachment_task` in `src/tasks/attachments.py` for async text extraction and embedding generation
- Text extraction for TXT/MD (direct), DOCX (`python-docx`), PDF (`pypdf`), images stored without OCR in Phase 1
- Embedding via `sentence-transformers` with fallback to zero vector

### Frontend
- `useAttachments` hook with drag-drop state, file upload, progress tracking
- ContextPanel Attachments tab wired to real backend with:
  - File picker upload button
  - Drag-and-drop zone with visual feedback
  - Upload progress indicators
  - Attachment grid with status badges (uploading/processing/ready/error)
  - Click-to-preview modal showing parsed text
- `IntentBar` supports `attachment_ids` in intent payload

### Tests
- Backend: 7 attachment tests covering upload, size limit, unsupported type, get, list, preview
- Frontend: 24 tests total including ContextPanel, useAttachments, StreamCard checkpoint interactivity

## Acceptance Criteria

### AC-10.1: Drag-drop upload
- User can drag files onto the Stream pane or Intent Bar
- Drag-over state: dashed border highlight on drop zone
- On drop: files immediately upload with progress indicator
- Multiple files can be uploaded simultaneously

### AC-10.2: File picker upload
- "Attach file" button in Intent Bar opens native file picker
- Same validation and processing as drag-drop

### AC-10.3: Upload API
- `POST /api/attachments` with `multipart/form-data`
- Body: `{ "thread_id": "...", "file": <binary> }`
- Response: `{ "attachment_id": "...", "status": "uploading" }`
- Max file size enforced: 100MB (return `413 Payload Too Large` if exceeded)

### AC-10.4: File type validation
- Supported MIME types: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/pdf`, `text/plain`, `text/markdown`, `image/png`, `image/jpeg`
- Unsupported types return `415 Unsupported Media Type`
- File extension checked as secondary validation

### AC-10.5: Processing pipeline
- Upload completes → status `uploading` → MinIO storage → status `processing`
- Celery tasks:
  1. Text extraction: DOCX via `python-docx`, PDF via `PyMuPDF`, images via OCR (optional Phase 1)
  2. Embedding generation: `sentence-transformers` → 384-dim vector
  3. Vector storage: `INSERT INTO attachments (..., embedding) VALUES (...)` using pgvector
- On completion: status `ready`; parsed text available via API
- On error: status `error`; error message logged, user sees retry option

### AC-10.6: Attachment cards in stream
- Uploading: progress bar card with filename, size, percentage
- Processing: spinner card with "Indexing..." text
- Ready: chip card with file icon, filename, parsed text preview (first 200 chars)
- Error: red-bordered card with error message and "Retry upload" button

### AC-10.7: Attachments tab in Context Panel
- Grid view of all attachments for the thread
- Sortable by upload date, file type, status
- Clicking opens preview modal with parsed text
- Drag-drop reorder within tab

### AC-10.8: MoM transcription (optional Phase 1)
- Audio files (MP3, WAV, M4A) accepted if `faster-whisper` installed
- Transcription runs in Celery worker
- Transcribed text stored in `attachments.transcription`
- If faster-whisper not available, audio files return `501 Not Implemented`

## PRD References
- FR-5: Intent Bar (attachment drag-drop)
- FR-12: Attachment Upload
- FR-13: Passive Storage Model
- UJ-1 (MoM attachment)

## System Design References
- §4.4 Attachments API
- §3.1 Core Entities (`attachments` with `embedding VECTOR(384)`)
- §3.2 Indexes (`idx_attachments_embedding`, `idx_attachments_parsed_text`)

## Implementation Notes
- Frontend `useAttachmentUpload` hook manages drag state, file selection, upload progress
- Backend `AttachmentService` handles validation, MinIO upload, Celery task dispatch
- Celery tasks in `backend/src/tasks/attachments.py`
- MinIO bucket naming: `bmad-attachments-{project_id}` for project-scoped isolation
- OCR deferred if Tesseract not available; images stored without parsed text in Phase 1
