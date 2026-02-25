# KYC Backend API

A simplified FastAPI-based backend service for processing Aadhaar-based KYC verification using offline Aadhaar XML files from URLs.

## Features

- **URL-based Processing**: Extract Aadhaar data directly from ZIP file URLs
- **Simplified API**: Single endpoint for data extraction
- **Aadhaar Processing**: Extract personal information from offline Aadhaar XML files
- **Photo Extraction**: Retrieve base64-encoded photos from Aadhaar data
- **RESTful API**: Clean endpoints with proper error handling
- **CORS Support**: Ready for frontend integration
- **No External Dependencies**: Works without Firebase or external storage

## API Endpoints

### API Endpoints

#### `GET /`
Health check endpoint
- **Response**: Basic service information

#### `POST /extract-aadhaar-from-url`
Extract Aadhaar data from ZIP file URL
- **Content-Type**: `application/json`
- **Body**: 
  ```json
  {
    "zip_url": "https://example.com/aadhaar.zip",
    "share_code": "your-share-code"
  }
  ```
- **Response**: Complete Aadhaar data including photo

#### `GET /health`
Detailed health check
- **Response**: Service status and available features

## Installation

1. **Install dependencies:**
```bash
cd kyc_backend
pip install -r requirements.txt
```

2. **Environment Configuration (Optional):**
```bash
# Copy the example environment file if you want to customize settings
cp .env.example .env
```

3. **Project Structure:**
```
kyc_backend/
  main.py           # Main FastAPI application
  requirements.txt  # Dependencies
  test_api.py      # API test suite
  README.md        # This documentation
  .env             # Environment variables (optional)
```

## Running the Server

### Development Mode
```bash
# Using the run script
python run.py

# Or directly with uvicorn
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API Base URL**: http://127.0.0.1:8000
- **Interactive Docs**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Usage Examples

### Using cURL

**Extract Aadhaar data from URL:**
```bash
curl -X POST "http://127.0.0.1:8000/extract-aadhaar-from-url" \
  -H "Content-Type: application/json" \
  -d '{"zip_url": "https://example.com/aadhaar.zip", "share_code": "your-share-code"}'
```

### Using JavaScript/Fetch

```javascript
// Extract Aadhaar data from URL
const requestData = {
  zip_url: 'https://example.com/aadhaar.zip',
  share_code: 'your-share-code'
};

const response = await fetch('http://127.0.0.1:8000/extract-aadhaar-from-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});

const data = await response.json();
console.log(data);
```

## Response Format

### Success Response
```json
{
  "name": "John Doe",
  "dob": "01-01-1990",
  "gender": "M",
  "address": {
    "house": "123",
    "street": "Main Street",
    "vtc": "City Name",
    "dist": "District",
    "state": "State Name",
    "pincode": "123456"
  },
  "photo_base64": "base64-encoded-image-data",
  "success": true,
  "message": "Aadhaar data processed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "OPTIONAL_ERROR_CODE"
}
```

## Environment Variables

- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Debug mode (default: true)
- `SECRET_KEY`: Secret key for security
- `TEMP_DIR`: Custom temporary directory

## Security Considerations

- **Production**: Change the `SECRET_KEY` and configure `ALLOWED_ORIGINS` properly
- **File Upload**: Files are temporarily stored and cleaned up automatically
- **Validation**: ZIP files and share codes are validated before processing
- **Error Handling**: Sensitive information is not exposed in error messages

## Dependencies

- **FastAPI**: Modern, fast web framework
- **Uvicorn**: ASGI server implementation
- **lxml**: XML processing library
- **Pydantic**: Data validation and serialization
- **python-multipart**: Form data parsing

## Integration with Frontend

This backend is designed to work with the React/TypeScript frontend in the `kyc/` folder. The CORS configuration allows requests from common development ports.

## Troubleshooting

1. **Import Error for aadhar_xml**: Ensure the `modules/aadhar_xml.py` file exists and is accessible
2. **ZIP File Errors**: Verify the ZIP file is a valid offline Aadhaar file
3. **Share Code Issues**: Ensure the share code matches the one used to generate the ZIP file
4. **CORS Issues**: Check the `ALLOWED_ORIGINS` configuration for your frontend URL