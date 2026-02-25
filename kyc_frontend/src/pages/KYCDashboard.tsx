import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressTracker } from "@/components/ProgressTracker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { AadhaarUploadSteps, AadhaarUploadResult } from "@/components/AadhaarUploadSteps";
import { FaceVerification, FaceVerificationResult } from "../components/FaceVerification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { VerificationTab } from "@/components/VerificationTab";
import { Shield, FileText, Camera, Verified, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { generateKycProofOnBackend, type KYCFlags } from "../apis/backendProofService";
import { parsePublicSignals } from "../utils/zkp";
import { storeKycDataOnDataHaven, type StorageResult } from "../services/storageService";
import { getConnectedAddress } from "../services/clientService";

interface KYCData {
  age: string;
  nationality: string;
  attributes: string;
}

const KYCDashboard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  
  // KYC flow state
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);

  // Aadhaar and face verification state
  const [aadhaarUploadResult, setAadhaarUploadResult] = useState<AadhaarUploadResult | null>(null);
  const [faceVerificationResult, setFaceVerificationResult] = useState<FaceVerificationResult | null>(null);
  const [kycStepCompleted, setKycStepCompleted] = useState({
    aadhaarUpload: false,
    faceVerification: false,
    kycForm: false,
    proofGeneration: false,
    nftMinting: false
  });

  // ZK Proof state
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [zkProofResult, setZkProofResult] = useState<any>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofJson, setProofJson] = useState<any>(null);
  const [publicJson, setPublicJson] = useState<any>(null);
  const [storageResult, setStorageResult] = useState<StorageResult | null>(null);
  const [isStoringData, setIsStoringData] = useState(false);

  const handleKYCSubmit = (data: KYCData) => {
    setKycData(data);
    setKycStepCompleted(prev => ({ ...prev, kycForm: true }));
    setCurrentStep(1);
  };

  const handleAadhaarUpload = (result: AadhaarUploadResult) => {
    setAadhaarUploadResult(result);
    setKycStepCompleted(prev => ({ ...prev, aadhaarUpload: true }));
  };

  const handleFaceVerification = (result: FaceVerificationResult) => {
    setFaceVerificationResult(result);
    setKycStepCompleted(prev => ({ ...prev, faceVerification: true }));
  };

  const moveToNextTab = () => {
    if (activeTab === "upload") {
      setActiveTab("verify");
    } else if (activeTab === "verify") {
      setActiveTab("proof");
    } else if (activeTab === "proof") {
      setActiveTab("nft");
    }
  };

  // Extract KYC verification flags
  const extractKycFlags = (): KYCFlags => {
    let ageVerified = false;
    if (aadhaarUploadResult?.extractedData?.dob) {
      const dob = new Date(aadhaarUploadResult.extractedData.dob);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      ageVerified = age >= 18;
    }

    const govtIdVerified = aadhaarUploadResult?.extractedData?.success === true;
    const faceVerified = faceVerificationResult?.details?.passportAadhaarMatch === true;
    const livenessVerified = (
      faceVerificationResult?.details?.aadhaarLiveMatch === true &&
      faceVerificationResult?.details?.passportLiveMatch === true
    );

    console.log('KYC Flags extracted:', {
      ageVerified,
      govtIdVerified,
      faceVerified,
      livenessVerified
    });

    return {
      ageNatOK: ageVerified ? 1 : 0,
      govtIdOK: govtIdVerified ? 1 : 0,
      faceOK: faceVerified ? 1 : 0,
      livenessOK: livenessVerified ? 1 : 0,
    };
  };

  // Generate ZK proof (backend only, no blockchain submission)
  const handleGenerateZkProof = async () => {
    if (!aadhaarUploadResult || !faceVerificationResult) {
      toast.error('Please complete Aadhaar upload and face verification first');
      return;
    }

    setIsGeneratingProof(true);
    setProofError(null);
    
    try {
      const flags = extractKycFlags();
      
      console.log('Starting backend ZK proof generation with flags:', flags);
      toast.info('Generating zero-knowledge proof on backend... This may take a few minutes.');
      
      const result = await generateKycProofOnBackend(flags);
      
      console.log('ZK proof generated successfully from backend:', result);
      
      const parsedSignals = parsePublicSignals(result.publicSignals);
      const statusBits = parsedSignals.statusBits;
      const level = parsedSignals.level;
      const credentialHash = parsedSignals.credentialHash;
      
      const enrichedResult = {
        ...result,
        statusBits,
        level,
        credentialHash: credentialHash.toString(),
        isValidOffchain: true
      };
      
      setZkProofResult(enrichedResult);
      setProofData(enrichedResult);
      
      // Create proof.json and public.json for download
      const proofJsonData = {
        proof: result.proof,
        credentialHash: result.credentialHash,
        timestamp: new Date().toISOString(),
        algorithm: "Groth16",
        curve: "bn128"
      };
      
      const publicJsonData = {
        publicSignals: result.publicSignals,
        statusBits: statusBits.toString(),
        level: level.toString(),
        credentialHash: credentialHash.toString(),
        isValidOffchain: true,
        timestamp: new Date().toISOString()
      };
      
      setProofJson(proofJsonData);
      setPublicJson(publicJsonData);
      
      setKycStepCompleted(prev => ({ ...prev, proofGeneration: true }));
      setCurrentStep(3);
      
      toast.success(
        `🎉 ZK proof generated successfully! Credential Hash: ${credentialHash.toString().substring(0, 10)}...`
      );

      // ── Store full KYC data on DataHaven Testnet ───────────────────
      if (aadhaarUploadResult?.extractedData) {
        setIsStoringData(true);
        toast.info("Storing KYC data on DataHaven… (Please sign any MetaMask prompts)");
        try {
          const extracted = aadhaarUploadResult.extractedData;

          const storageRes = await storeKycDataOnDataHaven({
            aadhaarData: {
              fileName: aadhaarUploadResult.fileName,
              uploadedAt: aadhaarUploadResult.uploadedAt instanceof Date
                ? aadhaarUploadResult.uploadedAt.toISOString()
                : String(aadhaarUploadResult.uploadedAt),
              extractedData: {
                name: extracted.name ?? "",
                dob: extracted.dob ?? "",
                gender: extracted.gender ?? "",
                state: extracted.address?.state ?? "",
              },
            },
            images: {
              aadhaarImage: faceVerificationResult?.aadhaarImage
                ?? aadhaarUploadResult.extractedPhoto
                ?? "",
              liveImage: faceVerificationResult?.liveImage ?? "",
              passportImage: faceVerificationResult?.passportImage ?? "",
            },
          });

          setStorageResult(storageRes);

          toast.success(
            `✅ KYC data securely stored on DataHaven!`,
            {
              description: `Bucket: ${storageRes.bucketId.slice(0, 18)}… | File: ${storageRes.fileKey.slice(0, 18)}…`,
              duration: 5000,
            }
          );

          console.log("[KYCDashboard] DataHaven storage completed:", {
            bucketId: storageRes.bucketId,
            fileKey: storageRes.fileKey,
            authenticated: storageRes.authenticated,
            timestamp: storageRes.timestamp,
          });
        } catch (storageErr: any) {
          const storageErrorMsg = storageErr?.message ?? "Storage operation failed";
          console.warn(
            "[KYCDashboard] DataHaven storage failed (non-blocking):",
            storageErrorMsg
          );
          toast.warning(
            "⚠️ DataHaven storage temporarily unavailable",
            { description: storageErrorMsg, duration: 4000 }
          );
        } finally {
          setIsStoringData(false);
        }
      }
      
      setTimeout(() => {
        setActiveTab("nft");
        toast.info("Your ZK proof and credentials are ready for download!");
      }, 2000);
      
    } catch (error: any) {
      console.error('ZK proof generation failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred during proof generation';
      setProofError(errorMessage);
      toast.error(`ZK proof generation failed: ${errorMessage}`);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KYC Verification Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete your privacy-preserving KYC verification using zero-knowledge proofs
          </p>
        </motion.div>

        <ProgressTracker 
          steps={[
            { id: '1', label: 'Aadhaar Upload & Extraction', completed: kycStepCompleted.aadhaarUpload },
            { id: '2', label: 'Face Verification & Liveliness', completed: kycStepCompleted.faceVerification },
            { id: '3', label: 'ZK Circuit Processing', completed: kycStepCompleted.proofGeneration },
            { id: '4', label: 'Credential Download', completed: kycStepCompleted.nftMinting },
          ]} 
        />

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Aadhaar Upload
              </TabsTrigger>
              <TabsTrigger value="verify" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Face Verification
              </TabsTrigger>
              <TabsTrigger value="proof" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                ZK Proof
              </TabsTrigger>
              <TabsTrigger value="nft" className="flex items-center gap-2">
                <Verified className="h-4 w-4" />
                Download
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Aadhaar Upload */}
            <TabsContent value="upload" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AadhaarUploadSteps
                  onUploadComplete={handleAadhaarUpload}
                  onNext={moveToNextTab}
                  userWalletAddress=""
                />
              </motion.div>
            </TabsContent>

            {/* Tab 2: Face Verification */}
            <TabsContent value="verify" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {kycStepCompleted.aadhaarUpload ? (
                  <FaceVerification
                    onVerificationComplete={handleFaceVerification}
                    onNext={moveToNextTab}
                    userWalletAddress=""
                    aadhaarPhotoFromAPI={aadhaarUploadResult?.extractedPhoto}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Complete Aadhaar Upload First</CardTitle>
                      <CardDescription>
                        You need to upload your Aadhaar ZIP file before proceeding to face verification.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => setActiveTab("upload")}
                        variant="outline"
                      >
                        Go to Upload
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Tab 3: ZK Proof Generation */}
            <TabsContent value="proof" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {kycStepCompleted.aadhaarUpload && kycStepCompleted.faceVerification ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Generate ZK Proof</CardTitle>
                        <CardDescription>
                          Generate a zero-knowledge proof of your verified credentials
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {proofError && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">{proofError}</p>
                          </div>
                        )}
                        
                        {zkProofResult && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              ✅ ZK proof generated successfully!
                            </p>
                          </div>
                        )}

                        {isStoringData && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Storing KYC data on DataHaven Testnet…
                            </p>
                          </div>
                        )}

                        {storageResult && (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-1">
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                              📦 KYC data stored on DataHaven Testnet
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              Bucket: {storageResult.bucketId}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              File: {storageResult.fileKey}
                            </p>
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleGenerateZkProof}
                          disabled={isGeneratingProof || isStoringData}
                          className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                        >
                          {(isGeneratingProof || isStoringData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isGeneratingProof ? 'Generating Proof...' : isStoringData ? 'Storing on DataHaven...' : 'Generate ZK Proof'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Complete Previous Steps First</CardTitle>
                      <CardDescription>
                        Please complete Aadhaar upload and face verification before generating ZK proof
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => setActiveTab("upload")}
                        variant="outline"
                      >
                        Back to Upload
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Tab 4: Download Credentials */}
            <TabsContent value="nft" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {kycStepCompleted.proofGeneration ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Credentials</CardTitle>
                        <CardDescription>
                          Your generated ZK proof and verified credentials
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Your credentials have been generated and are ready for use or download.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <VerificationTab
                      userWalletAddress=""
                      aadhaarUploadResult={aadhaarUploadResult}
                      faceVerificationResult={faceVerificationResult}
                      kycData={kycData}
                      proofData={zkProofResult || proofData}
                      ipfsHash={ipfsHash}
                      txHash=""
                      proofJson={proofJson}
                      publicJson={publicJson}
                    />
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generate ZK Proof First</CardTitle>
                      <CardDescription>
                        Please generate your ZK proof before downloading credentials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => setActiveTab("proof")}
                        variant="outline"
                      >
                        Back to ZK Proof
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default KYCDashboard;
