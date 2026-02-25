#!/usr/bin/env python3
"""
Simple test to check if DeepFace and dependencies are working
"""

print("🔍 Testing DeepFace installation...")

try:
    print("1. Importing DeepFace...")
    from deepface import DeepFace
    print("✅ DeepFace imported successfully")
    
    print("2. Importing NumPy...")
    import numpy as np
    print("✅ NumPy imported successfully")
    
    print("3. Importing OpenCV...")
    import cv2
    print("✅ OpenCV imported successfully")
    
    print("4. Testing face_match module...")
    import sys
    import os
    sys.path.insert(0, 'modules')
    
    try:
        import face_match
        print("✅ face_match module imported successfully")
        
        # Test the functions exist
        if hasattr(face_match, 'get_embedding'):
            print("✅ get_embedding function found")
        if hasattr(face_match, 'cosine_similarity'):
            print("✅ cosine_similarity function found")
        if hasattr(face_match, 'similarity_to_percent'):
            print("✅ similarity_to_percent function found")
            
    except ImportError as e:
        print(f"❌ Failed to import face_match: {e}")
        
    print("5. Testing aadhar_xml module...")
    try:
        import aadhar_xml
        print("✅ aadhar_xml module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import aadhar_xml: {e}")
        
    print("\n🎉 All basic tests completed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Try installing missing packages:")
    print("   pip install deepface opencv-python numpy tensorflow")
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")