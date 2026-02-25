import os
import sys
import tempfile
import base64
import requests
import zipfile
import lxml.etree as ET
import numpy as np
from typing import Dict, Any, List
from io import BytesIO
from PIL import Image

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add modules folder to path
modules_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "modules"))
sys.path.insert(0, modules_path)

app = FastAPI(
    title="KYC Backend API",
    description="Simplified FastAPI backend for Aadhaar-based KYC verification",
    version="2.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080",
        "https://fwqnmr96-8080.inc1.devtunnels.ms",
        "https://gnq6klr6-8080.inc1.devtunnels.ms"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize module availability
MODULES_AVAILABLE = False

# Try to import and set up face matching functionality
try:
    print("🔍 Checking dependencies...")
    
    # Check DeepFace
    from deepface import DeepFace
    import numpy as np
    print("✅ DeepFace and NumPy available")
    
    # Set up modules path
    modules_dir = os.path.join(os.path.dirname(__file__), "modules")
    if modules_dir not in sys.path:
        sys.path.insert(0, modules_dir)
    
    # Import aadhar_xml module
    import aadhar_xml
    extract_aadhaar_xml = aadhar_xml.extract_aadhaar_xml
    parse_aadhaar_xml = aadhar_xml.parse_aadhaar_xml
    save_photo = aadhar_xml.save_photo
    print("✅ Aadhaar XML module loaded")
    
    # Define face matching functions directly here to avoid import issues
    def get_embedding(img_path: str, model_name: str = "Facenet"):
        """Get face embedding for an image using DeepFace."""
        reps = DeepFace.represent(
            img_path=img_path,
            model_name=model_name,
            enforce_detection=True
        )
        return np.array(reps[0]["embedding"], dtype=np.float32)
    
    def l2_normalize(v: np.ndarray) -> np.ndarray:
        """Normalize a vector using L2 norm."""
        norm = np.linalg.norm(v)
        return v / norm if norm != 0 else v

    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity between two vectors."""
        a = l2_normalize(a)
        b = l2_normalize(b)
        return float(np.dot(a, b))

    def similarity_to_percent(sim: float) -> float:
        """Convert cosine similarity [-1,1] → percentage [0,100]."""
        return (sim + 1.0) / 2.0 * 100.0
    
    MODULES_AVAILABLE = True
    print("✅ All face matching functions ready")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Make sure to install: pip install deepface opencv-python numpy tensorflow")
    MODULES_AVAILABLE = False
    
    # Define fallback functions
    def get_embedding(*args, **kwargs):
        raise HTTPException(status_code=503, detail="DeepFace not installed. Run: pip install deepface opencv-python numpy tensorflow")
    
    def cosine_similarity(*args, **kwargs):
        raise HTTPException(status_code=503, detail="Face matching not available")
    
    def similarity_to_percent(*args, **kwargs):
        raise HTTPException(status_code=503, detail="Face matching not available")

except Exception as e:
    print(f"❌ Unexpected error setting up modules: {e}")
    MODULES_AVAILABLE = False
    
    # Define fallback functions
    def get_embedding(*args, **kwargs):
        raise HTTPException(status_code=503, detail=f"Module setup error: {str(e)}")
    
    def cosine_similarity(*args, **kwargs):
        raise HTTPException(status_code=503, detail="Face matching not available")
    
    def similarity_to_percent(*args, **kwargs):
        raise HTTPException(status_code=503, detail="Face matching not available")

# Pydantic models for request/response
class AadhaarExtractRequest(BaseModel):
    zip_url: str
    share_code: str

class AadhaarDataResponse(BaseModel):
    name: str
    dob: str
    gender: str
    address: Dict[str, str]
    photo_base64: str
    success: bool
    message: str

class FaceMatchRequest(BaseModel):
    image1_base64: str
    image2_base64: str

class FaceMatchResponse(BaseModel):
    match_percentage: float
    is_match: bool
    threshold: float
    success: bool
    message: str

class MultiFaceMatchRequest(BaseModel):
    passport_image_base64: str
    aadhaar_image_base64: str 
    live_image_base64: str

class MultiFaceMatchResponse(BaseModel):
    passport_live_match_percent: float
    aadhaar_live_match_percent: float
    passport_aadhaar_match_percent: float
    threshold_percent: float
    verified: bool
    success: bool
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str = None

# Aadhaar XML processing functions
def download_zip_from_url(url: str) -> bytes:
    """Download ZIP file from URL"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except requests.RequestException as e:
        raise ValueError(f"Failed to download ZIP file from URL: {str(e)}")

# Face matching utility functions
def decode_base64_image(base64_str: str) -> bytes:
    """Decode base64 image string to bytes."""
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_str)
        return image_data
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

