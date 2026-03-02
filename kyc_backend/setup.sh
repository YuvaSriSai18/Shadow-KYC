#!/bin/bash

echo "========================================"
echo "Shadow-KYC Backend Setup (Linux/Unix)"
echo "========================================"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Python 3.12 is available
if command_exists python3.12; then
    PYTHON_CMD="python3.12"
elif command_exists python3; then
    # Check if python3 is version 3.12
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$PYTHON_VERSION" = "3.12" ]; then
        PYTHON_CMD="python3"
    else
        echo "Python 3.12 is not available. Found Python $PYTHON_VERSION"
        echo "Please install Python 3.12"
        exit 1
    fi
else
    echo "Python 3.12 is not installed or not in PATH"
    echo "Please install Python 3.12"
    exit 1
fi

echo "Found Python 3.12"
$PYTHON_CMD --version

# Remove existing virtual environment if it exists
if [ -d "venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf venv
fi

echo
echo "Creating virtual environment with Python 3.12..."
$PYTHON_CMD -m venv venv

if [ $? -ne 0 ]; then
    echo "Failed to create virtual environment"
    exit 1
fi

echo
echo "Activating virtual environment..."
source venv/bin/activate

echo
echo "Upgrading pip..."
python -m pip install --upgrade pip

echo
echo "Installing requirements..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Failed to install requirements"
    exit 1
fi

echo
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo
echo "To activate the virtual environment in the future, run:"
echo "  source venv/bin/activate"
echo
echo "To start the KYC backend server, run:"
echo "  python main.py"
echo