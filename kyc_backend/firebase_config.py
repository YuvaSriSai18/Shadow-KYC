"""
Firebase configuration and utilities for KYC Backend
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, storage
from typing import Optional

class FirebaseConfig:
    def __init__(self):
        self.bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET')
        self.service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
        self.project_id = os.getenv('FIREBASE_PROJECT_ID')
        
        # Initialize Firebase Admin SDK
        self._initialize_firebase()
        
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
        except ValueError:
            # Firebase not initialized, initialize it
            if self.service_account_path and os.path.exists(self.service_account_path):
                # Use service account file
                cred = credentials.Certificate(self.service_account_path)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': self.bucket_name
                })
            else:
                # Use environment variables for service account
                service_account_info = {
                    "type": "service_account",
                    "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                    "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                    "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                    "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                    "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('FIREBASE_CLIENT_EMAIL')}"
                }
                
                # Filter out None values
                service_account_info = {k: v for k, v in service_account_info.items() if v is not None}
                
                if service_account_info.get('project_id'):
                    cred = credentials.Certificate(service_account_info)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': self.bucket_name
                    })
                else:
                    print("Warning: Firebase credentials not found. Some features may not work.")
                    return
        
        print("Firebase initialized successfully")
    
    def get_bucket(self):
        """Get Firebase Storage bucket"""
        return storage.bucket()

# Global Firebase instance
firebase_config = FirebaseConfig()