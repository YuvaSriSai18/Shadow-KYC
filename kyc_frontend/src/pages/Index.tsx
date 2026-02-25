import { useState } from "react";
import { FileText, Shield, Database, Link as LinkIcon, Award, Users } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { KYCForm } from "@/components/KYCForm";
import { ProofGenerator } from "@/components/ProofGenerator";
import { IPFSUploader } from "@/components/IPFSUploader";
import { BlockchainSubmit } from "@/components/BlockchainSubmit";
import { NFTMinter } from "@/components/NFTMinter";
import { ProgressTracker } from "@/components/ProgressTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [ipfsUploaded, setIpfsUploaded] = useState(false);
  const [blockchainSubmitted, setBlockchainSubmitted] = useState(false);
  const [nftMinted, setNftMinted] = useState(false);

  const steps = [
    { id: "wallet", label: "Connect Wallet", completed: walletConnected },
    { id: "kyc", label: "Submit KYC", completed: kycVerified },
    { id: "proof", label: "Generate Proof", completed: proofGenerated },
    { id: "ipfs", label: "Upload to IPFS", completed: ipfsUploaded },
    { id: "blockchain", label: "Submit On-Chain", completed: blockchainSubmitted },
    { id: "nft", label: "Mint NFT", completed: nftMinted },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">REGKYC</h1>
                <p className="text-xs text-muted-foreground">Zero-Knowledge Verification</p>
              </div>
            </div>
            <WalletConnect onWalletChange={(address) => setWalletConnected(!!address)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="verification">
              <FileText className="h-4 w-4 mr-2" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Users className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
            <TabsTrigger value="docs">
              <Database className="h-4 w-4 mr-2" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Sidebar */}
              <div className="lg:col-span-1">
                <ProgressTracker steps={steps} />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <KYCForm onVerificationComplete={() => setKycVerified(true)} />
                
                <ProofGenerator
                  enabled={kycVerified}
                  onProofGenerated={() => setProofGenerated(true)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <IPFSUploader
                    enabled={proofGenerated}
                    onUploadComplete={() => setIpfsUploaded(true)}
                  />
                  
                  <BlockchainSubmit
                    enabled={ipfsUploaded}
                    onSubmitComplete={() => setBlockchainSubmitted(true)}
                  />
                </div>

                <NFTMinter
                  enabled={blockchainSubmitted}
                  onMintComplete={() => setNftMinted(true)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>View and manage verified users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Verified Users</span>
                      <span className="text-2xl font-bold text-primary">1,234</span>
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Pending Verifications</span>
                      <span className="text-2xl font-bold text-warning">42</span>
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">NFTs Minted</span>
                      <span className="text-2xl font-bold text-success">987</span>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                      Full admin functionality coming soon...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  How It Works
                </CardTitle>
                <CardDescription>Understanding the REGKYC verification flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Connect Wallet</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect your Web3 wallet (MetaMask or WalletConnect) to begin the verification process.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Submit KYC Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Provide your age, nationality, and optional attributes. Data is validated locally.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Generate ZK Proof</h4>
                      <p className="text-sm text-muted-foreground">
                        Create a zero-knowledge proof that verifies your attributes without revealing private data.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Upload to IPFS</h4>
                      <p className="text-sm text-muted-foreground">
                        Store your proof on IPFS for decentralized, permanent accessibility.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      5
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Submit On-Chain</h4>
                      <p className="text-sm text-muted-foreground">
                        Record your verification proof on the blockchain via smart contract.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      6
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Mint NFT Badge</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive a non-fungible token representing your verified KYC status.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-accent/50 rounded-lg border border-accent">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Testnet Information
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Network: Ethereum Sepolia Testnet</p>
                    <p>Contract: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</p>
                    <p>Chain ID: 11155111</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
