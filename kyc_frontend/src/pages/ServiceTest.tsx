import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Copy, Trash2 } from 'lucide-react';
import { getConnectedAddress, getWalletClient, getStorageHubClient } from '@/services/clientService';
import { getMspClient, getMspHealth, authenticateUser, clearSession } from '@/services/mspService';
import { testBucketAndFileUpload, uploadFileToDataHaven, getBucketInfo, initializeStorageServices } from '@/services/storageService';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function ServiceTest() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logId, setLogId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const newLog: LogEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
    setLogId(logId + 1);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const clearLogs = () => setLogs([]);

  // ────────────────────────────────────────────────────────────────────────────
  // Client Service Tests
  // ────────────────────────────────────────────────────────────────────────────

  const testInitializeApp = async () => {
    setIsLoading(true);
    try {
      addLog('Initializing app...', 'info');
      await initializeStorageServices();
      addLog('✅ App initialization completed', 'success');
    } catch (err) {
      addLog(`❌ Initialize failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetConnectedAddress = () => {
    try {
      addLog('Fetching connected address...', 'info');
      const address = getConnectedAddress();
      if (address) {
        addLog(`✅ Connected address: ${address}`, 'success');
      } else {
        addLog('⚠️ No wallet connected. Try connecting MetaMask first.', 'warning');
      }
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const testGetWalletClient = async () => {
    setIsLoading(true);
    try {
      addLog('Getting wallet client...', 'info');
      const wc = await getWalletClient();
      if (wc) {
        addLog(`✅ Wallet client ready (account: ${wc.account?.address})`, 'success');
      } else {
        addLog('❌ Wallet client is null', 'error');
      }
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetStorageHubClient = async () => {
    setIsLoading(true);
    try {
      addLog('Getting StorageHub client...', 'info');
      const sc = await getStorageHubClient();
      if (sc) {
        addLog('✅ StorageHub client ready', 'success');
      } else {
        addLog('❌ StorageHub client is null', 'error');
      }
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // MSP Service Tests
  // ────────────────────────────────────────────────────────────────────────────

  const testGetMspClient = async () => {
    setIsLoading(true);
    try {
      addLog('Connecting to MSP client...', 'info');
      const client = await getMspClient();
      if (client) {
        addLog('✅ MSP client connected', 'success');
      } else {
        addLog('❌ MSP client is null', 'error');
      }
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetMspHealth = async () => {
    setIsLoading(true);
    try {
      addLog('Checking MSP health...', 'info');
      const health = await getMspHealth();
      addLog(`✅ MSP Health: ${health}`, 'success');
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthenticateUser = async () => {
    setIsLoading(true);
    try {
      addLog('Authenticating user with SIWE...', 'info');
      const user = await authenticateUser();
      addLog(`✅ SIWE Authentication successful`, 'success');
      addLog(`User: ${JSON.stringify(user)}`, 'info');
    } catch (err) {
      addLog(`❌ SIWE Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testClearSession = async () => {
    try {
      addLog('Clearing session...', 'info');
      await clearSession();
      addLog('✅ Session cleared', 'success');
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Storage Service Tests
  // ────────────────────────────────────────────────────────────────────────────

  const testBucketCreation = async () => {
    setIsLoading(true);
    try {
      addLog('Testing bucket creation and file upload...', 'info');
      const result = await testBucketAndFileUpload();
      addLog(`✅ Bucket created: ${result.bucketId}`, 'success');
      addLog(`📄 File uploaded: ${result.fileKey}`, 'success');
      addLog(`🔐 Authenticated: ${result.authenticated ? 'Yes' : 'No'}`, 'info');
    } catch (err) {
      addLog(`❌ Bucket test error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testFileUpload = async () => {
    setIsLoading(true);
    try {
      const walletAddress = getConnectedAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const bucketId = walletAddress.toLowerCase();
      const fileName = `test/test-${Date.now()}.txt`;
      const fileContent = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'This is a test file from ServiceTest',
      }, null, 2);

      addLog(`Uploading test file to bucket: ${bucketId}`, 'info');
      const result = await uploadFileToDataHaven(
        bucketId,
        fileName,
        fileContent,
        'application/json'
      );

      if (result.success) {
        addLog(`✅ File uploaded successfully: ${result.fileName}`, 'success');
        addLog(`📊 File size: ${result.size} bytes`, 'info');
      }
    } catch (err) {
      addLog(`❌ File upload error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetBucketInfo = async () => {
    setIsLoading(true);
    try {
      const walletAddress = getConnectedAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const bucketId = walletAddress.toLowerCase();
      addLog(`Getting bucket info for: ${bucketId}`, 'info');
      const info = await getBucketInfo(bucketId);

      addLog(`✅ Bucket exists: ${info.exists ? 'Yes' : 'No'}`, 'success');
      addLog(`📁 Files in bucket: ${info.fileCount}`, 'info');
    } catch (err) {
      addLog(`❌ Bucket info error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <div className="h-4 w-4 text-blue-600">ℹ️</div>;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Service Testing Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Test clientService and mspService functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Buttons */}
          <div className="lg:col-span-1 space-y-4">
            {/* Client Service Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">clientService Tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={testInitializeApp}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Initialize App
                </Button>
                <Button
                  onClick={testGetConnectedAddress}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  Get Connected Address
                </Button>
                <Button
                  onClick={testGetWalletClient}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Get Wallet Client
                </Button>
                <Button
                  onClick={testGetStorageHubClient}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Get StorageHub Client
                </Button>
              </CardContent>
            </Card>

            {/* MSP Service Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">mspService Tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={testGetMspClient}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Get MSP Client
                </Button>
                <Button
                  onClick={testGetMspHealth}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Check MSP Health
                </Button>
                <Button
                  onClick={testAuthenticateUser}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="default"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  SIWE Authenticate
                </Button>
                <Button
                  onClick={testClearSession}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  Clear Session
                </Button>
              </CardContent>
            </Card>

            {/* Storage Service Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">storageService Tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={testBucketCreation}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Bucket & Upload
                </Button>
                <Button
                  onClick={testFileUpload}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Upload Test File
                </Button>
                <Button
                  onClick={testGetBucketInfo}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Get Bucket Info
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Logs */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle>Execution Logs</CardTitle>
                <Button
                  onClick={clearLogs}
                  size="sm"
                  variant="ghost"
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                      <p>Click a button to start testing...</p>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={`${index}-${log.id}-${log.timestamp}`}
                        className={`p-3 rounded flex gap-3 items-start ${getLogColor(log.type)}`}
                      >
                        <div className="pt-0.5 flex-shrink-0">{getLogIcon(log.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {log.timestamp}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {log.type}
                            </Badge>
                          </div>
                          <p className="text-sm break-words mt-1 font-mono text-slate-700 dark:text-slate-300">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                Prerequisites:
              </p>
              <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 ml-2">
                <li>MetaMask browser extension installed</li>
                <li>Connected to DataHaven Testnet (Chain ID: 55931)</li>
                <li>Wallet account approved for connection</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
