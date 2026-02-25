import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { uploadFaceImage, fileToBase64 } from '../utils/firebaseService';
import { verifyFaces } from '../apis/index';

interface FaceVerificationProps {
  onVerificationComplete: (result: FaceVerificationResult) => void;
  onNext: () => void;
  userWalletAddress?: string;
  aadhaarPhotoFromAPI?: string; // Base64 photo extracted from Aadhaar ZIP via API
}

export interface FaceVerificationResult {
  passportImage?: string;
  aadhaarImage?: string;
  liveImage?: string;
  verificationPassed: boolean;
  confidence: number;
  details: {
    passportLiveMatch: boolean;
    aadhaarLiveMatch: boolean;
    passportAadhaarMatch: boolean;
  };
}

interface ImageState {
  file?: File;
  base64?: string;
  uploaded: boolean;
  uploading: boolean;
}

export const FaceVerification: React.FC<FaceVerificationProps> = ({
  onVerificationComplete,
  onNext,
  userWalletAddress,
  aadhaarPhotoFromAPI
}) => {
  const [passportImage, setPassportImage] = useState<ImageState>({
    uploaded: false,
    uploading: false
  });
  const [aadhaarImage, setAadhaarImage] = useState<ImageState>({
    uploaded: !!aadhaarPhotoFromAPI,
    uploading: false,
    base64: aadhaarPhotoFromAPI
  });
  const [liveImage, setLiveImage] = useState<ImageState>({
    uploaded: false,
    uploading: false
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'capture' | 'verify' | 'complete'>('upload');
  
  // Drag and drop state
  const [isDragOverPassport, setIsDragOverPassport] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [captureMode, setCaptureMode] = useState<'passport' | 'aadhaar' | 'live' | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Update aadhaarImage when prop changes
  React.useEffect(() => {
    console.log('FaceVerification: aadhaarPhotoFromAPI prop changed:', {
      hasPhoto: !!aadhaarPhotoFromAPI,
      photoLength: aadhaarPhotoFromAPI?.length,
      photoPreview: aadhaarPhotoFromAPI?.substring(0, 50)
    });
    
    if (aadhaarPhotoFromAPI) {
      // Ensure the base64 string has the correct data URI prefix
      const formattedPhoto = aadhaarPhotoFromAPI.startsWith('data:image') 
        ? aadhaarPhotoFromAPI 
        : `data:image/jpeg;base64,${aadhaarPhotoFromAPI}`;

      setAadhaarImage({
        uploaded: true,
        uploading: false,
        base64: formattedPhoto
      });
    }
  }, [aadhaarPhotoFromAPI]);

  // Cleanup camera on unmount
  React.useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // File input trigger functions
  const triggerPassportUpload = () => {
    console.log('Triggering passport upload...');
    try {
      if (passportInputRef.current) {
        passportInputRef.current.click();
      } else {
        console.error('Passport input ref not found');
        const fallbackInput = document.getElementById('passport-upload') as HTMLInputElement;
        if (fallbackInput) {
          fallbackInput.click();
        } else {
          toast.error('Unable to open file dialog for passport photo');
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error triggering passport upload:', err);
      toast.error('Error opening file dialog: ' + err.message);
    }
  };

  // Aadhaar upload removed - photo comes from API extraction

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPassport(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPassport(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPassport(false);
    
    console.log('File dropped for passport');
    
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
      
      handleFileUpload(fakeEvent, 'passport');
    }
  };

  // Reset image function
  const resetImage = (imageType: 'passport') => {
    if (imageType === 'passport') {
      setPassportImage({ uploaded: false, uploading: false });
      if (passportInputRef.current) {
        passportInputRef.current.value = '';
      }
      toast.info('Passport image cleared');
    }
  };

  // File upload handlers
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'passport'
  ) => {
    console.log(`File upload triggered for ${imageType}`);
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate image file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    try {
      // Set uploading state
      setPassportImage(prev => ({ ...prev, uploading: true }));

      // Convert to base64 for preview and processing
      const base64 = await fileToBase64(file);

      // Upload to Firebase
      const uploadResult = await uploadFaceImage(file, imageType, userWalletAddress);

      // Update state
      const imageState = {
        file,
        base64,
        uploaded: true,
        uploading: false
      };

      setPassportImage(imageState);
      toast.success('Passport photo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload passport image');
      
      // Reset uploading state
      setPassportImage(prev => ({ ...prev, uploading: false }));
    }
  };

  // Camera functions
  const startCamera = useCallback(async (mode: 'live') => {
    setCaptureMode(mode);
    try {
      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Reset readiness state
        setVideoReady(false);
        
        // Wait for video to load metadata
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        };
        
        // Wait for video to be ready to play
        video.oncanplay = () => {
          console.log('Video can play, readyState:', video.readyState);
          setVideoReady(true);
          
          video.play().then(() => {
            console.log('Video playing successfully');
            setCameraActive(true);
          }).catch(playError => {
            console.error('Video play error:', playError);
            toast.error('Failed to start video playback');
          });
        };
        
        // Handle when video starts playing  
        video.onplaying = () => {
          console.log('Video is now playing, readyState:', video.readyState);
        };
        
        // Handle video errors
        video.onerror = (e) => {
          console.error('Video element error:', e);
          toast.error('Video display error occurred');
          setVideoReady(false);
        };
        
        // Handle video stalling
        video.onstalled = () => {
          console.warn('Video stalled');
          setVideoReady(false);
        };
        
        video.onwaiting = () => {
          console.warn('Video waiting for data');
          setVideoReady(false);
        };
      } else {
        console.error('Video ref not available');
        toast.error('Video element not ready');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Camera access error:', err);
      
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions in your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera device found.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += err.message || 'Please check your camera settings.';
      }
      
      toast.error(errorMessage);
      setCameraActive(false);
      setCaptureMode(null);
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setCaptureMode(null);
    setVideoReady(false);
    console.log('Camera stopped');
  }, []);

  const captureImage = useCallback(async () => {
    console.log('Attempting to capture image...');
    
    if (!videoRef.current || !canvasRef.current || !captureMode) {
      console.error('Missing refs or capture mode:', {
        videoRef: !!videoRef.current,
        canvasRef: !!canvasRef.current,
        captureMode
      });
      toast.error('Camera components not ready for capture');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Cannot get canvas 2D context');
      toast.error('Canvas not available for image processing');
      return;
    }

    // Check basic video readiness
    console.log('Video readiness check:', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      paused: video.paused,
      cameraActive: cameraActive
    });

    // Simple readiness check - just ensure video has dimensions and isn't paused
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions not available:', video.videoWidth, 'x', video.videoHeight);
      toast.error('Video dimensions not ready. Please wait a moment and try again.');
      return;
    }

    if (video.paused) {
      console.log('Video is paused, attempting to play...');
      try {
        await video.play();
      } catch (playError) {
        console.error('Failed to resume video:', playError);
        toast.error('Failed to resume video. Please restart the camera.');
        return;
      }
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    console.log('Video size:', video.videoWidth, 'x', video.videoHeight);

    // Draw video frame to canvas (mirror it back for normal orientation)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.8);

    try {
      // Convert base64 to blob for upload
      const response = await fetch(base64);
      const blob = await response.blob();
      const file = new File([blob], `live-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload to Firebase
      setLiveImage(prev => ({ ...prev, uploading: true }));
      const uploadResult = await uploadFaceImage(file, 'live', userWalletAddress);

      // Update state
      setLiveImage({
        file,
        base64,
        uploaded: true,
        uploading: false
      });

      toast.success('Live photo captured successfully');
      stopCamera();
      setCurrentStep('verify');
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture image');
      setLiveImage(prev => ({ ...prev, uploading: false }));
    }
  }, [captureMode, stopCamera, userWalletAddress]);

  // Face verification
  const performFaceVerification = async () => {
    const images = getImagesForAPI();
    
    if (!images.passportBase64 || !images.aadhaarBase64 || !images.liveBase64) {
      toast.error('Please upload all required images first');
      return;
    }

    setIsVerifying(true);

    try {
      // Use real API for face verification
      const apiPayload = {
        passport_image_base64: images.passportBase64,
        aadhaar_image_base64: images.aadhaarBase64,
        live_image_base64: images.liveBase64
      };
      
      console.log('Calling face verification API...');
      const apiResult = await verifyFaces(apiPayload);
      console.log('Face verification API result:', apiResult);

      if (!apiResult.success) {
        throw new Error(apiResult.message || 'Face verification failed');
      }

      const verificationResult: FaceVerificationResult = {
        passportImage: images.passportBase64,
        aadhaarImage: images.aadhaarBase64,
        liveImage: images.liveBase64,
        verificationPassed: apiResult.verified,
        confidence: Math.min(
          Number(apiResult.passport_live_match_percent),
          Number(apiResult.aadhaar_live_match_percent),
          Number(apiResult.passport_aadhaar_match_percent)
        ),
        details: {
          passportLiveMatch: Number(apiResult.passport_live_match_percent) >= Number(apiResult.threshold_percent),
          aadhaarLiveMatch: Number(apiResult.aadhaar_live_match_percent) >= Number(apiResult.threshold_percent),
          passportAadhaarMatch: Number(apiResult.passport_aadhaar_match_percent) >= Number(apiResult.threshold_percent)
        }
      };

      setVerificationResult(verificationResult);
      setCurrentStep('complete');
      onVerificationComplete(verificationResult);

      if (apiResult.verified) {
        toast.success(`Face verification passed! Match scores - Passport-Live: ${Number(apiResult.passport_live_match_percent).toFixed(1)}%, Aadhaar-Live: ${Number(apiResult.aadhaar_live_match_percent).toFixed(1)}%`);
      } else {
        toast.warning('Face verification failed. Please try again with clearer images or better lighting.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Face verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper function to get base64 data for API calls
  const getBase64Images = () => {
    return {
      passportBase64: passportImage.base64,
      aadhaarBase64: aadhaarImage.base64,
      liveBase64: liveImage.base64
    };
  };

  // Function to get images ready for API submission
  const getImagesForAPI = () => {
    const images = getBase64Images();
    console.log('Images prepared for API:', {
      hasPassport: !!images.passportBase64,
      hasAadhaar: !!images.aadhaarBase64,
      hasLive: !!images.liveBase64
    });
    return images;
  };

  const allImagesReady = passportImage.uploaded && !!aadhaarImage.base64 && liveImage.uploaded;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Face Verification
          </CardTitle>
          <CardDescription>
            Upload your passport photo and capture a live selfie. Your Aadhaar photo has been extracted automatically.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Upload Images */}
      {(currentStep === 'upload' || currentStep === 'capture') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Passport Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {passportImage.uploaded ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                Passport Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {passportImage.base64 ? (
                <div className="space-y-3">
                  <img 
                    src={passportImage.base64} 
                    alt="Passport" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <div className="flex justify-between items-center">
                    <Badge variant={passportImage.uploaded ? "default" : "secondary"}>
                      {passportImage.uploaded ? "Uploaded" : "Preview"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => resetImage('passport')}
                      className="text-xs"
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOverPassport 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${
                    isDragOverPassport ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <input
                    ref={passportInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'passport')}
                    className="hidden"
                    id="passport-upload"
                    disabled={passportImage.uploading}
                  />
                  <Button 
                    variant="outline" 
                    disabled={passportImage.uploading}
                    onClick={triggerPassportUpload}
                    className="cursor-pointer"
                  >
                    {passportImage.uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Select Passport Photo'
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    {isDragOverPassport 
                      ? 'Drop your passport photo here' 
                      : 'Click to select or drag & drop your passport photo'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Aadhaar Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Aadhaar Photo (Extracted)
              </CardTitle>
              <CardDescription>
                Photo extracted automatically from your Aadhaar ZIP file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aadhaarImage.base64 ? (
                <div className="space-y-3">
                  <img 
                    src={aadhaarImage.base64} 
                    alt="Aadhaar (Extracted)" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Badge variant="default" className="w-fit">
                    Automatically Extracted
                  </Badge>
                </div>
              ) : (
                <div className="text-center p-6 border rounded-lg bg-muted">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <p className="text-sm text-muted-foreground">
                    Aadhaar photo not available. Please ensure the ZIP file was processed correctly.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Debug: aadhaarPhotoFromAPI = {aadhaarPhotoFromAPI ? 'Available' : 'Not provided'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Live Capture */}
      {passportImage.uploaded && aadhaarImage.base64 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {liveImage.uploaded ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
              Live Photo Capture
            </CardTitle>
            <CardDescription>
              Take a live selfie to complete the verification process
            </CardDescription>
          </CardHeader>
          <CardContent>
            {liveImage.base64 ? (
              <div className="space-y-3">
                <img 
                  src={liveImage.base64} 
                  alt="Live capture" 
                  className="w-full max-w-md h-64 object-cover rounded-lg border mx-auto"
                />
                <Badge variant="default" className="block w-fit mx-auto">
                  Live Photo Captured
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
  {/* Controls */}
  {!cameraActive && (
    <div className="text-center space-y-4">
      <Button onClick={() => startCamera('live')} className="mb-4">
        <Camera className="h-4 w-4 mr-2" />
        Start Camera
      </Button>
      <p className="text-sm text-gray-600">
        Make sure you're in good lighting and looking directly at the camera
      </p>
      {/* Debug section */}
      <div className="text-xs text-gray-400 space-y-1 p-2 bg-gray-50 rounded">
        <p>Camera Status: {cameraActive ? 'Active' : 'Inactive'}</p>
        <p>Video Ready: {videoReady ? 'Yes' : 'No'}</p>
        <p>Capture Mode: {captureMode || 'None'}</p>
        {videoRef.current && (
          <>
            <p>Video State: {videoRef.current.readyState}/4</p>
            <p>Dimensions: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</p>
            <p>Paused: {videoRef.current.paused ? 'Yes' : 'No'}</p>
          </>
        )}
        <p>Base64 Available: P:{!!passportImage.base64} A:{!!aadhaarImage.base64} L:{!!liveImage.base64}</p>
      </div>
    </div>
  )}

  {/* Video area – always rendered */}
  <div className={cameraActive ? 'block' : 'hidden'}>
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      controls={false}
      className="w-full max-w-md h-64 object-cover rounded-lg border mx-auto block"
      style={{ transform: 'scaleX(-1)' }}
      onCanPlay={() => console.log('Video can play')}
      onPlay={() => console.log('Video started playing')}
      onError={(e) => console.error('Video error:', e)}
    />
    <canvas ref={canvasRef} className="hidden" />
    <div className="flex gap-2 justify-center mt-4">
      <Button 
        onClick={captureImage} 
        disabled={liveImage.uploading || !cameraActive}
      >
        {liveImage.uploading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : !cameraActive ? (
          'Starting Camera...'
        ) : (
          'Capture Photo'
        )}
      </Button>
      <Button variant="outline" onClick={stopCamera}>
        Cancel
      </Button>
    </div>
  </div>
</div>

            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Verification */}
      {allImagesReady && (
        <Card>
          <CardHeader>
            <CardTitle>Face Verification</CardTitle>
            <CardDescription>
              Click to verify that all photos belong to the same person
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={performFaceVerification} 
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying Faces...
                </>
              ) : (
                'Start Face Verification'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Results */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationResult.verificationPassed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              Verification Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span>Overall Confidence</span>
                <Badge variant={verificationResult.verificationPassed ? "default" : "destructive"}>
                  {verificationResult.confidence.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={verificationResult.confidence} className="w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {verificationResult.details.passportLiveMatch ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Passport ↔ Live</span>
              </div>
              
              <div className="flex items-center gap-2">
                {verificationResult.details.aadhaarLiveMatch ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Aadhaar ↔ Live</span>
              </div>
              
              <div className="flex items-center gap-2">
                {verificationResult.details.passportAadhaarMatch ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Passport ↔ Aadhaar</span>
              </div>
            </div>

            {verificationResult.verificationPassed ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Face verification completed successfully! All images match with high confidence.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Face verification failed. Please ensure all photos are clear and show the same person.
                </AlertDescription>
              </Alert>
            )}

            {verificationResult.verificationPassed && (
              <Button onClick={onNext} className="w-full">
                Continue to Next Step
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};