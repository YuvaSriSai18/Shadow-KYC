import { useState } from "react";
import { Wallet, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface WalletConnectProps {
  onWalletChange?: (address: string | null) => void;
}

export const WalletConnect = ({ onWalletChange }: WalletConnectProps) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = "0x" + Math.random().toString(16).slice(2, 42);
      setWalletAddress(mockAddress);
      setKycVerified(Math.random() > 0.5); // Random KYC status for demo
      onWalletChange?.(mockAddress);
      setConnecting(false);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    }, 1500);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setKycVerified(false);
    onWalletChange?.(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  if (!walletAddress) {
    return (
      <Button
        onClick={connectWallet}
        disabled={connecting}
        className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <Card className="p-4 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {kycVerified ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                    KYC Verified
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-warning" />
                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                    Not Verified
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
