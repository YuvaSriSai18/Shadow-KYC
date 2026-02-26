import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button }    from '@/components/ui/button';
import { Checkbox }  from '@/components/ui/checkbox';
import { Label }     from '@/components/ui/label';
import { Input }     from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge }     from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Share2,
  User,
  Image,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { db, getReceiverPublicKey } from '@/utils/secureShareFirebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  generateAESKey,
  exportAESKey,
  encryptFileAES,
  encryptAESKeyForReceiver,
} from '@/utils/cryptoUtils.js';
import { Buffer } from 'buffer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareableKycData {
  personalData?: {
    name?: string;
    dob?: string;
    gender?: string;
    state?: string;
  };
  aadhaarImage?: string;   // base64
  passportImage?: string;  // base64
  liveImage?: string;      // base64
}

interface ShareVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  data: ShareableKycData;
}

interface SelectionState {
  personalData: boolean;
  aadhaarImage: boolean;
  passportImage: boolean;
  liveImage: boolean;
}

type Step = 'select' | 'configure' | 'encrypting' | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function buildPayloadJSON(selection: SelectionState, data: ShareableKycData): string {
  const payload: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    source: 'Shadow-KYC / DataHaven',
  };
  if (selection.personalData && data.personalData) payload.personalData  = data.personalData;
  if (selection.aadhaarImage  && data.aadhaarImage)  payload.aadhaarImage  = data.aadhaarImage;
  if (selection.passportImage && data.passportImage) payload.passportImage = data.passportImage;
  if (selection.liveImage     && data.liveImage)     payload.liveImage     = data.liveImage;
  return JSON.stringify(payload, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ShareVerificationDialog: React.FC<ShareVerificationDialogProps> = ({
  open,
  onClose,
  data,
}) => {
  // Step state
  const [step, setStep] = useState<Step>('select');

  // Step 1 — selection
  const [selection, setSelection] = useState<SelectionState>({
    personalData: true,
    aadhaarImage: false,
    passportImage: false,
    liveImage: false,
  });

  // Step 2 — configuration
  const [receiver,    setReceiver]    = useState('');
  const [expiryHours, setExpiryHours] = useState('24');

  // Step 3 — progress / result
  const [statusMsg, setStatusMsg] = useState('');
  const [shareId,   setShareId]   = useState('');
  const [error,     setError]     = useState('');

  const toggle = (key: keyof SelectionState) =>
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));

  const noneSelected = !Object.values(selection).some(Boolean);

  // Availability flags
  const has = {
    personalData: !!data.personalData && Object.values(data.personalData).some(Boolean),
    aadhaarImage: !!data.aadhaarImage,
    passportImage: !!data.passportImage,
    liveImage: !!data.liveImage,
  };

  // Reset when dialog closes
  const handleClose = () => {
    setStep('select');
    setReceiver('');
    setExpiryHours('24');
    setStatusMsg('');
    setShareId('');
    setError('');
    onClose();
  };

  // ── Main E2E encrypt+upload flow ───────────────────────────────────────────
  const handleEncryptAndShare = useCallback(async () => {
    if (!isValidAddress(receiver)) {
      setError('Enter a valid Ethereum address (0x…).');
      return;
    }
    setError('');

    const payloadStr   = buildPayloadJSON(selection, data);
    const payloadBytes = new TextEncoder().encode(payloadStr);
    const fileName     = `kyc-verification-${Date.now()}.json`;

    // Guard: Firestore doc limit is ~1 MiB
    if (payloadBytes.byteLength > 900_000) {
      setError('Selected data is too large (> 900 KB). Deselect some images and try again.');
      return;
    }

    try {
      setStep('encrypting');

      // 1. Look up receiver's pre-registered x25519 public key from Firestore
      setStatusMsg("Looking up receiver's registered encryption key…");
      const receiverPubKey = await getReceiverPublicKey(receiver);
      if (!receiverPubKey) {
        throw new Error(
          "Receiver hasn't registered their encryption key yet. " +
          'Ask them to open this app, connect MetaMask, and click "Register Encryption Key".',
        );
      }

      // 2. Generate AES-256-GCM key
      setStatusMsg('Generating AES-256-GCM key…');
      const aesKey    = await generateAESKey();
      const rawAESKey = await exportAESKey(aesKey);

      // 3. Encrypt the payload
      setStatusMsg('Encrypting KYC data with AES-256-GCM…');
      const { iv, ciphertext } = await encryptFileAES(aesKey, payloadBytes.buffer);

      // 4. Encrypt AES key with receiver's public key
      setStatusMsg("Encrypting AES key with receiver's public key…");
      const encryptedAESKey = encryptAESKeyForReceiver(receiverPubKey, rawAESKey);

      // 5. Pack IV + ciphertext → base64 string (stored directly in Firestore, no Storage needed)
      setStatusMsg('Packing encrypted data…');
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);
      const encryptedData = Buffer.from(combined).toString('base64');

      // 6. Write Firestore record — encrypted blob stored inline, no Firebase Storage
      setStatusMsg('Saving to Firestore…');
      const expiryTs = Math.floor(Date.now() / 1000) + Number(expiryHours) * 3600;

      let senderAddress = 'unknown';
      try {
        const accounts = await (window.ethereum as any)?.request({ method: 'eth_accounts' });
        if (Array.isArray(accounts) && accounts.length > 0) senderAddress = accounts[0].toLowerCase();
      } catch { /* ignore */ }

      const docRef = await addDoc(collection(db, 'sharedFiles'), {
        sender:          senderAddress,
        receiver:        receiver.toLowerCase(),
        encryptedAESKey,
        encryptedData,           // base64-encoded [ IV (12B) + AES-GCM ciphertext ]
        fileName,
        fileSize:        payloadBytes.byteLength,
        expiry:          expiryTs,
        expiryFirestore: Timestamp.fromMillis(expiryTs * 1000),
        createdAt:       Timestamp.now(),
        type:            'kyc-verification',
      });

      setShareId(docRef.id);
      setStep('done');
      setStatusMsg('');
      toast.success('KYC data encrypted and shared securely!');
    } catch (err: any) {
      setError(err.message ?? 'Encryption failed.');
      setStep('configure');
      setStatusMsg('');
    }
  }, [receiver, expiryHours, selection, data]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">

        {/* ── STEP: select ── */}
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Share Verification
              </DialogTitle>
              <DialogDescription>
                Choose which KYC data to include. Only selected items will be encrypted and sent.
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="space-y-3 py-2">
              <CheckItem
                id="personalData"
                checked={selection.personalData}
                available={has.personalData}
                onToggle={() => toggle('personalData')}
                icon={<User className="h-4 w-4 text-primary" />}
                label="Personal Data"
                description={
                  data.personalData
                    ? [data.personalData.name, data.personalData.dob, data.personalData.gender, data.personalData.state]
                        .filter(Boolean).join(' · ')
                    : 'Not available'
                }
              />
              <CheckItem
                id="aadhaarImage"
                checked={selection.aadhaarImage}
                available={has.aadhaarImage}
                onToggle={() => toggle('aadhaarImage')}
                icon={<Image className="h-4 w-4 text-primary" />}
                label="Aadhaar Photo"
                description={has.aadhaarImage ? 'Photo extracted from Aadhaar document' : 'Not available'}
                thumbnail={has.aadhaarImage ? data.aadhaarImage : undefined}
              />
              <CheckItem
                id="passportImage"
                checked={selection.passportImage}
                available={has.passportImage}
                onToggle={() => toggle('passportImage')}
                icon={<Image className="h-4 w-4 text-primary" />}
                label="Passport Size Photo"
                description={has.passportImage ? 'Passport-size photo provided during KYC' : 'Not available'}
                thumbnail={has.passportImage ? data.passportImage : undefined}
              />
              <CheckItem
                id="liveImage"
                checked={selection.liveImage}
                available={has.liveImage}
                onToggle={() => toggle('liveImage')}
                icon={<Image className="h-4 w-4 text-primary" />}
                label="Live Capture"
                description={has.liveImage ? 'Live face capture taken during verification' : 'Not available'}
                thumbnail={has.liveImage ? data.liveImage : undefined}
              />
            </div>

            <Separator />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep('configure')} disabled={noneSelected} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP: configure ── */}
        {step === 'configure' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Configure Secure Share
              </DialogTitle>
              <DialogDescription>
                The selected KYC data will be encrypted with AES-256-GCM.
                Only MetaMask on the receiver's device can decrypt it.
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="space-y-4 py-2">
              {/* Badge summary */}
              <div className="flex flex-wrap gap-1.5">
                {selection.personalData  && has.personalData  && <Badge variant="outline" className="text-xs gap-1"><User  className="h-3 w-3" />Personal Data</Badge>}
                {selection.aadhaarImage  && has.aadhaarImage  && <Badge variant="outline" className="text-xs gap-1"><Image className="h-3 w-3" />Aadhaar Photo</Badge>}
                {selection.passportImage && has.passportImage && <Badge variant="outline" className="text-xs gap-1"><Image className="h-3 w-3" />Passport Photo</Badge>}
                {selection.liveImage     && has.liveImage     && <Badge variant="outline" className="text-xs gap-1"><Image className="h-3 w-3" />Live Capture</Badge>}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="receiverAddr">Receiver's Ethereum Address</Label>
                <Input
                  id="receiverAddr"
                  placeholder="0x..."
                  value={receiver}
                  onChange={(e) => { setReceiver(e.target.value.trim()); setError(''); }}
                />
                <p className="text-xs text-muted-foreground">
                  MetaMask will fetch their x25519 public key. The receiver must have MetaMask installed.
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
                  After expiry the file is permanently inaccessible.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1.5 text-xs text-muted-foreground bg-muted/30">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" /> End-to-End Encryption
                </p>
                <ul className="space-y-1 pl-1">
                  <li>🔐 File encrypted with AES-256-GCM in your browser</li>
                  <li>🔑 AES key encrypted with receiver's MetaMask public key</li>
                  <li>☁️ Only encrypted data stored in Firebase</li>
                  <li>🚫 No plaintext ever leaves your device</li>
                </ul>
              </div>
            </div>

            <Separator />

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setError(''); setStep('select'); }} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleEncryptAndShare} disabled={!receiver} className="gap-2">
                <Lock className="h-4 w-4" /> Encrypt &amp; Share
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP: encrypting ── */}
        {step === 'encrypting' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Encrypting…
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-center">{statusMsg}</p>
              {statusMsg.includes('MetaMask') && (
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  MetaMask may show a popup — please approve the key request.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── STEP: done ── */}
        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Shared Successfully!
              </DialogTitle>
              <DialogDescription>
                KYC data encrypted and stored. Send the Share ID to the receiver.
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="space-y-4 py-2">
              <Alert className="border-green-500/40 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  File encrypted with AES-256-GCM and stored in Firebase. Only the receiver's MetaMask can decrypt it.
                </AlertDescription>
              </Alert>

              <div className="space-y-1.5">
                <Label>Share ID — send this to the receiver</Label>
                <div className="flex gap-2">
                  <Input readOnly value={shareId} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(shareId);
                      toast.success('Share ID copied!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The receiver opens <strong>Receive File</strong> in this app, pastes the ID,
                  connects their MetaMask wallet, and decrypts the file locally.
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">What was stored:</p>
                <ul className="space-y-1">
                  <li>🗄️ <strong className="text-foreground">Firebase Storage</strong> — AES-256-GCM encrypted blob</li>
                  <li>📄 <strong className="text-foreground">Firestore</strong> — sender/receiver addresses, encrypted AES key, expiry</li>
                  <li>🔒 <strong className="text-foreground">Never stored</strong> — plaintext data · plaintext AES key · any private key</li>
                </ul>
              </div>
            </div>

            <Separator />

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};

// ─── Sub-component: CheckItem ──────────────────────────────────────────────────

interface CheckItemProps {
  id: string;
  checked: boolean;
  available: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  thumbnail?: string;
}

const CheckItem: React.FC<CheckItemProps> = ({
  id, checked, available, onToggle, icon, label, description, thumbnail,
}) => (
  <div
    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
      available ? 'cursor-pointer hover:bg-muted/50' : 'opacity-40 cursor-not-allowed'
    } ${checked && available ? 'border-primary bg-primary/5' : ''}`}
    onClick={() => available && onToggle()}
  >
    <Checkbox
      id={id}
      checked={checked}
      disabled={!available}
      onCheckedChange={() => available && onToggle()}
      className="mt-0.5"
    />
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1">
        <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer font-medium">
          {icon} {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {thumbnail && (
        <img
          src={thumbnail}
          alt={label}
          className="h-10 w-10 rounded object-cover border flex-shrink-0"
        />
      )}
    </div>
  </div>
);
