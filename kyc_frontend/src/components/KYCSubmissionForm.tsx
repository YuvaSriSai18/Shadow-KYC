import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { submitKYC, ProofResponse, KYCFlags } from "@/apis/zkpService";
import { CredentialDisplay } from "./CredentialDisplay";
import { BankVerification } from "./BankVerification";

export const KYCSubmissionForm = () => {
  const [flags, setFlags] = useState<KYCFlags>({
    ageNatOK: 0,
    govtIdOK: 0,
    faceOK: 0,
    livenessOK: 0,
  });

  const [loading, setLoading] = useState(false);
  const [proofData, setProofData] = useState<ProofResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationDone, setVerificationDone] = useState(false);

  const handleFlagChange = (flag: keyof KYCFlags) => {
    setFlags((prev) => ({
      ...prev,
      [flag]: prev[flag] === 1 ? 0 : 1,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate at least one flag is set
      if (!Object.values(flags).some((v) => v === 1)) {
        toast.error("Please verify at least one KYC requirement");
        setLoading(false);
        return;
      }

      const response = await submitKYC(flags);
      setProofData(response);
      setVerificationDone(false);
      toast.success("ZK Proof generated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate proof";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFlags({
      ageNatOK: 0,
      govtIdOK: 0,
      faceOK: 0,
      livenessOK: 0,
    });
    setProofData(null);
    setError(null);
    setVerificationDone(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* KYC Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Form</CardTitle>
          <CardDescription>
            Select which KYC requirements have been verified for this user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Checkboxes */}
          <div className="space-y-4">
            {[
              { key: "ageNatOK" as const, label: "Age/Nationality Verified", description: "User is of legal age and nationality verified" },
              { key: "govtIdOK" as const, label: "Government ID Verified", description: "Valid government-issued ID checked" },
              { key: "faceOK" as const, label: "Face Verified", description: "Face matches ID photo" },
              { key: "livenessOK" as const, label: "Liveness Verified", description: "User is alive and present" },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-start space-x-3">
                <Checkbox
                  id={key}
                  checked={flags[key] === 1}
                  onCheckedChange={() => handleFlagChange(key)}
                  disabled={loading}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || proofData !== null}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Proof...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Generate ZK Proof
                </>
              )}
            </Button>
            {proofData && (
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credential Display */}
      {proofData && (
        <CredentialDisplay
          proofData={proofData}
          flags={flags}
          onVerificationComplete={() => setVerificationDone(true)}
        />
      )}

      {/* Bank Verification */}
      {proofData && (
        <BankVerification
          proofData={proofData}
          onVerificationDone={() => setVerificationDone(true)}
        />
      )}
    </div>
  );
};
