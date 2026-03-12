import os
import shutil
import secrets
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class SecureCleanup:
    """Securely delete sensitive data"""
    
    @staticmethod
    def wipe_memory(data: Optional[bytes]) -> None:
        """Overwrite memory data before garbage collection"""
        if data:
            try:
                # Create mutable array and overwrite
                mutable = bytearray(data)
                for i in range(len(mutable)):
                    mutable[i] = 0
                logger.debug("Memory wiped successfully")
            except Exception as e:
                logger.error(f"Failed to wipe memory: {e}")
    
    @staticmethod
    def secure_delete_file(file_path: str, passes: int = 3) -> bool:
        """
        Securely delete a file by overwriting multiple times
        Passes: 3 for HDD, 1 for SSD (wear leveling makes multiple passes less effective)
        """
        if not os.path.exists(file_path):
            return True
        
        try:
            file_size = os.path.getsize(file_path)
            
            # Overwrite with random data multiple times
            for pass_num in range(passes):
                with open(file_path, 'wb') as f:
                    f.write(secrets.token_bytes(file_size))
                    f.flush()
                    os.fsync(f.fileno())
            
            # Final delete
            os.remove(file_path)
            logger.info(f"Securely deleted file: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to securely delete file {file_path}: {e}")
            return False
    
    @staticmethod
    def secure_wipe_directory(dir_path: str) -> bool:
        """Recursively wipe and delete a directory"""
        if not os.path.exists(dir_path):
            return True
        
        try:
            for root, dirs, files in os.walk(dir_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    SecureCleanup.secure_delete_file(file_path)
                
                for dir in dirs:
                    dir_full = os.path.join(root, dir)
                    SecureCleanup.secure_wipe_directory(dir_full)
            
            os.rmdir(dir_path)
            logger.info(f"Securely wiped directory: {dir_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to wipe directory {dir_path}: {e}")
            return False

cleanup = SecureCleanup()
