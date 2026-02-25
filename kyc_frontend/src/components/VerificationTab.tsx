import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Loader2,
  Eye,
  Download,
  Share2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface VerificationTabProps {
  userWalletAddress?: string;
  aadhaarUploadResult?: any;
  faceVerificationResult?: any;
  kycData?: any;
  proofData?: any;
  ipfsHash?: string;
  txHash?: string;
  proofJson?: any;
  publicJson?: any;
}

interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  verificationLevel: 'basic' | 'advanced' | 'premium';
  issuedAt: Date;
  expiresAt?: Date;
}

interface VerificationStatus {
  stage: 'pending' | 'processing' | 'verified' | 'failed';
  confidence: number;
  details: {
    aadhaarVerified: boolean;
    faceMatched: boolean;
    proofGenerated: boolean;
    blockchainConfirmed: boolean;
  };
  timestamp: Date;
}

export const VerificationTab: React.FC<VerificationTabProps> = ({
  userWalletAddress,
  aadhaarUploadResult,
  faceVerificationResult,
  kycData,
  proofData,
  ipfsHash,
  txHash,
  proofJson,
  publicJson
}) => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    stage: 'pending',
    confidence: 0,
    details: {
      aadhaarVerified: false,
      faceMatched: false,
      proofGenerated: false,
      blockchainConfirmed: false
    },
    timestamp: new Date()
  });

  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');

  // Update verification status based on completed steps
  useEffect(() => {
    const details = {
      aadhaarVerified: !!aadhaarUploadResult,
      faceMatched: !!faceVerificationResult?.verificationPassed,
      proofGenerated: !!proofData,
      blockchainConfirmed: !!txHash
    };

    const completedSteps = Object.values(details).filter(Boolean).length;
    const confidence = (completedSteps / 4) * 100;

    let stage: VerificationStatus['stage'] = 'pending';
    if (completedSteps === 4) stage = 'verified';
    else if (completedSteps > 0) stage = 'processing';

    setVerificationStatus({
      stage,
      confidence,
      details,
      timestamp: new Date()
    });

    // Generate NFT metadata if verification is complete
    if (stage === 'verified' && !nftMetadata) {
      generateNFTMetadata();
    }
  }, [aadhaarUploadResult, faceVerificationResult, proofData, txHash]);

  // Generate NFT metadata for successful verification
  const generateNFTMetadata = async () => {
    setIsLoadingNFT(true);
    
    try {
      // Simulate NFT generation (in real implementation, this would call smart contract)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const metadata: NFTMetadata = {
        tokenId: `KYC-${Date.now()}`,
        contractAddress: "0x..." + Math.random().toString(16).substr(2, 8),
        name: "KYC Verification NFT",
        description: "Privacy-preserving KYC verification using zero-knowledge proofs",
        image: `https://api.dicebear.com/7.x/identicon/svg?seed=${userWalletAddress}`,
        attributes: [
          { trait_type: "Verification Level", value: "Advanced" },
          { trait_type: "Aadhaar Verified", value: "Yes" },
          { trait_type: "Face Matched", value: "Yes" },
          { trait_type: "ZK Proof", value: "Generated" },
          { trait_type: "Blockchain", value: "Confirmed" },
          { trait_type: "Confidence", value: `${verificationStatus.confidence.toFixed(1)}%` }
        ],
        verificationLevel: 'advanced',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };
      
      setNftMetadata(metadata);
      setBlockchainStatus('confirmed');
      toast.success('KYC verification NFT generated successfully!');
    } catch (error) {
      console.error('NFT generation failed:', error);
      setBlockchainStatus('failed');
      toast.error('Failed to generate verification NFT');
    } finally {
      setIsLoadingNFT(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const shareVerification = () => {
    const shareData = {
      title: 'KYC Verification Complete',
      text: `I've completed privacy-preserving KYC verification using zero-knowledge proofs!`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      copyToClipboard(shareData.url, 'Share URL');
    }
  };

  const downloadVerificationReport = () => {
    const report = {
      walletAddress: userWalletAddress,
      verificationStatus,
      nftMetadata,
      timestamp: new Date().toISOString(),
      proofHash: ipfsHash,
      transactionHash: txHash,
      // Include ZK proof files
      zkProof: {
        proof: proofJson,
        publicSignals: publicJson,
        algorithm: "Groth16",
        curve: "bn128"
      },
      // Verification data
      aadhaarData: aadhaarUploadResult ? {
        fileName: aadhaarUploadResult.fileName,
        uploadedAt: aadhaarUploadResult.uploadedAt,
        extractedData: aadhaarUploadResult.extractedData ? {
          name: aadhaarUploadResult.extractedData.name,
          dob: aadhaarUploadResult.extractedData.dob,
          gender: aadhaarUploadResult.extractedData.gender,
          state: aadhaarUploadResult.extractedData.address?.state
        } : null
      } : null,
      faceVerification: faceVerificationResult ? {
        verificationPassed: faceVerificationResult.verificationPassed,
        confidence: faceVerificationResult.confidence,
        details: faceVerificationResult.details
      } : null
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kyc-verification-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Comprehensive verification report downloaded with ZK proof files');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Verification Status
          </CardTitle>
          <CardDescription>
            View your KYC verification status and blockchain confirmation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge variant={
              verificationStatus.stage === 'verified' ? 'default' : 
              verificationStatus.stage === 'processing' ? 'secondary' : 'outline'
            }>
              {verificationStatus.stage.charAt(0).toUpperCase() + verificationStatus.stage.slice(1)}
            </Badge>
            <span className="text-2xl font-bold">
              {verificationStatus.confidence.toFixed(0)}%
            </span>
          </div>
          <Progress value={verificationStatus.confidence} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {verificationStatus.details.aadhaarVerified ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Aadhaar</span>
            </div>
            <div className="flex items-center gap-2">
              {verificationStatus.details.faceMatched ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Face Match</span>
            </div>
            <div className="flex items-center gap-2">
              {verificationStatus.details.proofGenerated ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">ZK Proof</span>
            </div>
            <div className="flex items-center gap-2">
              {verificationStatus.details.blockchainConfirmed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Blockchain</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="offchain" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offchain">Off-Chain Verification</TabsTrigger>
          <TabsTrigger value="onchain">On-Chain NFT</TabsTrigger>
        </TabsList>

        {/* Off-Chain Verification */}
        <TabsContent value="offchain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Off-Chain Verification Details</CardTitle>
              <CardDescription>
                Your verification data processed locally and securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aadhaar Verification */}
              {aadhaarUploadResult && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Aadhaar Document
                    </h4>
                    <Badge variant="outline">Verified</Badge>
                    
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">File Name:</span>
                      <p className="font-mono mt-1 text-sm max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{aadhaarUploadResult.fileName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Upload Time:</span>
                      <p>{aadhaarUploadResult.uploadedAt?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Face Verification */}
              {faceVerificationResult && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      {faceVerificationResult.verificationPassed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      Face Verification
                    </h4>
                    <Badge variant={faceVerificationResult.verificationPassed ? "default" : "destructive"}>
                      {faceVerificationResult.confidence.toFixed(1)}% Match
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {faceVerificationResult.details.passportLiveMatch ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span>Passport ↔ Live</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {faceVerificationResult.details.aadhaarLiveMatch ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span>Aadhaar ↔ Live</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {faceVerificationResult.details.passportAadhaarMatch ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span>Passport ↔ Aadhaar</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ZK Proof */}
              {proofData && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Zero-Knowledge Proof
                    </h4>
                    <Badge variant="outline">Generated</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(proofData), 'Proof data')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Proof
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
                      }}
                      disabled={!ipfsHash}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on IPFS
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={downloadVerificationReport}
                  disabled={verificationStatus.stage === 'pending'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button
                  variant="outline"
                  onClick={shareVerification}
                  disabled={verificationStatus.stage !== 'verified'}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Verification
                </Button>
                {txHash && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Transaction
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* On-Chain NFT */}
        <TabsContent value="onchain" className="space-y-4">
          {nftMetadata ? (
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification NFT</CardTitle>
                <CardDescription>
                  Your soulbound NFT representing verified identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={nftMetadata.image}
                    alt="KYC NFT"
                    className="w-24 h-24 rounded-lg border"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{nftMetadata.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{nftMetadata.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Token ID: {nftMetadata.tokenId}</Badge>
                      <Badge variant="outline">Level: {nftMetadata.verificationLevel}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {nftMetadata.attributes.map((attr, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <p className="text-xs text-gray-500">{attr.trait_type}</p>
                      <p className="font-medium">{attr.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span>Issued: </span>
                    {nftMetadata.issuedAt.toLocaleDateString()}
                  </div>
                  {nftMetadata.expiresAt && (
                    <div>
                      <span>Expires: </span>
                      {nftMetadata.expiresAt.toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(nftMetadata.contractAddress, 'Contract address')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Contract
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`https://opensea.io/assets/ethereum/${nftMetadata.contractAddress}/${nftMetadata.tokenId}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on OpenSea
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : verificationStatus.stage === 'verified' && isLoadingNFT ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Generating your KYC verification NFT...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>NFT Not Available</CardTitle>
                <CardDescription>
                  Complete all verification steps to mint your soulbound KYC NFT
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your KYC verification NFT will be automatically generated once all verification steps are completed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};