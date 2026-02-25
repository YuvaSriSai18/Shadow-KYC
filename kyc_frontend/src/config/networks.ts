import { Chain, defineChain } from 'viem';

export const NETWORKS = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    wsUrl: 'wss://sepolia.infura.io/ws/v3/YOUR_INFURA_KEY',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    chainId: '0xaa36a7',
  },
  devnet: {
    id: 181222,
    name: 'DataHaven Local Devnet',
    rpcUrl: 'http://127.0.0.1:9666',
    wsUrl: 'ws://127.0.0.1:9666',
    mspUrl: 'http://127.0.0.1:8080/',
    nativeCurrency: { name: 'StorageHub', symbol: 'SH', decimals: 18 },
    filesystemContractAddress:
      '0x0000000000000000000000000000000000000064' as `0x${string}`,
  },
  testnet: {
    id: 55931,
    idHex: '0xda7b',
    name: 'DataHaven Testnet',
    rpcUrl: 'https://services.datahaven-testnet.network/testnet',
    wsUrl: 'wss://services.datahaven-testnet.network/testnet',
    mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
    nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
  },
};

export const NETWORK = NETWORKS.testnet; // Change this to switch between devnet and testnet

// Create viem Chain types
export const sepoliaChain: Chain = defineChain({
  id: NETWORKS.sepolia.id,
  name: NETWORKS.sepolia.name,
  nativeCurrency: NETWORKS.sepolia.nativeCurrency,
  rpcUrls: { default: { http: [NETWORKS.sepolia.rpcUrl] } },
});

export const chain: Chain = defineChain({
  id: NETWORK.id,
  name: NETWORK.name,
  nativeCurrency: NETWORK.nativeCurrency,
  rpcUrls: { default: { http: [NETWORK.rpcUrl] } },
});