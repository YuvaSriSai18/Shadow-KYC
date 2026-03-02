@echo off
echo ========================================
echo Shadow-KYC Backend Setup (Windows)
echo ========================================
echo.

REM Check if Python 3.12 is available
python3.12 --version >nul 2>&1
if errorlevel 1 (
    echo Python 3.12 is not installed or not in PATH
    echo Please install Python 3.12 and add it to your PATH
    pause
    exit /b 1
)

echo Found Python 3.12
python3.12 --version

REM Remove existing virtual environment if it exists
if exist "venv" (
    echo Removing existing virtual environment...
    rmdir /s /q venv
)

echo.
echo Creating virtual environment with Python 3.12...
python3.12 -m venv venv

if errorlevel 1 (
    echo Failed to create virtual environment
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Installing requirements...
pip install -r requirements.txt

if errorlevel 1 (
    echo Failed to install requirements
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To activate the virtual environment in the future, run:
echo   venv\Scripts\activate.bat
echo.
echo To start the KYC backend server, run:
echo   python main.py
echo.
pause