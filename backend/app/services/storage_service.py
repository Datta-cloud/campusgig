import os
import requests
from typing import Optional, Tuple
from app.config import (
    UPLOAD_DIR,
    UPLOAD_DIR_DELIVERABLES,
    UPLOAD_DIR_REFERENCES,
    UPLOAD_DIR_THUMBNAILS,
)

# Cloud Storage Configuration (Supabase Storage / AWS S3)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "campusgig-deliverables")

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")
S3_REGION = os.getenv("AWS_DEFAULT_REGION", "ap-south-1")


def is_cloud_storage_enabled() -> bool:
    """Check if either Supabase Storage or S3 is configured."""
    return bool((SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) or S3_BUCKET_NAME)


def get_storage_provider_name() -> str:
    """Return the name of the active storage provider."""
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        return "Supabase Cloud Storage"
    elif S3_BUCKET_NAME:
        return "AWS S3 / Cloudflare R2"
    return "Local Persistent Filesystem"


def upload_file_bytes(
    file_bytes: bytes,
    filename: str,
    folder: str = "deliverables",
    content_type: str = "application/octet-stream"
) -> Tuple[str, str]:
    """
    Upload a file to Cloud Storage (Supabase/S3) with automatic fallback to local disk.
    Returns: (file_url, storage_provider)
    """
    # 1. Try Supabase Storage if configured
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            clean_url = SUPABASE_URL.rstrip("/")
            target_path = f"{folder}/{filename}"
            upload_endpoint = f"{clean_url}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{target_path}"
            
            headers = {
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Content-Type": content_type,
                "x-upsert": "true"
            }
            
            resp = requests.post(upload_endpoint, data=file_bytes, headers=headers, timeout=15)
            if resp.status_code in [200, 201]:
                # Public download URL
                public_url = f"{clean_url}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{target_path}"
                return public_url, "Supabase Cloud Storage"
            else:
                print(f"[Storage Warning] Supabase upload returned {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[Storage Error] Failed to upload to Supabase: {e}")

    # 2. Try AWS S3 if boto3 and bucket configured
    if S3_BUCKET_NAME:
        try:
            import boto3
            s3 = boto3.client("s3", region_name=S3_REGION)
            target_key = f"{folder}/{filename}"
            s3.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=target_key,
                Body=file_bytes,
                ContentType=content_type
            )
            s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{target_key}"
            return s3_url, "AWS S3"
        except Exception as e:
            print(f"[Storage Error] S3 upload failed: {e}")

    # 3. Fallback to Local Disk
    folder_dir = (
        UPLOAD_DIR_DELIVERABLES if folder == "deliverables"
        else UPLOAD_DIR_REFERENCES if folder == "references"
        else UPLOAD_DIR_THUMBNAILS
    )
    os.makedirs(folder_dir, exist_ok=True)
    local_path = os.path.join(folder_dir, filename)

    with open(local_path, "wb") as f:
        f.write(file_bytes)

    local_url = f"/uploads/{folder}/{filename}"
    return local_url, "Local Persistent Filesystem"
