@echo off
cd /d "d:\Projects\Personel\blockchain_project\verify-guardian-flow\kyc_backend"
echo Starting KYC Backend API server...
echo Server will be available at: http://127.0.0.1:8000
echo API Documentation: http://127.0.0.1:8000/docs
echo.
uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause