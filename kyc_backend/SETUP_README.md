# Setup Scripts for KYC Backend

This directory contains platform-specific setup scripts to create a virtual environment and install dependencies with Python 3.12.

## Usage Instructions

### Windows
Run the batch file:
```
setup.bat
```
Double-click the file in File Explorer or run it from Command Prompt/PowerShell.

### Linux/Unix
Run the shell script:
```
chmod +x setup.sh  # Make executable (if needed)
./setup.sh
```

### macOS
Run the command file:
```
chmod +x setup_mac.command  # Make executable (if needed)
./setup_mac.command
```
Or double-click the `setup_mac.command` file in Finder.

## What these scripts do

1. Check for Python 3.12 installation
2. Remove any existing virtual environment
3. Create a new virtual environment with Python 3.12
4. Activate the virtual environment
5. Upgrade pip
6. Install all dependencies from requirements.txt

## Requirements

- Python 3.12 must be installed and accessible from the command line
- Internet connection for downloading packages
- Sufficient disk space for dependencies

## After Setup

Once setup is complete, you can:

1. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate.bat`
   - **Linux/macOS**: `source venv/bin/activate`

2. Start the KYC backend server:
   ```
   python main.py
   ```

## Troubleshooting

- **Python 3.12 not found**: Install Python 3.12 from https://www.python.org/downloads/
- **Permission denied (Linux/macOS)**: Run `chmod +x setup.sh` or `chmod +x setup_mac.command`
- **Network issues**: Check internet connection and firewall settings
- **Disk space**: Ensure sufficient space for virtual environment and packages