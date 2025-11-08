"""
Storage service for managing asset uploads and downloads.

Supports multiple storage providers:
- Supabase Storage
- AWS S3
- Local filesystem (dev only)
"""
from typing import Protocol, Optional
import os
from abc import abstractmethod


class StorageProvider(Protocol):
    """Abstract interface for storage providers."""
    
    @abstractmethod
    async def upload(
        self, 
        file_bytes: bytes, 
        path: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload file to storage.
        
        Args:
            file_bytes: File content as bytes
            path: Destination path/key
            content_type: MIME type
            
        Returns:
            Storage URI for the uploaded file
        """
        ...
    
    @abstractmethod
    async def download(self, uri: str) -> bytes:
        """
        Download file from storage.
        
        Args:
            uri: Storage URI
            
        Returns:
            File content as bytes
        """
        ...
    
    @abstractmethod
    async def delete(self, uri: str) -> None:
        """
        Delete file from storage.
        
        Args:
            uri: Storage URI
        """
        ...
    
    @abstractmethod
    async def get_signed_url(
        self, 
        uri: str, 
        expires_in: int = 3600
    ) -> str:
        """
        Generate signed URL for temporary access.
        
        Args:
            uri: Storage URI
            expires_in: URL expiration in seconds
            
        Returns:
            Signed URL
        """
        ...


class SupabaseStorage:
    """
    Supabase Storage implementation.
    """
    
    def __init__(self, bucket_name: str):
        from supabase import create_client

        self.bucket_name = bucket_name
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set")

        self.client = create_client(supabase_url, supabase_key)
    
    async def upload(
        self, 
        file_bytes: bytes, 
        path: str,
        content_type: Optional[str] = None
    ) -> str:
        """Upload to Supabase Storage bucket."""
        try:
            options = {}
            if content_type:
                options["content-type"] = content_type
            
            self.client.storage.from_(self.bucket_name).upload(
                path, file_bytes, options
            )
            
            return f"supabase://{self.bucket_name}/{path}"
        except Exception as e:
            raise Exception(f"Failed to upload to Supabase: {str(e)}")
    
    async def download(self, uri: str) -> bytes:
        """Download from Supabase Storage bucket."""
        try:
            # Extract path from URI (supabase://bucket/path)
            path = uri.replace(f"supabase://{self.bucket_name}/", "")
            
            response = self.client.storage.from_(self.bucket_name).download(path)
            return response
        except Exception as e:
            raise Exception(f"Failed to download from Supabase: {str(e)}")
    
    async def delete(self, uri: str) -> None:
        """Delete from Supabase Storage bucket."""
        try:
            # Extract path from URI
            path = uri.replace(f"supabase://{self.bucket_name}/", "")
            
            self.client.storage.from_(self.bucket_name).remove([path])
        except Exception as e:
            raise Exception(f"Failed to delete from Supabase: {str(e)}")
    
    async def get_signed_url(
        self, 
        uri: str, 
        expires_in: int = 3600
    ) -> str:
        """Generate signed URL from Supabase Storage."""
        try:
            # Extract path from URI
            path = uri.replace(f"supabase://{self.bucket_name}/", "")
            
            response = self.client.storage.from_(self.bucket_name).create_signed_url(
                path, expires_in
            )
            return response["signedURL"]
        except Exception as e:
            raise Exception(f"Failed to create signed URL: {str(e)}")


class S3Storage:
    """
    AWS S3 implementation.
    
    TODO: Implement using boto3
    """
    
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        # TODO: Initialize boto3 client
    
    async def upload(
        self, 
        file_bytes: bytes, 
        path: str,
        content_type: Optional[str] = None
    ) -> str:
        """Upload to S3 bucket."""
        # TODO: Implement
        raise NotImplementedError("S3Storage.upload not yet implemented")
    
    async def download(self, uri: str) -> bytes:
        """Download from S3 bucket."""
        # TODO: Implement
        raise NotImplementedError("S3Storage.download not yet implemented")
    
    async def delete(self, uri: str) -> None:
        """Delete from S3 bucket."""
        # TODO: Implement
        raise NotImplementedError("S3Storage.delete not yet implemented")
    
    async def get_signed_url(
        self, 
        uri: str, 
        expires_in: int = 3600
    ) -> str:
        """Generate signed URL from S3."""
        # TODO: Implement
        raise NotImplementedError("S3Storage.get_signed_url not yet implemented")


def get_storage_provider() -> StorageProvider:
    """
    Factory function to get configured storage provider.
    
    Returns:
        Configured storage provider instance
    """
    provider = os.getenv("ASSET_STORAGE_PROVIDER", "supabase")
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "twyn-assets")
    
    if provider == "supabase":
        return SupabaseStorage(bucket)
    elif provider == "s3":
        return S3Storage(bucket)
    else:
        raise ValueError(f"Unknown storage provider: {provider}")


# TODO: Add utility functions for:
# - generate_thumbnails(image_bytes) -> bytes
# - extract_pdf_pages(pdf_bytes) -> List[bytes]  # page images
# - extract_video_frames(video_bytes, intervals) -> List[bytes]
# - validate_file_type(file_bytes, allowed_types) -> bool
# - calculate_file_hash(file_bytes) -> str

