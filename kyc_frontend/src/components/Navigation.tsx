import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Shield, Lock, Wallet, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  connectWallet as clientConnect,
  disconnectWallet as clientDisconnect,
  getConnectedAddress,
} from '@/services/clientService';
import { clearSession } from '@/services/mspService';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/kyc', label: 'KYC Verification', icon: Shield },
  { to: '/zkproof', label: 'ZK Proof', icon: Lock },
];

export const Navigation = () => {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Check if wallet is already connected on mount (handles auto-connected wallets)
  useEffect(() => {
    const address = getConnectedAddress();
    if (address) {
      setWalletAddress(address);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const address = await clientConnect();
      setWalletAddress(address);
      toast({ title: 'Wallet Connected', description: 'Wallet connected successfully' });
    } catch (err: any) {
      toast({ title: 'Connection Failed', description: err?.message ?? 'Failed to connect', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clientDisconnect();
    clearSession();
    setWalletAddress(null);
    toast({ title: 'Wallet Disconnected', description: 'Your wallet has been disconnected' });
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">REGKYC</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Wallet connect / disconnect */}
          <div className="flex items-center gap-2">
            {walletAddress ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-sm font-medium">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="hover:bg-destructive/10 hover:text-destructive"
                  title="Disconnect Wallet"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {connecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="mr-2 h-4 w-4" />
                )}
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
