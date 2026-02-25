import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface AdminBadgeManagerProps {
  userAddress?: string;
  className?: string;
}

export const AdminBadgeManager = ({ className }: AdminBadgeManagerProps) => {
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Admin Badge Manager</CardTitle>
          <CardDescription>
            This feature previously managed NFT badges on-chain. Blockchain integration has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              NFT badge management and blockchain smart contract interactions have been removed from this application.
              This admin feature is no longer available.
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Removed Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Creating new KYC badges</li>
              <li>Managing badge pricing and supply</li>
              <li>User claims and minting</li>
              <li>On-chain badge verification</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBadgeManager;
