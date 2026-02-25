/**
 * storageService.ts - High-level wrapper for DataHaven storage operations
 * 
 * This service wraps the bucket and file operations to provide
 * easy-to-use functions for storing and retrieving KYC data.
 */

import { createBucket, getBucket, getBucketsFromMSP, waitForBackendBucketReady } from '../operations/bucketOperations';
import { uploadFile, waitForBackendFileReady, downloadFile, getBucketFilesFromMSP } from '../operations/fileOperations';
import {
  connectWallet,
  getConnectedAddress,
  getStorageHubClient,
  initPolkadotApi,
  isWalletConnected,
  isPolkadotApiReady,
  restoreWalletConnection,
} from './clientService';
import {
  connectToMsp,
  authenticateUser,
  isAuthenticated,
  getMspInfo,
  getValueProps,
  isMspConnected,
} from './mspService';
import type { KYCDataToStore, StorageResult } from '../types';

/**
 * Initialize all services needed for storage operations
 */
export async function initializeStorageServices(): Promise<void> {
  console.log('[StorageService] Initializing storage services...');
  
  // Connect wallet if not already connected
  if (!isWalletConnected()) {
    console.log('[StorageService] Connecting wallet...');
    await connectWallet();
  }
  
  // Initialize Polkadot API for chain queries
  console.log('[StorageService] Initializing Polkadot API...');
  await initPolkadotApi();
  
  // Connect to MSP
  console.log('[StorageService] Connecting to MSP...');
  await connectToMsp();
  
  console.log('[StorageService] ✅ All services initialized');
}

/**
 * Store KYC data on DataHaven
 * Creates a bucket (if needed), authenticates, and uploads the KYC data as a file
 */
