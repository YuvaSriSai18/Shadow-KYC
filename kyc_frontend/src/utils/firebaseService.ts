import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBM4Ovh9vntFKb88UcTAikp3RTHY8tOgq0",
  authDomain: "yuvasrisai18.firebaseapp.com",
  projectId: "yuvasrisai18",
  storageBucket: "yuvasrisai18.appspot.com",
  messagingSenderId: "768724746378",
  appId: "1:768724746378:web:84fb91e17bcfbf1099ad73"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = (
  firebaseConfig.apiKey !== "demo-api-key" && 
  firebaseConfig.projectId !== "kyc-verification-demo"
);

// Initialize Firebase if properly configured
let app: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured, using simulation mode');
}

export interface UploadResult {
  downloadURL: string;
  fileName: string;
  size: number;
  type: string;
}

/**
 * Simulates file upload when Firebase is not available
 */
const simulateUpload = async (file: File, folder: string, userId?: string): Promise<UploadResult> => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const timestamp = new Date().getTime();
  const userId_prefix = userId ? `${userId}/` : '';
  const fileName = `${userId_prefix}${timestamp}_${file.name}`;
  
  return {
    downloadURL: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(folder + '/' + fileName)}?alt=media`,
    fileName: fileName,
    size: file.size,
    type: file.type
  };
};

/**
 * Uploads a file to Firebase Storage
 */
export const uploadFileToFirebase = async (
  file: File,
  folder: string = 'kyc-documents',
  userId?: string
): Promise<UploadResult> => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Validate file type for KYC documents
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only ZIP, PDF, and image files are allowed.');
    }

    // If Firebase is not configured, use simulation
    if (!storage || !isFirebaseConfigured) {
      console.warn('Firebase not available, using simulation mode');
      toast.success('File uploaded successfully (Simulation Mode)');
      return simulateUpload(file, folder, userId);
    }

    // Generate unique filename
    const timestamp = new Date().getTime();
    const userId_prefix = userId ? `${userId}/` : '';
    const fileName = `${userId_prefix}${timestamp}_${file.name}`;
    const filePath = `${folder}/${fileName}`;

    // Create storage reference
    const storageRef = ref(storage, filePath);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
        originalName: file.name
      }
    };

    // Upload the file
    const uploadSnapshot = await uploadBytes(storageRef, file, metadata);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadSnapshot.ref);

    toast.success('File uploaded successfully');

    return {
      downloadURL,
      fileName: fileName,
      size: file.size,
      type: file.type
    };

  } catch (error) {
    console.error('Firebase upload error:', error);
    toast.error(`Upload failed: ${error.message}`);
    throw error;
  }
};

/**
 * Uploads Aadhaar ZIP file specifically
 */
export const uploadAadhaarZip = async (
  file: File,
  userId?: string
): Promise<UploadResult> => {
  // Validate that it's a ZIP file
  if (!file.type.includes('zip')) {
    throw new Error('Please select a ZIP file containing your Aadhaar XML');
  }

  return uploadFileToFirebase(file, 'aadhaar-documents', userId);
};

/**
 * Uploads face images for verification
 */
export const uploadFaceImage = async (
  file: File,
  imageType: 'passport' | 'aadhaar' | 'live',
  userId?: string
): Promise<UploadResult> => {
  // Validate that it's an image file
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  return uploadFileToFirebase(file, `face-images/${imageType}`, userId);
};

/**
 * Deletes a file from Firebase Storage
 */
export const deleteFileFromFirebase = async (downloadURL: string): Promise<void> => {
  try {
    const fileRef = ref(storage, downloadURL);
    await deleteObject(fileRef);
    toast.success('File deleted successfully');
  } catch (error) {
    console.error('Firebase delete error:', error);
    toast.error('Failed to delete file');
    throw error;
  }
};

/**
 * Converts file to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Validates file before upload
 */
export const validateFile = (
  file: File,
  maxSizeMB: number = 50,
  allowedTypes: string[] = ['application/zip', 'image/jpeg', 'image/png', 'application/pdf']
): { valid: boolean; error?: string } => {
  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Tests Firebase connection and configuration
 */
export const testFirebaseConnection = (): { connected: boolean; mode: string; config: any } => {
  return {
    connected: isFirebaseConfigured && !!storage,
    mode: isFirebaseConfigured ? 'Firebase' : 'Simulation',
    config: {
      projectId: firebaseConfig.projectId,
      configured: isFirebaseConfigured
    }
  };
};

/**
 * Debug function to log Firebase status
 */
export const debugFirebase = () => {
  const status = testFirebaseConnection();
  console.log('Firebase Status:', status);
  return status;
};