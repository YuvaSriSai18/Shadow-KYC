import { useState } from 'react';
import axios from 'axios';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export const usePinataUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadJSON = async (data: any): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      // Mock Pinata upload - replace with real API key in production
      // For demo purposes, we'll simulate the upload
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setProgress(100);

      // Mock response - in production, use:
      // const response = await axios.post(
      //   'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      //   data,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${YOUR_PINATA_JWT}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );
      
      const mockHash = "Qm" + Array.from({ length: 44 }, () => 
        "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
      ).join("");

      setUploading(false);
      return mockHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      return null;
    }
  };

  return { uploadJSON, uploading, progress, error };
};