export async function storeKycDataOnDataHaven(
  kycData: KYCDataToStore
): Promise<StorageResult> {
  const timestamp = new Date().toISOString();
  
  console.log('[StorageService] ──────────────────────────────────────────');
  console.log('[StorageService] Starting KYC data storage flow');
  console.log('[StorageService] ──────────────────────────────────────────');

  try {
    // ────────────────────────────────────────────────────────────────────────────
    // STEP 1: Ensure all services are initialized (each check is idempotent)
    // ────────────────────────────────────────────────────────────────────────────
    console.log('[StorageService] STEP 1: Ensuring all services are ready...');

    // 1a. Wallet
    if (!isWalletConnected()) {
      console.log('[StorageService] Wallet not connected, connecting...');
      await connectWallet();
    }
    const walletAddress = getConnectedAddress();
    if (!walletAddress) throw new Error('Wallet not connected');
    console.log('[StorageService] ✓ Wallet:', walletAddress);

    // 1b. Polkadot API (needed for on-chain bucket creation)
    if (!isPolkadotApiReady()) {
      console.log('[StorageService] Polkadot API not ready, initializing...');
      await initPolkadotApi();
    }
    console.log('[StorageService] ✓ Polkadot API ready');

    // 1c. MSP client
    if (!isMspConnected()) {
      console.log('[StorageService] MSP not connected, connecting...');
      await connectToMsp();
    }
    console.log('[StorageService] ✓ MSP connected');

    // ────────────────────────────────────────────────────────────────────────────
    // STEP 2: Authenticate with SIWE
    // ────────────────────────────────────────────────────────────────────────────
    console.log('[StorageService] STEP 2: Authenticating with SIWE...');
    
    if (!isAuthenticated()) {
      await authenticateUser();
    }
    console.log('[StorageService] ✓ SIWE authentication successful');

    // ────────────────────────────────────────────────────────────────────────────
    // STEP 3: Create bucket
    // ────────────────────────────────────────────────────────────────────────────
    console.log('[StorageService] STEP 3: Creating bucket...');
    
    // Use wallet address as the bucket name so bucket ID is deterministic per user
    const bucketName = walletAddress.toLowerCase();
    let bucketId: string;
    
    try {
      // Private bucket — only the owner can read/write
      const result = await createBucket(bucketName, true);
      bucketId = result.bucketId;
      console.log('[StorageService] ✓ Private bucket created:', bucketId);
      
      // Wait for backend to index the bucket
      console.log('[StorageService] Waiting for backend to index bucket...');
      await waitForBackendBucketReady(bucketId);
      console.log('[StorageService] ✓ Bucket ready in backend');
    } catch (err: any) {
      // Check if bucket already exists — reuse it
      if (err.message?.includes('already exists')) {
        console.log('[StorageService] ℹ Bucket already exists, reusing...');
        const storageClient = getStorageHubClient();
        bucketId = await storageClient.deriveBucketId(walletAddress, bucketName) as string;
        console.log('[StorageService] ✓ Using existing bucket:', bucketId);
      } else {
        throw err;
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // STEP 4: Prepare and upload KYC data file
    // ────────────────────────────────────────────────────────────────────────────
    console.log('[StorageService] STEP 4: Uploading KYC data...');
    
    const kycFileContent = JSON.stringify({
      aadhaarData: kycData.aadhaarData,
      images: kycData.images,
      metadata: {
        timestamp,
        version: '2.0',
        owner: walletAddress,
      },
    }, null, 2);
    
    const fileName = `kyc-data-${Date.now()}.json`;
    const file = new File([kycFileContent], fileName, { type: 'application/json' });
    
    const uploadResult = await uploadFile(bucketId, file);
    console.log('[StorageService] ✓ File uploaded, key:', uploadResult.fileKey);
    
    // Wait for file to be ready
    console.log('[StorageService] Waiting for file to be ready in backend...');
    await waitForBackendFileReady(bucketId, uploadResult.fileKey);
    console.log('[StorageService] ✓ File ready in backend');

    // ────────────────────────────────────────────────────────────────────────────
    // STEP 5: Return result
    // ────────────────────────────────────────────────────────────────────────────
    const result: StorageResult = {
      bucketId,
      fileKey: uploadResult.fileKey,
      authenticated: isAuthenticated(),
      timestamp,
      success: true,
    };

    console.log('[StorageService] ──────────────────────────────────────────');
    console.log('[StorageService] ✓ KYC data stored successfully');
    console.log('[StorageService]   Bucket ID:', bucketId);
    console.log('[StorageService]   File Key:', uploadResult.fileKey);
    console.log('[StorageService] ──────────────────────────────────────────');

    return result;

  } catch (error) {
    console.error('[StorageService] ──────────────────────────────────────────');
    console.error('[StorageService] ✗ Storage flow failed');
    console.error('[StorageService]   Error:', error);
    console.error('[StorageService] ──────────────────────────────────────────');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to store KYC data on DataHaven: ${errorMessage}`);
  }
}

/**
 * Test bucket creation and file upload
 */
export async function testBucketAndFileUpload(): Promise<StorageResult> {
  console.log('[StorageService] Testing bucket creation and file upload...');
  
  const testData: KYCDataToStore = {
    aadhaarData: {
      fileName: 'test-aadhaar.zip',
      uploadedAt: new Date().toISOString(),
      extractedData: {
        name: 'Test User',
        dob: '1990-01-15',
        gender: 'M',
        state: 'California',
      },
    },
    images: {
      aadhaarImage: 'data:image/png;base64,TEST_AADHAAR_IMAGE',
      liveImage: 'data:image/png;base64,TEST_LIVE_IMAGE',
      passportImage: 'data:image/png;base64,TEST_PASSPORT_IMAGE',
    },
  };

  return storeKycDataOnDataHaven(testData);
}

/**
 * Upload a file to a specific bucket
 */
export async function uploadFileToDataHaven(
  bucketId: string,
  fileName: string,
  fileContent: string,
  contentType: string = 'application/json'
): Promise<{ success: boolean; bucketId: string; fileName: string; fileKey: string; size: number }> {
  console.log('[StorageService] Uploading file to bucket:', { bucketId, fileName });
  
  // Ensure authenticated
  if (!isAuthenticated()) {
    await authenticateUser();
  }
  
  // Create file from content
  const file = new File([fileContent], fileName, { type: contentType });
  
  // Upload file
  const result = await uploadFile(bucketId, file);
  
  // Wait for file to be ready
  await waitForBackendFileReady(bucketId, result.fileKey);
  
  console.log('[StorageService] ✓ File uploaded successfully');
  
  return {
    success: true,
    bucketId,
    fileName,
    fileKey: result.fileKey,
    size: file.size,
  };
}

/**
 * Get bucket info
 */
export async function getBucketInfo(bucketId: string): Promise<{
  bucketId: string;
  exists: boolean;
  fileCount: number;
}> {
  console.log('[StorageService] Getting bucket info:', bucketId);
  
  try {
    const bucket = await getBucket(bucketId);
    const files = await getBucketFilesFromMSP(bucketId);
    
    return {
      bucketId,
      exists: true,
      fileCount: files.files?.length || 0,
    };
  } catch {
    return {
      bucketId,
      exists: false,
      fileCount: 0,
    };
  }
}

/**
 * List all user buckets
 */
export async function listUserBuckets() {
  console.log('[StorageService] Listing user buckets...');
  return getBucketsFromMSP();
}

/**
 * Download a file from DataHaven
 */
export async function downloadFileFromDataHaven(fileKey: string): Promise<Blob> {
  console.log('[StorageService] Downloading file:', fileKey);
  return downloadFile(fileKey);
}

// Re-export types
export type { StorageResult, KYCDataToStore };
