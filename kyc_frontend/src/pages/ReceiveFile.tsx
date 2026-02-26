/**
 * ReceiveFile.tsx
 * ──────────────────────────────────────────────────────────────────────────
 * Receiver flow:
 *   1. Connect MetaMask → receiver address
 *   2. Enter Share ID → Lookup Firestore record
 *   3. Verify connected address === record.receiver
 *   4. Check expiry (block if expired)
 *   5. Decrypt & Download:
 *      a. Download encrypted blob from Firebase Storage
 *      b. Unpack IV + ciphertext
 *      c. eth_decrypt → raw AES key (MetaMask popup, user approves)
 *      d. Import raw key → CryptoKey
 *      e. AES-256-GCM decrypt in-browser
 *      f. Trigger "Save As" download
 *
 * Security: private key never leaves MetaMask. Decryption is 100% local.
 */

import { useState, useCallback } from 'react';
import { db } from '@/utils/secureShareFirebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  decryptAESKeyWithMetaMask,
  importAESKey,
  decryptFileAES,
  unpackEncryptedFile,
  triggerDownload,
} from '@/utils/cryptoUtils.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import { Badge }     from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Unlock,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wallet,
  Clock,
  Shield,
  User,
  Image,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExpiry(unixSecs: number) {
  return new Date(unixSecs * 1000).toLocaleString();
}

function secondsRemaining(unixSecs: number) {
  return unixSecs - Math.floor(Date.now() / 1000);
}

type Phase = 'idle' | 'fetching' | 'decrypting' | 'done' | 'error';

