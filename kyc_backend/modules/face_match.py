from deepface import DeepFace
import numpy as np
import cv2
import time

# ----------------------------
# Helper functions
# ----------------------------

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

def get_embedding(img_path: str, model_name: str = "Facenet") -> np.ndarray:
    """Get face embedding for an image using DeepFace."""
    reps = DeepFace.represent(
        img_path=img_path,
        model_name=model_name,
        enforce_detection=True
    )
    return np.array(reps[0]["embedding"], dtype=np.float32)

def get_embedding_from_base64(base64_str: str, model_name: str = "Facenet") -> np.ndarray:
    """Get face embedding directly from base64 string."""
    import tempfile
    import base64 as b64
    
    # Remove data URL prefix if present
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    # Decode base64 to bytes
    image_bytes = b64.b64decode(base64_str)
    
    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    temp_file.write(image_bytes)
    temp_file.close()
    
    try:
        # Get embedding using the temporary file
        embedding = get_embedding(temp_file.name, model_name)
        return embedding
    finally:
        # Clean up temporary file
        import os
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

# ----------------------------
# Capture Live Image from Camera
# ----------------------------

def capture_live_image(output_path="live_photo.jpg"):
    """Capture a photo using webcam and save it."""
    cap = cv2.VideoCapture(0)
    print("\n📸 Camera is ON. Look straight into the camera...")

    time.sleep(2)  # Give user 2 sec to prepare

    ret, frame = cap.read()
    if ret:
        cv2.imwrite(output_path, frame)
        print(f"✅ Live image captured and saved as {output_path}")
    else:
        print("❌ Failed to capture image from camera.")
    
    cap.release()
    cv2.destroyAllWindows()

# ----------------------------
# Face Verification Logic
# ----------------------------

def verify_user(passport_img_path, aadhaar_img_path, live_img_path,
                threshold=75.0, model_name="Facenet") -> dict:

    # 1. Get embeddings
    vP = get_embedding(passport_img_path, model_name=model_name)
    vA = get_embedding(aadhaar_img_path, model_name=model_name)
    vL = get_embedding(live_img_path, model_name=model_name)

    # 2. Compute cosine similarities
    sim_PL = cosine_similarity(vP, vL)  # passport vs live
    sim_AL = cosine_similarity(vA, vL)  # aadhaar vs live
    sim_PA = cosine_similarity(vP, vA)  # passport vs aadhaar

    # 3. Convert to percentages
    match_PL = similarity_to_percent(sim_PL)
    match_AL = similarity_to_percent(sim_AL)
    match_PA = similarity_to_percent(sim_PA)

    # 4. Apply threshold
    verified = (match_PL >= threshold) and (match_AL >= threshold)

    return {
        "passport_live_match_percent": match_PL,
        "aadhaar_live_match_percent": match_AL,
        "passport_aadhaar_match_percent": match_PA,
        "threshold_percent": threshold,
        "verified": verified
    }

def verify_base64_images(image1_b64: str, image2_b64: str, threshold: float = 75.0, model_name: str = "Facenet") -> dict:
    """Verify two base64 images directly without file operations."""
    # Get embeddings from base64 strings
    embedding1 = get_embedding_from_base64(image1_b64, model_name)
    embedding2 = get_embedding_from_base64(image2_b64, model_name)
    
    # Calculate similarity
    similarity = cosine_similarity(embedding1, embedding2)
    match_percentage = similarity_to_percent(similarity)
    
    # Check if match exceeds threshold
    is_match = match_percentage >= threshold
    
    return {
        "match_percentage": match_percentage,
        "is_match": is_match,
        "threshold": threshold,
        "similarity_score": similarity
    }

# ----------------------------
# Main Execution
# ----------------------------

if __name__ == "__main__":
    passport_img = r"D:\My Learnings\Block-Chain\passport_pic.jpg"
    aadhaar_img = r"D:\My Learnings\Block-Chain\aadhar.jpg"
    live_img = r"D:\My Learnings\Block-Chain\live.jpg"

    # Step 1: Capture Live Image
    capture_live_image(live_img)

    # Step 2: Verify
    threshold = 75.0
    result = verify_user(passport_img, aadhaar_img, live_img, threshold)

    print("\n🔍 Verification Results:")
    print("Passport vs Live Match: ", result["passport_live_match_percent"], "%")
    print("Aadhaar vs Live Match:  ", result["aadhaar_live_match_percent"], "%")
    print("Passport vs Aadhaar:    ", result["passport_aadhaar_match_percent"], "%")
    print("Threshold:              ", result["threshold_percent"], "%")
    print("Final Verification:     ", "✅ VERIFIED" if result["verified"] else "❌ NOT VERIFIED")
