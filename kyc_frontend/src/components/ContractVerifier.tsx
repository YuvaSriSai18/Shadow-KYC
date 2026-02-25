import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Wallet, Copy } from "lucide-react";

// Contract ABI
const VERIFIER_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256[2]",
                "name": "_pA",
                "type": "uint256[2]"
            },
            {
                "internalType": "uint256[2][2]",
                "name": "_pB",
                "type": "uint256[2][2]"
            },
            {
                "internalType": "uint256[2]",
                "name": "_pC",
                "type": "uint256[2]"
            },
            {
                "internalType": "uint256[3]",
                "name": "_pubSignals",
                "type": "uint256[3]"
            }
        ],
        "name": "verifyProof",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

const CONTRACT_ADDRESS = "0xe740dB54401524b286Ac35881013e6849300C14A";
const SEPOLIA_CHAIN_ID = 11155111;

interface VerificationResult {
    valid: boolean;
    blockNumber?: number;
    message: string;
}

interface ProofInputs {
    pA: string;
    pB: string;
    pC: string;
    pubSignals: string;
}

export function ContractVerifier() {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

    // Input state for proof data
    const [inputs, setInputs] = useState<ProofInputs>({
        pA: '["9145378444307675700604608785609512456551660761728279953972235841585655667766","20073329690138798698505289440597358629433265538981431097759303133475963710104"]',
        pB: '[["2034775962211501271100480579549775321877788201658822461916990234715157422090","12682102588970756874931896038273943141643204748335675794279497992220824762582"],["11288082119370304188105598595519095581033256072925531892983511610903093971646","17467515397705288659240659303323431748189185015510142105485827260507189332175"]]',
        pC: '["18506012845387674367722072265909360059531078101195487711669128058869184422563","19215015753438403558892779254994082004683676895319429721878854314560347360275"]',
        pubSignals: '["14","3","10578768231764529663015952240682172370053316410649887121895911169028814849661"]',
    });

    // Connect wallet
    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask not installed");
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            // Check network
            const chainId = await window.ethereum.request({
                method: "eth_chainId",
            });

            if (parseInt(chainId, 16) !== SEPOLIA_CHAIN_ID) {
                throw new Error("Please switch to Sepolia testnet");
            }

            // Create provider
            const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(ethProvider);
            setConnected(true);
            setError(null);
            console.log("✅ Connected to wallet:", accounts[0]);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to connect";
            setError(errorMsg);
            setConnected(false);
        }
    };

    // Validate and parse JSON input
    const validateAndParse = (key: string, value: string) => {
        try {
            const parsed = JSON.parse(value);
            const newErrors = { ...inputErrors };
            delete newErrors[key];
            setInputErrors(newErrors);
            return parsed;
        } catch {
            setInputErrors(prev => ({
                ...prev,
                [key]: `Invalid JSON format for ${key}`
            }));
            return null;
        }
    };

    // Handle input change
    const handleInputChange = (key: keyof ProofInputs, value: string) => {
        setInputs(prev => ({ ...prev, [key]: value }));
        // Clear error on change
        setInputErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
        });
    };

    // Verify proof on contract
    const handleVerifyProof = async () => {
        if (!provider) {
            setError("Wallet not connected");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        const errors: Record<string, string> = {};

        try {
            // Parse all inputs
            const pA = validateAndParse("pA", inputs.pA);
            const pB = validateAndParse("pB", inputs.pB);
            const pC = validateAndParse("pC", inputs.pC);
            const pubSignals = validateAndParse("pubSignals", inputs.pubSignals);

            if (!pA || !pB || !pC || !pubSignals) {
                setLoading(false);
                return;
            }

            // Validate array lengths
            if (!Array.isArray(pA) || pA.length !== 2) {
                errors.pA = "pA must be an array of 2 elements";
            }
            if (!Array.isArray(pB) || pB.length !== 2 || !Array.isArray(pB[0]) || pB[0].length !== 2) {
                errors.pB = "pB must be a 2x2 array";
            }
            if (!Array.isArray(pC) || pC.length !== 2) {
                errors.pC = "pC must be an array of 2 elements";
            }
            if (!Array.isArray(pubSignals) || pubSignals.length !== 3) {
                errors.pubSignals = "pubSignals must be an array of 3 elements";
            }

            if (Object.keys(errors).length > 0) {
                setInputErrors(errors);
                setLoading(false);
                return;
            }

            console.log("🔗 Creating contract instance...");
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                VERIFIER_ABI,
                provider
            );

            console.log("📝 Proof data:");
            console.log("pA:", pA);
            console.log("pB:", pB);
            console.log("pC:", pC);
            console.log("pubSignals:", pubSignals);

            console.log("🔄 Calling verifyProof...");
            const isValid = await contract.verifyProof(pA, pB, pC, pubSignals);

            const block = await provider.getBlockNumber();

            console.log("✅ Verification result:", isValid);

            setResult({
                valid: isValid,
                blockNumber: block,
                message: isValid
                    ? "✅ Proof verified successfully on Sepolia!"
                    : "❌ Proof verification failed",
            });
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : "Verification failed";
            console.error("Error:", errorMsg);
            setError(errorMsg);
            setResult({
                valid: false,
                message: "Verification error",
            });
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Transform proof with element reordering (pi_b reversal)
    const transformProofFormat = () => {
        try {
            const pA = validateAndParse("pA", inputs.pA);
            const pB = validateAndParse("pB", inputs.pB);
            const pC = validateAndParse("pC", inputs.pC);

            if (!pA || !pB || !pC) {
                setError("Invalid JSON in one or more fields");
                return;
            }

            // Transform: reorder pi_b elements
            const transformedA = [pA[0], pA[1]];
            const transformedB = [
                [pB[0][1], pB[0][0]],
                [pB[1][1], pB[1][0]]
            ];
            const transformedC = [pC[0], pC[1]];

            // Update inputs with transformed values
            setInputs(prev => ({
                ...prev,
                pA: JSON.stringify(transformedA),
                pB: JSON.stringify(transformedB),
                pC: JSON.stringify(transformedC)
            }));

            console.log("✅ Proof format transformed");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Transform failed";
            setError(errorMsg);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Smart Contract Proof Verifier
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Wallet Connection */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-sm">
                                Network: <span className="text-blue-600">Sepolia Testnet</span>
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Contract: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">{CONTRACT_ADDRESS}</code>
                            </p>
                        </div>
                        <Button
                            onClick={connectWallet}
                            disabled={connected}
                            variant={connected ? "default" : "outline"}
                        >
                            {connected ? "✅ Connected" : "Connect Wallet"}
                        </Button>
                    </div>
                </div>

                {/* Proof Input Fields */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Proof Data (JSON Format)</h3>

                    {/* pA Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold">pA (uint256[2])</label>
                        <textarea
                            value={inputs.pA}
                            onChange={(e) => handleInputChange("pA", e.target.value)}
                            className={`w-full p-2 rounded border text-xs font-mono resize-none focus:outline-none focus:ring-2 ${
                                inputErrors.pA
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            rows={2}
                            placeholder='["value1", "value2"]'
                        />
                        {inputErrors.pA && <p className="text-xs text-red-500">{inputErrors.pA}</p>}
                        <p className="text-xs text-gray-500">Array of 2 elements</p>
                    </div>

                    {/* pB Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold">pB (uint256[2][2])</label>
                        <textarea
                            value={inputs.pB}
                            onChange={(e) => handleInputChange("pB", e.target.value)}
                            className={`w-full p-2 rounded border text-xs font-mono resize-none focus:outline-none focus:ring-2 ${
                                inputErrors.pB
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            rows={3}
                            placeholder='[["value1", "value2"], ["value3", "value4"]]'
                        />
                        {inputErrors.pB && <p className="text-xs text-red-500">{inputErrors.pB}</p>}
                        <p className="text-xs text-gray-500">2x2 nested array</p>
                    </div>

                    {/* pC Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold">pC (uint256[2])</label>
                        <textarea
                            value={inputs.pC}
                            onChange={(e) => handleInputChange("pC", e.target.value)}
                            className={`w-full p-2 rounded border text-xs font-mono resize-none focus:outline-none focus:ring-2 ${
                                inputErrors.pC
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            rows={2}
                            placeholder='["value1", "value2"]'
                        />
                        {inputErrors.pC && <p className="text-xs text-red-500">{inputErrors.pC}</p>}
                        <p className="text-xs text-gray-500">Array of 2 elements</p>
                    </div>

                    {/* pubSignals Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold">Public Signals (uint256[3])</label>
                        <textarea
                            value={inputs.pubSignals}
                            onChange={(e) => handleInputChange("pubSignals", e.target.value)}
                            className={`w-full p-2 rounded border text-xs font-mono resize-none focus:outline-none focus:ring-2 ${
                                inputErrors.pubSignals
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            rows={2}
                            placeholder='["value1", "value2", "value3"]'
                        />
                        {inputErrors.pubSignals && <p className="text-xs text-red-500">{inputErrors.pubSignals}</p>}
                        <p className="text-xs text-gray-500">Array of 3 elements</p>
                    </div>
                </div>

                {/* Verify Button */}
                <Button
                    onClick={handleVerifyProof}
                    disabled={!connected || loading || Object.keys(inputErrors).length > 0}
                    className="w-full"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify Proof on Contract"
                    )}
                </Button>

                {/* Transform Button */}
                <Button
                    onClick={transformProofFormat}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                >
                    Transform Proof Format
                </Button>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <XCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Result Alert */}
                {result && (
                    <Alert
                        className={
                            result.valid
                                ? "border-green-500 bg-green-50 dark:bg-green-950"
                                : "border-red-500 bg-red-50 dark:bg-red-950"
                        }
                    >
                        <div className="flex items-start gap-3">
                            {result.valid ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                                <h4 className="font-semibold">{result.message}</h4>
                                {result.blockNumber && (
                                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                                        Block: {result.blockNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Alert>
                )}

                {/* Instructions */}
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded text-sm space-y-2">
                    <h4 className="font-semibold">📋 How to use</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Install MetaMask and switch to Sepolia testnet</li>
                        <li>Click "Connect Wallet"</li>
                        <li>Paste your proof data as JSON in each field</li>
                        <li>Click "Verify Proof on Contract"</li>
                        <li>Result will show if proof is valid</li>
                    </ol>
                </div>

                {/* Info */}
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs space-y-1">
                    <p>
                        <strong>Contract:</strong> Groth16Verifier
                    </p>
                    <p>
                        <strong>Function:</strong> verifyProof(_pA, _pB, _pC, _pubSignals)
                    </p>
                    <p>
                        <strong>Network:</strong> Sepolia (Chain ID: 11155111)
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Add ethers type support
declare global {
    interface Window {
        ethereum?: any;
    }
}
