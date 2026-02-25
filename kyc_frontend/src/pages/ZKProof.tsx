import { KYCSubmissionForm } from "@/components/KYCSubmissionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function ZKProofPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            ZK KYC Credential System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Generate zero-knowledge proofs for your KYC verification without exposing personal data
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <p>
              ✅ <strong>Step 1:</strong> Fill out the KYC verification form with verification checkboxes
            </p>
            <p>
              🔐 <strong>Step 2:</strong> Generate a zero-knowledge proof using Groth16 and Poseidon hashing
            </p>
            <p>
              💾 <strong>Step 3:</strong> Download your proof and public signals for storage
            </p>
            <p>
              🏦 <strong>Step 4:</strong> Send your proof to a bank for verification without sharing personal data
            </p>
          </CardContent>
        </Card>

        {/* Main Form */}
        <KYCSubmissionForm />

        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>Why Zero-Knowledge Proofs?</CardTitle>
            <CardDescription>
              Privacy-preserving credential verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong>Privacy:</strong> Your personal data never leaves your device
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong>Security:</strong> Cryptographic proof cannot be forged or replayed
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong>Efficiency:</strong> Quick verification without personal data processing
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong>Portability:</strong> One proof works with multiple institutions
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
