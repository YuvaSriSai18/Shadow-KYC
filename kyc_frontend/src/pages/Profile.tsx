import { useNavigate } from 'react-router-dom';
import { User, Edit, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';


const Profile = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile</h1>
              <p className="text-muted-foreground">Your KYC verification details</p>
            </div>
            <Button
              onClick={() => navigate('/kyc')}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Edit className="mr-2 h-4 w-4" />
              Update KYC
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">About</p>
                  <p className="font-medium">
                    Welcome to your KYC profile. This page shows your verification status and credentials.
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Network</p>
                  <p className="font-medium">Sepolia Testnet</p>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <p className="font-medium">KYC Verification Status</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Complete the KYC process to generate and download your zero-knowledge proof credentials.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Your KYC verification level</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-16 w-16 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2 text-muted-foreground">Not Started</p>
                <p className="text-xs text-muted-foreground mb-4">Begin KYC to get verified</p>
                <Button 
                  onClick={() => navigate('/kyc')}
                  size="sm"
                  className="w-full"
                >
                  Start KYC Process
                </Button>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  How to Get Started
                </CardTitle>
                <CardDescription>Complete your KYC verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Step 1: Upload Aadhaar</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload your Aadhaar document as a ZIP file. The system will extract your personal information securely.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Step 2: Face Verification</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Verify your identity through face matching. The system will compare your live photo with your Aadhaar document.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Step 3: Generate ZK Proof</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a zero-knowledge proof of your verified credentials. This proof proves your credentials without revealing personal details.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Step 4: Download Credentials</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download your generated ZK proof and credentials for use in other applications.
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    💡 <strong>Privacy First:</strong> Your personal information is extracted and verified locally. The ZK proof allows you to prove your credentials without revealing sensitive data.
                  </p>
                </div>

                <Button 
                  onClick={() => navigate('/kyc')}
                  className="mt-6 w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  Get Started with KYC
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
