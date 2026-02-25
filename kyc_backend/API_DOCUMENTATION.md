# KYC Backend API Documentation

## Overview
This FastAPI backend provides endpoints for:
1. **Aadhaar Data Extraction** - Extract data from Aadhaar ZIP files via URL
2. **Face Matching** - Compare face images using DeepFace AI
3. **Multi-face KYC Verification** - Comprehensive face verification for KYC compliance

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Health Check
**GET** `/health`

Returns API status and available features.

**Response:**
```json
{
  "status": "healthy",
  "service": "KYC Backend API",
  "version": "2.0.0",
  "features": {
    "url_extraction": true,
    "aadhaar_processing": true,
    "xml_parsing": true,
    "face_matching": true
  },
  "dependencies": {
    "requests": "available",
    "lxml": "available",
    "zipfile": "available",
    "modules": "available"
  }
}
```

### 2. Extract Aadhaar Data from URL
**POST** `/extract-aadhaar-from-url`

Extract Aadhaar data from a ZIP file URL using share code.

**Request Body:**
```json
{
  "zip_url": "https://example.com/aadhaar.zip",
  "share_code": "1234"
}
```

**Response:**
```json
{
  "name": "John Doe",
  "dob": "01-01-1990",
  "gender": "M",
  "address": {
    "house": "123",
    "street": "Main St",
    "vtc": "City",
    "dist": "District",
    "state": "State",
    "pincode": "123456"
  },
  "photo_base64": "base64encodedimage...",
  "success": true,
  "message": "Aadhaar data extracted successfully from URL"
}
```

### 3. Face Matching (Two Images)
**POST** `/face-match`

Compare two face images for similarity.

**Request Body:**
```json
{
  "image1_base64": "base64encodedimage1...",
  "image2_base64": "base64encodedimage2..."
}
```

**Response:**
```json
{
  "match_percentage": 87.5,
  "is_match": true,
  "threshold": 75.0,
  "success": true,
  "message": "Face matching completed successfully"
}
```

### 4. Multi-Face KYC Verification
**POST** `/multi-face-match`

Comprehensive face verification for KYC using three images: passport, Aadhaar, and live photo.

**Request Body:**
```json
{
  "passport_image_base64": "base64encodedpassport...",
  "aadhaar_image_base64": "base64encodedaadhaar...",
  "live_image_base64": "base64encodedlive..."
}
```

**Response:**
```json
{
  "passport_live_match_percent": 89.2,
  "aadhaar_live_match_percent": 91.5,
  "passport_aadhaar_match_percent": 88.7,
  "threshold_percent": 75.0,
  "verified": true,
  "success": true,
  "message": "All faces verified as the same person"
}
```

## Usage Examples

### Python Example
```python
import requests
import base64

# Face matching example
def match_faces(image1_path, image2_path):
    # Read and encode images
    with open(image1_path, "rb") as f:
        image1_b64 = base64.b64encode(f.read()).decode()
    
    with open(image2_path, "rb") as f:
        image2_b64 = base64.b64encode(f.read()).decode()
    
    # API request
    response = requests.post(
        "http://localhost:8000/face-match",
        json={
            "image1_base64": image1_b64,
            "image2_base64": image2_b64
        }
    )
    
    return response.json()

# Multi-face KYC verification example
def kyc_verification(passport_path, aadhaar_path, live_path):
    # Read and encode images
    images = {}
    for name, path in [("passport", passport_path), ("aadhaar", aadhaar_path), ("live", live_path)]:
        with open(path, "rb") as f:
            images[f"{name}_image_base64"] = base64.b64encode(f.read()).decode()
    
    # API request
    response = requests.post(
        "http://localhost:8000/multi-face-match",
        json={
            **images
        }
    )
    
    return response.json()
```

### JavaScript/Node.js Example
```javascript
const fs = require('fs');
const axios = require('axios');

// Face matching example
async function matchFaces(image1Path, image2Path) {
    const image1Buffer = fs.readFileSync(image1Path);
    const image2Buffer = fs.readFileSync(image2Path);
    
    const image1Base64 = image1Buffer.toString('base64');
    const image2Base64 = image2Buffer.toString('base64');
    
    try {
        const response = await axios.post('http://localhost:8000/face-match', {
            image1_base64: image1Base64,
            image2_base64: image2Base64
        });
        
        return response.data;
    } catch (error) {
        console.error('Face matching failed:', error.message);
        return null;
    }
}
```

### cURL Examples
```bash
# Health check
curl -X GET "http://localhost:8000/health"

# Face matching
curl -X POST "http://localhost:8000/face-match" \
  -H "Content-Type: application/json" \
  -d '{
    "image1_base64": "base64string1...",
    "image2_base64": "base64string2..."
  }'

# Aadhaar extraction
curl -X POST "http://localhost:8000/extract-aadhaar-from-url" \
  -H "Content-Type: application/json" \
  -d '{
    "zip_url": "https://example.com/aadhaar.zip",
    "share_code": "1234"
  }'
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "detail": "Error description",
  "status_code": 400
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `413` - Payload Too Large (file size limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (modules not loaded)

## Image Requirements

### Face Matching Images (Base64 Only)
- **Input Format**: Base64 encoded strings ONLY
- **Original Format**: JPG, PNG, or other common image formats (before encoding)
- **Size**: No strict size limit, but recommended max 10MB per image
- **Quality**: Higher resolution images generally provide better accuracy
- **Face Requirements**: 
  - Clear, frontal face view preferred
  - Good lighting conditions
  - Minimal obstructions (glasses OK, masks not recommended)

### Base64 Encoding
All images must be provided as base64 encoded strings:
- **Accepted**: `data:image/jpeg;base64,/9j/4AAQSkZJRg...` (with data URL prefix)
- **Accepted**: `/9j/4AAQSkZJRg...` (without prefix - recommended)
- **Note**: The API automatically handles both formats

## Face Matching Accuracy

The face matching uses DeepFace with the Facenet model:
- **Threshold**: Fixed at 75% (not adjustable via API)
- **Accuracy**: Generally high for clear, frontal face images
- **Performance**: Cosine similarity calculation for precise matching

## Installation & Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the server:
```bash
python main.py
```

3. Access API documentation:
```
http://localhost:8000/docs
```

## Dependencies

- **FastAPI**: Web framework
- **DeepFace**: Face recognition AI
- **OpenCV**: Image processing
- **NumPy**: Mathematical operations
- **lxml**: XML parsing
- **TensorFlow**: Deep learning backend

## Notes

- The API automatically downloads AI models on first use (may take time)
- Temporary files are automatically cleaned up after processing
- All face matching operations are performed locally (no external API calls)
- CORS is enabled for all origins in development mode