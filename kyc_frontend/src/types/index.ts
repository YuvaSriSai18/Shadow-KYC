// Bucket info returned from chain
export interface BucketInfo {
  userId: string;
  mspId: string;
  isPrivate: boolean;
  root: string;
}

// KYC data structure for storage
export interface KYCDataToStore {
  name: string;
  dob: string;
  gender: string;
  state: string;
}

// Storage result
export interface StorageResult {
  bucketId: string;
  fileKey: string;
  authenticated: boolean;
  timestamp: string;
  success: boolean;
}
