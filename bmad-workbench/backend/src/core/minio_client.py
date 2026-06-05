from io import BytesIO
from typing import BinaryIO

from minio import Minio
from minio.error import S3Error

from src.core.config import settings
from src.core.exceptions import ApiError


def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


def ensure_bucket(client: Minio, bucket_name: str) -> None:
    try:
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
    except S3Error as exc:
        raise ApiError(status_code=500, message=f"MinIO bucket error: {exc}")


def upload_file(
    client: Minio,
    bucket_name: str,
    object_name: str,
    data: BinaryIO,
    length: int,
    content_type: str,
) -> str:
    ensure_bucket(client, bucket_name)
    try:
        client.put_object(
            bucket_name,
            object_name,
            data,
            length,
            content_type=content_type,
        )
        return f"{bucket_name}/{object_name}"
    except S3Error as exc:
        raise ApiError(status_code=500, message=f"MinIO upload error: {exc}")


def get_file(client: Minio, bucket_name: str, object_name: str) -> BytesIO:
    try:
        response = client.get_object(bucket_name, object_name)
        return BytesIO(response.read())
    except S3Error as exc:
        raise ApiError(status_code=404, message=f"File not found: {exc}")
    finally:
        response.close()
        response.release_conn()
