"""
Configuration settings for KYC Backend API
"""
import os
from typing import List

class Settings:
    # API Configuration
    API_TITLE = "KYC Backend API"
    API_DESCRIPTION = "FastAPI backend for Aadhaar-based KYC verification"
    API_VERSION = "1.0.0"
    
    # Server Configuration
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # React default
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # File Upload Configuration
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_EXTENSIONS = [".zip"]
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # Directories
    TEMP_DIR = os.getenv("TEMP_DIR", None)  # None uses system temp
    MODULES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "modules")

settings = Settings()