import { ethers } from 'ethers';

export class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.listeners = new Set();
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error("MetaMask or compatible wallet not found. Please install MetaMask.");
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.address = accounts[0];

      // Setup listeners
      this.setupListeners();

      this.notifyListeners();
      return this.address;
    } catch (error) {
      console.error("Connection error:", error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  setupListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.address = accounts[0];
        this.notifyListeners();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    window.ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.notifyListeners();
  }

  isConnected() {
    return this.address !== null;
  }

  getAddress() {
    return this.address;
  }

  getSigner() {
    return this.signer;
  }

  getProvider() {
    return this.provider;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback({
      connected: this.isConnected(),
      address: this.address
    }));
  }

  async switchToSepolia() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (switchError) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }
}

export const walletManager = new WalletManager();