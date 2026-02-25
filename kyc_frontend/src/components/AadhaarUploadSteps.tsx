import React, { useState } from "react";
import {
  FileArchive,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { uploadAadhaarZip, debugFirebase } from "../utils/firebaseService";
import * as API from '../apis/index';
interface AadhaarUploadStepsProps {
  onUploadComplete: (uploadResult: AadhaarUploadResult) => void;
  onNext: () => void;
  userWalletAddress?: string;
}

export interface AadhaarUploadResult {
  fileName: string;
  uploadUrl: string;
  fileSize: number;
  uploadedAt: Date;
  metadata: {
    originalName: string;
    mimeType: string;
  };
  // API extracted data
  extractedData?: {
    name: string;
    dob: string;
    gender: string;
    address: {
      house: string;
      street: string;
      vtc: string;
      dist: string;
      state: string;
      pincode: string;
    };
    success: boolean;
    message: string;
  };
  extractedPhoto?: string; // Base64 photo from API
  shareCode?: string; // Share code used for API call
}

export const AadhaarUploadSteps: React.FC<AadhaarUploadStepsProps> = ({
  onUploadComplete,
  onNext,
  userWalletAddress,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<AadhaarUploadResult | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  
  // Ref for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form state for Aadhaar details (optional, for validation)
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [password, setPassword] = useState("");
  
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  
  // API processing states
  const [isProcessingAPI, setIsProcessingAPI] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      title: "Visit UIDAI Website",
      description:
        "Go to the official Aadhaar website to download your offline eKYC",
      completed: false,
    },
    {
      id: 2,
      title: "Enter Aadhaar Details",
      description: "Fill in your Aadhaar number and create a secure password",
      completed: false,
    },
    {
      id: 3,
      title: "Download ZIP File",
      description: "Download the offline eKYC ZIP file to your device",
      completed: false,
    },
    {
      id: 4,
      title: "Upload ZIP File",
      description: "Upload the downloaded ZIP file for processing",
      completed: false,
    },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log('File input change event triggered');
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate file type - check both extension and MIME type
    const isZipFile = file.name.toLowerCase().endsWith(".zip") || 
                      file.type === "application/zip" || 
                      file.type === "application/x-zip-compressed";
    
    if (!isZipFile) {
      toast.error("Please select a ZIP file. Selected file type: " + file.type);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed is 50MB.`);
      return;
    }

    // Check if file is not empty
    if (file.size === 0) {
      toast.error("Selected file is empty. Please choose a valid ZIP file.");
      return;
    }

    setUploadedFile(file);
    toast.success("ZIP file selected successfully");
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    console.log('File dropped');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      console.log('Dropped file:', file.name, file.type, file.size);
      
      // Create a fake FileList and event
      const dt = new DataTransfer();
      dt.items.add(file);
      
      const fakeEvent = {
        target: { files: dt.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(fakeEvent);
    }
  };

  const performUpload = async () => {
    if (!uploadedFile) {
      toast.error("Please select a ZIP file first");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter the share code/password for the ZIP file");
      return;
    }

    console.log('Starting upload for file:', uploadedFile.name, uploadedFile.type);
    setIsUploading(true);
    setApiError(null);

    try {
      // Step 1: Upload ZIP file to Firebase
      toast.loading("Uploading ZIP file to storage...", { id: "upload-progress" });
      
      const firebaseResult = await uploadAadhaarZip(uploadedFile, userWalletAddress);
      console.log('Firebase upload successful:', firebaseResult);

      // Step 2: Call API to extract Aadhaar data
      toast.loading("Processing Aadhaar data...", { id: "upload-progress" });
      setIsProcessingAPI(true);
      
      const apiPayload = {
        zip_url: firebaseResult.downloadURL,
        share_code: password.trim()
      };
      
      console.log('Calling API with:', apiPayload);
      const extractedData = await API.getAadharDetails(apiPayload);
      console.log('API extraction successful:', extractedData);

      if (!extractedData.success) {
        throw new Error(extractedData.message || "Failed to extract Aadhaar data");
      }

      // Step 3: Create complete upload result
      const uploadResult: AadhaarUploadResult = {
        fileName: firebaseResult.fileName,
        uploadUrl: firebaseResult.downloadURL,
        fileSize: uploadedFile.size,
        uploadedAt: new Date(),
        metadata: {
          originalName: uploadedFile.name,
          mimeType: uploadedFile.type,
        },
        extractedData: {
          name: extractedData.name,
          dob: extractedData.dob,
          gender: extractedData.gender,
          address: extractedData.address,
          success: extractedData.success,
          message: extractedData.message
        },
        extractedPhoto: extractedData.photo_base64,
        shareCode: password
      };

      setUploadResult(uploadResult);
      setCurrentStep(5); // Move to completion step
      onUploadComplete(uploadResult);
      
      // Dismiss loading toast and show success
      toast.dismiss("upload-progress");
      toast.success("Aadhaar ZIP processed successfully! Photo extracted for verification.");
      
    } catch (error: any) {
      console.error("Upload/API error:", error);
      
      // Dismiss loading toast
      toast.dismiss("upload-progress");
      
      // Show specific error message
      const errorMessage = error?.message || "Unknown error occurred";
      setApiError(errorMessage);
      toast.error(`Processing failed: ${errorMessage}`);
      
      // Reset file selection on certain errors
      if (errorMessage.includes("Invalid file type") || 
          errorMessage.includes("File size") ||
          errorMessage.includes("Invalid share code")) {
        if (errorMessage.includes("Invalid share code")) {
          setPassword(""); // Clear password on auth error
        } else {
          setUploadedFile(null); // Clear file on file error
        }
      }
    } finally {
      setIsUploading(false);
      setIsProcessingAPI(false);
    }
  };

  const validateAadhaarNumber = (number: string): boolean => {
    // Basic Aadhaar number validation (12 digits)
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(number.replace(/\s/g, ""));
  };

  const formatAadhaarNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Limit to 12 digits
    const limitedDigits = digits.slice(0, 12);

    // Add spaces every 4 digits
    return limitedDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const handleAadhaarNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatAadhaarNumber(e.target.value);
    setAadhaarNumber(formatted);
  };

  const triggerFileSelect = () => {
    console.log('Triggering file select...');
    try {
      if (fileInputRef.current) {
        console.log('File input ref found, clicking...');
        fileInputRef.current.click();
      } else {
        console.error('File input ref not found');
        // Fallback: try to find by ID
        const fallbackInput = document.getElementById('zip-upload') as HTMLInputElement;
        if (fallbackInput) {
          console.log('Using fallback input click');
          fallbackInput.click();
        } else {
          console.error('Both ref and ID method failed');
          toast.error('Unable to open file dialog. Please try refreshing the page.');
        }
      }
    } catch (error) {
      console.error('Error triggering file select:', error);
      toast.error('Error opening file dialog: ' + (error as Error).message);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-6 w-6" />
            Aadhaar Upload Process
          </CardTitle>
          <CardDescription>
            Follow these steps to download and upload your offline Aadhaar eKYC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(currentStep - 1) * 25} className="w-full" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Step {Math.min(currentStep, 4)} of 4</span>
            <span>{Math.min(currentStep - 1, 4) * 25}% Complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Visit UIDAI Website */}
      <Card className={currentStep === 1 ? "border-blue-500" : ""}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                currentStep > 1
                  ? "bg-green-500 text-white"
                  : currentStep === 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            Visit UIDAI Official Website
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Go to the official UIDAI website to access the offline eKYC
              service
            </p>
            <Button
              onClick={() => {
                window.open(
                  "https://myaadhaar.uidai.gov.in/offline-ekyc",
                  "_blank"
                );
                setCurrentStep(2);
              }}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open UIDAI Website
            </Button>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure you're using the official UIDAI website. Never share
                your Aadhaar details on unofficial sites.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Enter Aadhaar Details */}
      {currentStep >= 2 && (
        <Card className={currentStep === 2 ? "border-blue-500" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  currentStep > 2
                    ? "bg-green-500 text-white"
                    : currentStep === 2
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : "2"}
              </div>
              Enter Your Aadhaar Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="aadhaar-number">
                  Aadhaar Number (Optional for verification)
                </Label>
                <Input
                  id="aadhaar-number"
                  value={aadhaarNumber}
                  onChange={handleAadhaarNumberChange}
                  placeholder="1234 5678 9012"
                  maxLength={14} // 12 digits + 2 spaces
                />
                {aadhaarNumber && !validateAadhaarNumber(aadhaarNumber) && (
                  <p className="text-sm text-red-500 mt-1">
                    Please enter a valid 12-digit Aadhaar number
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="zip-password">
                  ZIP File Password (for reference)
                </Label>
                <div className="relative">
                  <Input
                    id="zip-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password for ZIP file"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Remember this password - you'll need it to extract the ZIP
                  file
                </p>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  How to Download Your Aadhaar Offline eKYC:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>
                    • Go to the official UIDAI website and log in using your
                    Aadhaar details
                  </li>
                  <li>
                    • Navigate to the “Offline eKYC” or “Aadhaar Paperless
                    Offline eKYC” section
                  </li>
                  <li>
                    • Enter your Aadhaar number and create a 4-digit Share Code
                    (you will need this later)
                  </li>
                  <li>
                    • Complete the captcha and verify using the OTP sent to your
                    registered mobile number
                  </li>
                  <li>
                    • Download the ZIP file containing your Aadhaar Offline eKYC
                    data
                  </li>
                  <li>
                    • Return to our website and upload the downloaded ZIP file
                  </li>
                  <li>
                    • Enter the same 4-digit Share Code and process your eKYC
                    information
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => setCurrentStep(3)}
                className="w-full"
                disabled={
                  aadhaarNumber && !validateAadhaarNumber(aadhaarNumber)
                }
              >
                Continue to Download Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Download ZIP File */}
      {currentStep >= 3 && (
        <Card className={currentStep === 3 ? "border-blue-500" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  currentStep > 3
                    ? "bg-green-500 text-white"
                    : currentStep === 3
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : "3"}
              </div>
              Download ZIP File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  After completing the OTP verification on UIDAI website,
                  download the ZIP file to your device.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What to expect:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>
                    • The ZIP file will be downloaded to your default download
                    folder
                  </li>
                  <li>• File size is typically 1-5 MB</li>
                  <li>• The file contains your Aadhaar data in XML format</li>
                  <li>• Keep the file secure and don't share it with anyone</li>
                </ul>
              </div>

              <Button onClick={() => setCurrentStep(4)} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />I have downloaded the
                ZIP file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Upload ZIP File */}
      {currentStep >= 4 && (
        <Card className={currentStep === 4 ? "border-blue-500" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  uploadResult
                    ? "bg-green-500 text-white"
                    : currentStep === 4
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {uploadResult ? <CheckCircle className="h-4 w-4" /> : "4"}
              </div>
              Upload ZIP File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!uploadedFile ? (
                <div className="space-y-4">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <FileArchive className={`h-16 w-16 mx-auto mb-4 ${
                      isDragOver ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,application/zip,application/x-zip-compressed"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="zip-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={triggerFileSelect}
                      className="cursor-pointer mb-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select ZIP File
                    </Button>
                    <p className="text-sm text-gray-500">
                      {isDragOver 
                        ? 'Drop your ZIP file here' 
                        : 'Click to select or drag & drop your Aadhaar eKYC ZIP file'
                      }
                    </p>
                  </div>
                  
                  {/* Debug info */}
                  <div className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const status = debugFirebase();
                        toast.info(`Upload Mode: ${status.mode} | Project: ${status.config.projectId}`);
                      }}
                      className="text-xs text-gray-400"
                    >
                      Check Upload Status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileArchive className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Ready</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                            toast.info('File selection cleared');
                          }}
                          className="text-xs"
                        >
                          Change File
                        </Button>
                      </div>
                    </div>
                  </div>

                  {!uploadResult && (
                    <>
                      <Button
                        onClick={performUpload}
                        disabled={!uploadedFile || isUploading || !password.trim()}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            {isProcessingAPI ? 'Processing Aadhaar Data...' : 'Uploading...'}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload & Process ZIP File
                          </>
                        )}
                      </Button>
                      
                      {apiError && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-600">
                            {apiError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Success */}
      {uploadResult && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Upload Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Aadhaar eKYC ZIP file has been uploaded securely. You can
                  now proceed to the next step.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* File Info */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Upload Details</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">File:</span>
                    <span className="text-gray-600">{uploadResult.metadata.originalName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Size:</span>
                    <span className="text-gray-600">{(uploadResult.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Uploaded:</span>
                    <span className="text-gray-600">{uploadResult.uploadedAt.toLocaleString()}</span>
                  </div>
                </div>

                {/* Extracted Data */}
                {uploadResult.extractedData && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-green-800">Extracted Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-gray-700">{uploadResult.extractedData.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">DOB:</span>
                        <p className="text-gray-700">{uploadResult.extractedData.dob}</p>
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span>
                        <p className="text-gray-700">{uploadResult.extractedData.gender}</p>
                      </div>
                      <div>
                        <span className="font-medium">State:</span>
                        <p className="text-gray-700">{uploadResult.extractedData.address.state}</p>
                      </div>
                    </div>
                    {uploadResult.extractedPhoto && (
                      <div className="mt-3">
                        <span className="font-medium text-green-800">✓ Photo extracted for face verification</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={onNext} className="w-full">
                Continue to Face Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
