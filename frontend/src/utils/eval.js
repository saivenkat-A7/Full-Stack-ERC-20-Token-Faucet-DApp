import { walletManager } from './wallet.js';
import { blockchainService } from './blockchain.js';
import { getContractAddresses } from './contracts.js';

// Expose evaluation interface on window object
window.__EVAL__ = {
  async connectWallet() {
    try {
      const address = await walletManager.connect();
      return address;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  },

  async requestTokens() {
    try {
      const txHash = await blockchainService.requestTokens();
      return txHash;
    } catch (error) {
      throw new Error(`Failed to request tokens: ${error.message}`);
    }
  },

  async getBalance(address) {
    try {
      const balance = await blockchainService.getBalance(address);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  },

  async canClaim(address) {
    try {
      const canClaim = await blockchainService.canClaim(address);
      return canClaim;
    } catch (error) {
      throw new Error(`Failed to check claim eligibility: ${error.message}`);
    }
  },

  async getRemainingAllowance(address) {
    try {
      const allowance = await blockchainService.getRemainingAllowance(address);
      return allowance;
    } catch (error) {
      throw new Error(`Failed to get remaining allowance: ${error.message}`);
    }
  },

  async getContractAddresses() {
    try {
      const addresses = getContractAddresses();
      return {
        token: addresses.token,
        faucet: addresses.faucet
      };
    } catch (error) {
      throw new Error(`Failed to get contract addresses: ${error.message}`);
    }
  }
};

console.log("Evaluation interface loaded: window.__EVAL__");