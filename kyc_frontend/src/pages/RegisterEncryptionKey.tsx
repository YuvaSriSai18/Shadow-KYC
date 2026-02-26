/**
 * RegisterEncryptionKey.tsx
 *
 * Receivers must visit this page once to publish their MetaMask x25519
 * public key so senders can encrypt files for them.
 *
 * Flow:
 *  1. Connect MetaMask  (eth_requestAccounts — user approves connection)
 *  2. Fetch own x25519 pub key  (eth_getEncryptionPublicKey — user approves)
 *  3. Write to Firestore  publicKeys/{lowercaseAddress}
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Badge }    from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Key, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { registerPublicKey, getReceiverPublicKey } from '@/utils/secureShareFirebase';

type Status = 'idle' | 'connecting' | 'fetching' | 'storing' | 'done' | 'error';

export default function RegisterEncryptionKey() {
  const [status,  setStatus]  = useState<Status>('idle');
  const [address, setAddress] = useState('');
  const [pubKey,  setPubKey]  = useState('');
  const [error,   setError]   = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const handleRegister = async () => {
    setError('');
    setAlreadyRegistered(false);

    try {
      // Step 1: Connect MetaMask
      setStatus('connecting');
      if (!window.ethereum) throw new Error('MetaMask is not installed.');

      // Request connection first
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });

      // Use selectedAddress (synchronous, always matches MetaMask's active account)
      // Never pass a lowercased address — eth_getEncryptionPublicKey needs the exact
      // address MetaMask internally maps to the private key.
      const checksumAccount: string | null = (window.ethereum as any).selectedAddress;
      if (!checksumAccount) throw new Error('MetaMask has no selected account. Unlock MetaMask and try again.');

      const account = checksumAccount;
      setAddress(account);

      // Check if already registered
      const existing = await getReceiverPublicKey(account);
      if (existing) {
        setPubKey(existing);
        setAlreadyRegistered(true);
        setStatus('done');
        toast.success('Key was already registered!');
        return;
      }

      // Step 2: Fetch own x25519 encryption public key
      setStatus('fetching');
      const key: string | null = await (window.ethereum as any).request({
        method: 'eth_getEncryptionPublicKey',
        params: [checksumAccount],
      });
      if (!key) throw new Error('MetaMask returned an empty encryption key. Make sure your MetaMask is unlocked and the account is active.');
      setPubKey(key);

      // Step 3: Store in Firestore
      setStatus('storing');
      await registerPublicKey(account, key);

      setStatus('done');
      toast.success('Encryption key registered successfully!');
    } catch (err: any) {
      if (err.code === 4001) setError('You rejected the MetaMask request. Please try again and approve both popups.');
      else setError(err.message ?? 'Registration failed.');
      setStatus('error');
    }
  };

  const stepLabel: Record<Status, string> = {
    idle:       '',
    connecting: 'Connecting MetaMask…',
    fetching:   'Requesting encryption key from MetaMask…',
    storing:    'Saving to Firestore…',
    done:       '',
    error:      '',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Register Encryption Key
          </h1>
          <p className="text-muted-foreground text-sm">
            Do this once so others can send you encrypted files.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
            <CardDescription>
              MetaMask will show two popups — one to connect your wallet, one to approve sharing
              your encryption public key. Your private key <strong>never</strong> leaves MetaMask.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>Click <strong className="text-foreground">Register My Key</strong> below</li>
              <li>Approve the MetaMask <em>connect</em> popup</li>
              <li>Approve the MetaMask <em>provide encryption key</em> popup</li>
              <li>Your x25519 public key is stored in Firestore — senders look it up automatically</li>
            </ol>

            {/* In-progress spinner */}
            {['connecting', 'fetching', 'storing'].includes(status) && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <span className="text-sm">{stepLabel[status]}</span>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success */}
            {status === 'done' && (
              <Alert className="border-green-500/40 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400 space-y-1">
                  <p className="font-semibold">
                    {alreadyRegistered ? 'Already registered!' : 'Key registered successfully!'}
                  </p>
                  <p className="text-xs font-mono break-all text-muted-foreground">{address}</p>
                  <p className="text-xs break-all text-muted-foreground">{pubKey}</p>
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleRegister}
              disabled={['connecting', 'fetching', 'storing'].includes(status)}
            >
              {['connecting', 'fetching', 'storing'].includes(status) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'done' ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              {status === 'done' ? 'Registered' : 'Register My Key'}
            </Button>
          </CardContent>
        </Card>

        {status === 'done' && (
          <div className="text-center text-xs text-muted-foreground">
            Share your wallet address <Badge variant="outline" className="font-mono text-xs">{address.slice(0, 10)}…</Badge> with the sender. They will find your key automatically.
          </div>
        )}

      </div>
    </div>
  );
}
