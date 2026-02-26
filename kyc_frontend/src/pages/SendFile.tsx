/**
 * SendFile.tsx
 * ──────────────────────────────────────────────────────────────────────────
 * Sender flow:
 *   1. Connect MetaMask → sender address
 *   2. Enter receiver address + expiry + select file
 *   3. Encrypt & Send:
 *      a. Fetch receiver's MetaMask encryption public key
 *      b. Read file → ArrayBuffer
 *      c. Generate random AES-256-GCM key
 *      d. Encrypt file with AES-GCM
 *      e. Pack IV + ciphertext → upload to Firebase Storage
 *      f. Export + encrypt AES key with receiver's x25519 public key
 *      g. Write Firestore record (sender, receiver, encryptedAESKey, fileURL, expiry)
 */

import { useState, useCallback } from 'react';
import { db, storage } from '@/utils/secureShareFirebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  getEncryptionPublicKey,
  generateAESKey,
  exportAESKey,
  encryptFileAES,
  encryptAESKeyForReceiver,
  packEncryptedFile,
} from '@/utils/cryptoUtils.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Badge }  from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lock,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Send,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target!.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

const STEPS = ['Connect', 'Configure', 'Encrypting', 'Uploading', 'Done'] as const;
type Step = 0 | 1 | 2 | 3 | 4;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SendFile() {
  const [account,     setAccount]     = useState<string | null>(null);
  const [receiver,    setReceiver]    = useState('');
  const [expiryHours, setExpiryHours] = useState('24');
  const [file,        setFile]        = useState<File | null>(null);
  const [step,        setStep]        = useState<Step>(0);
  const [shareId,     setShareId]     = useState('');
  const [error,       setError]       = useState('');
  const [statusMsg,   setStatusMsg]   = useState('');

  // ── Connect MetaMask ───────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    setError('');
    if (!window.ethereum) {
      setError('MetaMask is not installed. Install it from metamask.io');
      return;
    }
    try {
      const accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
      setAccount((accounts as string[])[0].toLowerCase());
      setStep(1);
      toast.success('Wallet connected');
    } catch (err: any) {
      if (err.code === 4001) setError('Wallet connection rejected.');
      else setError(`Connection failed: ${err.message}`);
    }
  }, []);

  // ── Encrypt & Send ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    setError('');

    if (!isValidAddress(receiver)) { setError('Invalid Ethereum address.'); return; }
    if (receiver.toLowerCase() === account) { setError('Receiver must differ from your own address.'); return; }
    if (!file) { setError('Select a file first.'); return; }

    try {
      // a. Receiver's MetaMask public key
      setStep(2);
      setStatusMsg("Requesting receiver's encryption key from MetaMask…");
      const receiverPubKey = await getEncryptionPublicKey(receiver.toLowerCase());

      // b. Read file
      setStatusMsg('Reading file…');
      const fileBuffer = await readFileAsArrayBuffer(file);

      // c. Generate AES key
      setStatusMsg('Generating AES-256-GCM key…');
      const aesKey    = await generateAESKey();
      const rawAESKey = await exportAESKey(aesKey);

      // d. Encrypt file
      setStatusMsg(`Encrypting "${file.name}"…`);
      const { iv, ciphertext } = await encryptFileAES(aesKey, fileBuffer);
      const encryptedBlob = packEncryptedFile(iv, ciphertext);

      // e. Encrypt AES key for receiver
      setStatusMsg("Encrypting AES key with receiver's public key…");
      const encryptedAESKey = encryptAESKeyForReceiver(receiverPubKey, rawAESKey);

      // f. Upload encrypted blob to Firebase Storage
      setStep(3);
      const fileId     = `${Date.now()}-${crypto.randomUUID()}`;
      const storageRef = ref(storage, `encrypted/${fileId}`);
      setStatusMsg('Uploading encrypted file to Firebase Storage…');
      await uploadBytes(storageRef, encryptedBlob);
      const fileURL = await getDownloadURL(storageRef);

      // g. Write Firestore metadata
      setStatusMsg('Saving metadata to Firestore…');
      const expiryTs = Math.floor(Date.now() / 1000) + Number(expiryHours) * 3600;
      const docRef = await addDoc(collection(db, 'sharedFiles'), {
        sender:          account,
        receiver:        receiver.toLowerCase(),
        encryptedAESKey,
        fileURL,
        fileName:        file.name,
        fileSize:        file.size,
        expiry:          expiryTs,
        expiryFirestore: Timestamp.fromMillis(expiryTs * 1000),
        createdAt:       Timestamp.now(),
      });

      setShareId(docRef.id);
      setStep(4);
      setStatusMsg('');
      toast.success('File encrypted and sent successfully!');
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
      setStep(1);
      setStatusMsg('');
    }
  }, [account, receiver, expiryHours, file]);

  const copyShareId = () => {
    navigator.clipboard.writeText(shareId);
    toast.success('Share ID copied to clipboard');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Send Encrypted File</h1>
          <p className="text-sm text-muted-foreground">End-to-end encrypted · Private key never leaves MetaMask</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center py-1.5 rounded text-xs font-medium transition-colors ${
              i < step  ? 'bg-green-500/20 text-green-400' :
              i === step ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
            }`}
          >
            {i < step ? '✓ ' : ''}{label}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Step 0: Connect ── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Connect Wallet
            </CardTitle>
            <CardDescription>
              Your wallet address becomes the sender identity. Only the receiver's MetaMask private key can decrypt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connectWallet} className="w-full">
              Connect MetaMask
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Configure ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Sender (you)</Label>
              <Input readOnly value={account ?? ''} className="font-mono text-xs text-muted-foreground" />
            </div>

            <div className="space-y-1.5">
              <Label>Receiver Ethereum Address</Label>
              <Input
                placeholder="0x..."
                value={receiver}
                onChange={(e) => setReceiver(e.target.value.trim())}
              />
              <p className="text-xs text-muted-foreground">
                MetaMask will fetch the receiver's x25519 encryption key. Ask the receiver to have MetaMask unlocked.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>File Expiry</Label>
              <Select value={expiryHours} onValueChange={setExpiryHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                After expiry the file is inaccessible. Firestore TTL deletes the record automatically.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>File to Encrypt</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} — {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={!receiver || !file}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" /> Encrypt &amp; Send
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Steps 2–3: In-progress ── */}
      {(step === 2 || step === 3) && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{statusMsg}</p>
            {step === 2 && (
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                MetaMask may show a popup — please approve the encryption key request.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && (
        <div className="space-y-4">
          <Alert className="border-green-500/50 bg-green-500/10 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>File encrypted and sent successfully!</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Share ID</CardTitle>
              <CardDescription>Send this ID to the receiver so they can decrypt the file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input readOnly value={shareId} className="font-mono text-sm" />
                <Button variant="outline" onClick={copyShareId} className="gap-2 shrink-0">
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>

              <div className="rounded-lg border p-3 space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">What was stored:</p>
                <ul className="space-y-1 list-none">
                  <li>🗄️ <span className="font-medium text-foreground">Firebase Storage:</span> AES-256-GCM encrypted blob (unreadable without key)</li>
                  <li>📄 <span className="font-medium text-foreground">Firestore:</span> sender/receiver addresses, encrypted AES key, file URL, expiry</li>
                  <li>🔒 <span className="font-medium text-foreground">Never stored:</span> plaintext file · plaintext AES key · your private key</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" onClick={() => {
                setStep(1); setShareId(''); setFile(null); setReceiver('');
              }}>
                Send Another File
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security badges */}
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        <Badge variant="outline" className="text-xs gap-1"><Lock className="h-3 w-3" />AES-256-GCM</Badge>
        <Badge variant="outline" className="text-xs gap-1"><Lock className="h-3 w-3" />x25519-xsalsa20-poly1305</Badge>
        <Badge variant="outline" className="text-xs gap-1"><CheckCircle className="h-3 w-3 text-green-500" />E2E Encrypted</Badge>
        <Badge variant="outline" className="text-xs gap-1"><Upload className="h-3 w-3" />Firebase Storage</Badge>
      </div>
    </div>
  );
}
