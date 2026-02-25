import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Download, Eye } from "lucide-react";
import {
  decodeFlagsFromStatusBits,
  downloadProof,
  downloadPublicSignals,
  formatCredentialHash,
} from "@/utils/proofUtils";
import { ProofResponse, KYCFlags } from "@/apis/zkpService";
import { useState } from "react";

interface CredentialDisplayProps {
  proofData: ProofResponse;
  flags: KYCFlags;
  onVerificationComplete: () => void;
}

export const CredentialDisplay = ({
  proofData,
  flags,
  onVerificationComplete,
}: CredentialDisplayProps) => {
  const [showFullHash, setShowFullHash] = useState(false);
  const decodedFlags = decodeFlagsFromStatusBits(proofData.publicSignals);

  // Extract KYC level from public signals if available
  const kycLevel = proofData.publicSignals[1]
    ? Math.floor(Number(proofData.publicSignals[1]) / 100)
    : null;

  const flagsList = [
    { label: "Age/Nationality OK", value: decodedFlags.ageNatOK },
    { label: "Government ID OK", value: decodedFlags.govtIdOK },
    { label: "Face OK", value: decodedFlags.faceOK },
    { label: "Liveness OK", value: decodedFlags.livenessOK },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>✅ Credential Details</CardTitle>
        <CardDescription>
          Successfully generated ZK proof for KYC credential
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credential Hash */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Credential Hash</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullHash(!showFullHash)}
              className="h-6 px-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg break-all">
            <code className="text-sm font-mono text-blue-900">
              {showFullHash
                ? proofData.credentialHash
                : formatCredentialHash(proofData.credentialHash)}
            </code>
          </div>
        </div>

        {/* KYC Level */}
        {kycLevel !== null && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">KYC Level</label>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-lg font-bold text-purple-900">Level {kycLevel}</p>
            </div>
          </div>
        )}

        {/* Verification Flags */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Verification Status</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flagsList.map(({ label, value }) => (
              <div
                key={label}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  value
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                {value ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span
                  className={`text-sm font-medium ${
                    value ? "text-green-900" : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Download Buttons */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Download Proof Files</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => downloadProof(proofData.proof)}
              className="w-full justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download proof.json
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadPublicSignals(proofData.publicSignals)}
              className="w-full justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download public.json
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> Share the credential hash and proof files with banks
            for verification. They can verify the proof without accessing your personal data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