def save_image_bytes_to_temp(image_bytes: bytes, suffix: str = '.jpg') -> str:
    """Save image bytes to temporary file and return path."""
    temp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    temp_file.write(image_bytes)
    temp_file.close()
    return temp_file.name

def cleanup_temp_files(file_paths: List[str]):
    """Clean up temporary files."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass  # Ignore cleanup errors

def extract_aadhaar_xml_from_zip(zip_content: bytes, share_code: str):
    """Extract XML from Offline Aadhaar ZIP using share code."""
    temp_zip = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
    try:
        temp_zip.write(zip_content)
        temp_zip.close()
        
        if MODULES_AVAILABLE:
            # Use the module function
            return extract_aadhaar_xml(temp_zip.name, share_code)
        else:
            # Fallback implementation
            with zipfile.ZipFile(temp_zip.name, "r") as zf:
                zf.setpassword(share_code.encode("utf-8"))
                
                xml_files = [name for name in zf.namelist() if name.endswith(".xml")]
                if not xml_files:
                    raise ValueError("No XML file found inside ZIP")
                
                xml_name = xml_files[0]
                xml_content = zf.read(xml_name)
            
            return xml_content
    finally:
        if os.path.exists(temp_zip.name):
            os.remove(temp_zip.name)

def parse_aadhaar_xml_data(xml_bytes: bytes):
    """Parse Name, DOB, Gender, Address + Photo from Aadhaar XML."""
    if MODULES_AVAILABLE:
        # Use the module function
        return parse_aadhaar_xml(xml_bytes)
    else:
        # Fallback implementation
        root = ET.fromstring(xml_bytes)
        
        uid_data = root.find("UidData")
        if uid_data is None:
            raise ValueError("Invalid Aadhaar XML: UidData not found")
        
        poi = uid_data.find("Poi")
        poa = uid_data.find("Poa")
        pht = uid_data.find("Pht")
        
        if poi is None or poa is None:
            raise ValueError("Invalid Aadhaar XML: Required data sections not found")
        
        data = {
            "name": poi.get("name", ""),
            "dob": poi.get("dob") or poi.get("dobt", ""),
            "gender": poi.get("gender", ""),
            "address": {
                "house": poa.get("house", ""),
                "street": poa.get("street", ""),
                "vtc": poa.get("vtc", ""),
                "dist": poa.get("dist", ""),
                "state": poa.get("state", ""),
                "pincode": poa.get("pc", "")
            },
            "photo_base64": pht.text.strip() if pht is not None and pht.text else ""
        }
        
        return data

@app.get("/", response_model=Dict[str, str])
def root():
    """Health check endpoint"""
    return {
        "message": "KYC Backend API is running",
        "version": "2.0.0",
        "status": "healthy"
    }

@app.post("/extract-aadhaar-from-url", response_model=AadhaarDataResponse)
async def extract_aadhaar_from_url(request: AadhaarExtractRequest):
    """
    Extract Aadhaar data from ZIP file URL using share code
    """
    try:
        # Validate inputs
        if not request.zip_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ZIP URL is required"
            )
        
        if not request.share_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Share code is required"
            )
        
        # Download ZIP file from URL
        try:
            zip_content = download_zip_from_url(request.zip_url)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if len(zip_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="ZIP file size exceeds 50MB limit"
            )
        
        # Extract XML from ZIP
        try:
            xml_bytes = extract_aadhaar_xml_from_zip(zip_content, request.share_code)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to extract XML from ZIP: {str(e)}"
            )
        
        # Parse Aadhaar data
        try:
            aadhaar_data = parse_aadhaar_xml_data(xml_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse Aadhaar XML: {str(e)}"
            )
        
        return AadhaarDataResponse(
            name=aadhaar_data["name"],
            dob=aadhaar_data["dob"],
            gender=aadhaar_data["gender"],
            address=aadhaar_data["address"],
            photo_base64=aadhaar_data["photo_base64"],
            success=True,
            message="Aadhaar data extracted successfully from URL"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

@app.post("/face-match", response_model=FaceMatchResponse)
async def face_match(request: FaceMatchRequest):
    """
    Compare two face images for matching using DeepFace.
    Returns match percentage and whether they match based on threshold.
    """
    temp_files = []
    
    try:
        if not MODULES_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Face matching modules not available"
            )
        
        # Decode base64 images and save to temporary files
        image1_bytes = decode_base64_image(request.image1_base64)
        image2_bytes = decode_base64_image(request.image2_base64)
        
        image1_path = save_image_bytes_to_temp(image1_bytes, '.jpg')
        image2_path = save_image_bytes_to_temp(image2_bytes, '.jpg')
        temp_files.extend([image1_path, image2_path])
        
        # Get embeddings for both images
        embedding1 = get_embedding(image1_path)
        embedding2 = get_embedding(image2_path)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(embedding1, embedding2)
        match_percentage = similarity_to_percent(similarity)
        
        # Check if match exceeds threshold (fixed at 75.0)
        threshold = 75.0
        is_match = match_percentage >= threshold
        
        return FaceMatchResponse(
            match_percentage=round(match_percentage, 2),
            is_match=is_match,
            threshold=threshold,
            success=True,
            message="Face matching completed successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face matching failed: {str(e)}"
        )
    finally:
        # Clean up temporary files
        cleanup_temp_files(temp_files)

@app.post("/multi-face-match", response_model=MultiFaceMatchResponse)
async def multi_face_match(request: MultiFaceMatchRequest):
    """
    Compare multiple face images (passport, aadhaar, live) for KYC verification.
    Verifies if all three images belong to the same person.
    """
    temp_files = []
    
    try:
        if not MODULES_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Face matching modules not available"
            )
        
        # Decode base64 images and save to temporary files
        passport_bytes = decode_base64_image(request.passport_image_base64)
        aadhaar_bytes = decode_base64_image(request.aadhaar_image_base64)
        live_bytes = decode_base64_image(request.live_image_base64)
        
        passport_path = save_image_bytes_to_temp(passport_bytes, '.jpg')
        aadhaar_path = save_image_bytes_to_temp(aadhaar_bytes, '.jpg')
        live_path = save_image_bytes_to_temp(live_bytes, '.jpg')
        temp_files.extend([passport_path, aadhaar_path, live_path])
        
        # Get embeddings for all images
        passport_embedding = get_embedding(passport_path)
        aadhaar_embedding = get_embedding(aadhaar_path)
        live_embedding = get_embedding(live_path)
        
        # Calculate pairwise similarities
        passport_live_similarity = cosine_similarity(passport_embedding, live_embedding)
        aadhaar_live_similarity = cosine_similarity(aadhaar_embedding, live_embedding)
        passport_aadhaar_similarity = cosine_similarity(passport_embedding, aadhaar_embedding)
        
        # Convert to percentages
        passport_live_percent = similarity_to_percent(passport_live_similarity)
        aadhaar_live_percent = similarity_to_percent(aadhaar_live_similarity)
        passport_aadhaar_percent = similarity_to_percent(passport_aadhaar_similarity)
        
        # Verification: all pairs should exceed threshold (fixed at 75.0)
        threshold = 75.0
        verified = (
            passport_live_percent >= threshold and
            aadhaar_live_percent >= threshold and
            passport_aadhaar_percent >= threshold
        )
        
        message = "All faces verified as the same person" if verified else "Face verification failed - not all images match"
        
        return MultiFaceMatchResponse(
            passport_live_match_percent=round(passport_live_percent, 2),
            aadhaar_live_match_percent=round(aadhaar_live_percent, 2),
            passport_aadhaar_match_percent=round(passport_aadhaar_percent, 2),
            threshold_percent=threshold,
            verified=verified,
            success=True,
            message=message
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-face matching failed: {str(e)}"
        )
    finally:
        # Clean up temporary files
        cleanup_temp_files(temp_files)

@app.get("/health")
def health_check():
    """
    Detailed health check endpoint
    """
    return {
        "status": "healthy",
        "service": "KYC Backend API",
        "version": "2.0.0",
        "features": {
            "url_extraction": True,
            "aadhaar_processing": True,
            "xml_parsing": True,
            "face_matching": MODULES_AVAILABLE
        },
        "dependencies": {
            "requests": "available",
            "lxml": "available",
            "zipfile": "available",
            "modules": "available" if MODULES_AVAILABLE else "not available"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)