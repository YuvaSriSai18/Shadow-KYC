import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CredentialVerificationProps {
  className?: string;
}

export const CredentialVerification = ({ className }: CredentialVerificationProps) => {
  const [credentialHash, setCredentialHash] = useState('');

  const handleVerify = () => {
    if (!credentialHash.trim()) {
      toast.error('Please enter a credential hash');
      return;
    }
    toast.info('Credential verification requires blockchain connection - feature removed');
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Credential Verification</CardTitle>
          <CardDescription>
            This feature previously verified credentials on-chain. Blockchain integration has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Blockchain transaction features have been removed from this application. 
              Credential verification requires blockchain connectivity which is no longer available.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Credential Hash</label>
            <input
              type="text"
              placeholder="Enter credential hash..."
              value={credentialHash}
              onChange={(e) => setCredentialHash(e.target.value)}
              disabled
              className="w-full p-3 border rounded-lg text-sm font-mono opacity-50 cursor-not-allowed"
            />
            <Button 
              onClick={handleVerify}
              disabled
              className="w-full"
            >
              Verify Credential
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This feature requires blockchain connectivity which is currently disabled.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialVerification;
