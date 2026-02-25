import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { verifyProofWithBank, ProofResponse, VerificationResult } from "@/apis/zkpService";

interface BankVerificationProps {
  proofData: ProofResponse;
  onVerificationDone: () => void;
}

export const BankVerification = ({
  proofData,
  onVerificationDone,
}: BankVerificationProps) => {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyWithBank = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await verifyProofWithBank(
        proofData.proof,
        proofData.publicSignals
      );
      setVerificationResult(result);
      onVerificationDone();

      if (result.valid) {
        toast.success("Proof verified by bank!");
      } else {
        toast.error("Proof verification failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setError(null);
  };

  if (verificationResult) {
    return (
      <Card className={verificationResult.valid ? "border-green-200" : "border-red-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {verificationResult.valid ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                ✅ Proof Verified by Bank
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                ❌ Proof Rejected
              </>
            )}
          </CardTitle>
          <CardDescription>
            {verificationResult.valid
              ? "Your credential has been successfully verified"
              : "The proof verification failed. Please check your credential."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verification Details */}
          {verificationResult.valid && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Government ID Verified</p>
                  {verificationResult.govtIdOK && (
                    <p className="text-xs text-green-700">✓ Valid government ID detected</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Face Verification Passed</p>
                  {verificationResult.faceOK && (
                    <p className="text-xs text-green-700">✓ Face matched ID photo</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {!verificationResult.valid && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                The proof could not be verified. This may indicate:
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>Proof is invalid or corrupted</li>
                <li>Public signals do not match the proof</li>
                <li>Issuer signature is invalid</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetVerification} className="flex-1">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Verification</CardTitle>
        <CardDescription>
          Verify your proof with the bank to confirm your KYC status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            🏦 <strong>How it works:</strong> The bank will verify your proof cryptographically.
            No personal data is shared—only the zero-knowledge proof and public signals.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Verification Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Verify Button */}
        <Button
          onClick={handleVerifyWithBank}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying with Bank...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Verify with Bank
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