interface ShareRecord {
  sender: string;
  receiver: string;
  encryptedAESKey: string;
  encryptedData: string;   // base64-encoded [ IV (12B) + AES-GCM ciphertext ]
  fileName: string;
  fileSize: number;
  expiry: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceiveFile() {
  const [account,          setAccount]          = useState<string | null>(null); // lowercase, for display + Firestore match
  const [checksumAccount,  setChecksumAccount]  = useState<string | null>(null); // original case, for MetaMask API calls
  const [shareId,          setShareId]          = useState('');
  const [record,           setRecord]           = useState<ShareRecord | null>(null);
  const [phase,            setPhase]            = useState<Phase>('idle');
  const [statusMsg,        setStatusMsg]        = useState('');
  const [error,            setError]            = useState('');
  const [decryptedPayload, setDecryptedPayload] = useState<Record<string, any> | null>(null);

  // ── Connect ────────────────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    setError('');
    if (!window.ethereum) { setError('MetaMask is not installed.'); return; }
    try {
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
      // Use selectedAddress — always reflects the active account MetaMask has unlocked
      const selected: string | null = (window.ethereum as any).selectedAddress;
      if (!selected) { setError('MetaMask has no selected account. Unlock MetaMask and try again.'); return; }
      setAccount(selected.toLowerCase());
      setChecksumAccount(selected);
      toast.success('Wallet connected');
    } catch (err: any) {
      if (err.code === 4001) setError('Wallet connection rejected.');
      else setError(`Connection failed: ${err.message}`);
    }
  }, []);

  // ── Lookup Firestore record ────────────────────────────────────────────────

  const fetchRecord = useCallback(async () => {
    if (!shareId.trim()) { setError('Enter a Share ID.'); return; }
    setError(''); setRecord(null); setPhase('fetching');
    setStatusMsg('Loading record from Firestore…');
    try {
      const snap = await getDoc(doc(db, 'sharedFiles', shareId.trim()));
      if (!snap.exists()) throw new Error('No file found for this Share ID.');

      const data = snap.data() as ShareRecord;

      if (secondsRemaining(data.expiry) <= 0) {
        setPhase('error');
        setError(`⏰ File Expired — expired on ${formatExpiry(data.expiry)}. Access permanently blocked.`);
        return;
      }

      setRecord(data);
      setPhase('idle');
      setStatusMsg('');
    } catch (err: any) {
      setPhase('error');
      setError(err.message);
    }
  }, [shareId]);

  // ── Decrypt & Download ────────────────────────────────────────────────────

  const handleDecrypt = useCallback(async () => {
    if (!record || !account) return;
    setError('');

    // Guard: correct wallet?
    if (account !== record.receiver) {
      setError(
        `Wrong wallet. File sent to ${record.receiver}. You are connected as ${account}. Switch accounts in MetaMask.`,
      );
      return;
    }

    // Guard: expiry
    if (secondsRemaining(record.expiry) <= 0) {
      setError(`⏰ File Expired — expired on ${formatExpiry(record.expiry)}.`);
      return;
    }

    try {
      setPhase('decrypting');

      setStatusMsg('Reading encrypted data from Firestore…');
      // Encrypted blob is stored as base64 directly in the Firestore doc — no Storage download needed
      const encryptedBytes = Uint8Array.from(atob(record.encryptedData), (c) => c.charCodeAt(0));
      const encryptedBuffer: ArrayBuffer = encryptedBytes.buffer;

      setStatusMsg('Unpacking encrypted file…');
      const { iv, ciphertext } = unpackEncryptedFile(encryptedBuffer);

      setStatusMsg('Asking MetaMask to decrypt the AES key… (approve the popup)');
      // Must use the original checksum address — MetaMask rejects lowercased addresses
      const rawAESKey = await decryptAESKeyWithMetaMask(checksumAccount ?? account, record.encryptedAESKey);

      setStatusMsg('Importing AES key…');
      const aesKey = await importAESKey(rawAESKey);

      setStatusMsg(`Decrypting "${record.fileName}" with AES-256-GCM…`);
      const plaintext = await decryptFileAES(aesKey, iv, ciphertext);

      // Parse JSON and show in UI — no file download
      const jsonStr = new TextDecoder().decode(plaintext);
      const parsed  = JSON.parse(jsonStr);
      setDecryptedPayload(parsed);
      setPhase('done');
      setStatusMsg('');
      toast.success('KYC data decrypted successfully!');
    } catch (err: any) {
      setPhase('error');
      setError(err.message ?? 'Decryption failed.');
    }
  }, [account, checksumAccount, record]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Unlock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Receive Encrypted File</h1>
          <p className="text-sm text-muted-foreground">Decrypt with MetaMask · Private key never exposed</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Wallet ── */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {account ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <code className="text-xs font-mono">{account}</code>
            </div>
          ) : (
            <Button onClick={connectWallet} className="w-full">
              Connect MetaMask
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Share ID lookup ── */}
      {account && phase !== 'done' && phase !== 'decrypting' && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enter Share ID</CardTitle>
            <CardDescription>Paste the ID the sender gave you.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Firestore document ID…"
                value={shareId}
                onChange={(e) => {
                  setShareId(e.target.value.trim());
                  setRecord(null);
                  setError('');
                  if (phase === 'error') setPhase('idle');
                }}
              />
              <Button
                variant="outline"
                onClick={fetchRecord}
                disabled={!shareId || phase === 'fetching'}
                className="shrink-0"
              >
                {phase === 'fetching' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Record preview ── */}
      {record && phase === 'idle' && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" /> File Ready to Decrypt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border divide-y text-sm">
              {[
                ['File name', record.fileName],
                ['Size (encrypted)', `${(record.fileSize / 1024).toFixed(1)} KB`],
                ['Sender',   record.sender],
                ['Receiver', record.receiver],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3 px-3 py-2">
                  <span className="text-muted-foreground w-36 shrink-0">{label}</span>
                  <span className="font-mono text-xs break-all">{value}</span>
                </div>
              ))}
              <div className="flex gap-3 px-3 py-2">
                <span className="text-muted-foreground w-36 shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Expires
                </span>
                <span className={`text-xs ${secondsRemaining(record.expiry) < 3600 ? 'text-yellow-400' : ''}`}>
                  {formatExpiry(record.expiry)}
                  {' '}
                  <Badge variant="outline" className="text-xs ml-1">
                    {Math.max(0, Math.floor(secondsRemaining(record.expiry) / 3600))}h left
                  </Badge>
                </span>
              </div>
            </div>

            {account !== record.receiver ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connected wallet does not match the receiver address. Switch to the correct account in MetaMask.
                </AlertDescription>
              </Alert>
            ) : (
              <Button onClick={handleDecrypt} className="w-full gap-2">
                <Unlock className="h-4 w-4" /> Decrypt &amp; View
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── In-progress ── */}
      {phase === 'decrypting' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{statusMsg}</p>
            {statusMsg.includes('MetaMask') && (
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                MetaMask will show a decryption popup — click <strong>"Decrypt"</strong>.<br />
                Your private key never leaves MetaMask.
              </p>
            )}
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Success: show decrypted KYC data ── */}
      {phase === 'done' && decryptedPayload && (
        <div className="space-y-4">
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400 font-medium">
              KYC data decrypted successfully — displayed below. Never transmitted to any server.
            </AlertDescription>
          </Alert>

          {/* Personal Data */}
          {decryptedPayload.personalData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border divide-y text-sm">
                  {Object.entries(decryptedPayload.personalData as Record<string, string>)
                    .filter(([, v]) => v)
                    .map(([key, value]) => (
                      <div key={key} className="flex gap-3 px-3 py-2">
                        <span className="text-muted-foreground w-28 shrink-0 capitalize">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {(decryptedPayload.aadhaarImage || decryptedPayload.passportImage || decryptedPayload.liveImage) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" /> Verification Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {decryptedPayload.aadhaarImage && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Aadhaar Photo</Label>
                      <img
                        src={decryptedPayload.aadhaarImage}
                        alt="Aadhaar"
                        className="w-full rounded-lg border object-cover aspect-square"
                      />
                    </div>
                  )}
                  {decryptedPayload.passportImage && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Passport Photo</Label>
                      <img
                        src={decryptedPayload.passportImage}
                        alt="Passport"
                        className="w-full rounded-lg border object-cover aspect-square"
                      />
                    </div>
                  )}
                  {decryptedPayload.liveImage && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Live Capture</Label>
                      <img
                        src={decryptedPayload.liveImage}
                        alt="Live"
                        className="w-full rounded-lg border object-cover aspect-square"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground px-1">
            <span>Shared: {decryptedPayload.generatedAt ? new Date(decryptedPayload.generatedAt).toLocaleString() : '—'}</span>
            <span>·</span>
            <span>{decryptedPayload.source ?? 'Shadow-KYC'}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                const blob = new Blob([JSON.stringify(decryptedPayload, null, 2)], { type: 'application/json' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = record?.fileName ?? 'kyc-data.json';
                a.click(); URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4" /> Save as JSON
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPhase('idle'); setRecord(null); setShareId('');
                setError(''); setDecryptedPayload(null);
              }}
            >
              Receive Another
            </Button>
          </div>
        </div>
      )}

      {/* Security badges */}
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        <Badge variant="outline" className="text-xs gap-1"><Unlock className="h-3 w-3" />eth_decrypt</Badge>
        <Badge variant="outline" className="text-xs gap-1"><Shield className="h-3 w-3" />x25519</Badge>
        <Badge variant="outline" className="text-xs gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Client-only decrypt</Badge>
      </div>
    </div>
  );
}
