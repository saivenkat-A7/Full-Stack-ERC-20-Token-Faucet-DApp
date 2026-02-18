import { ethers } from 'ethers';
import { TOKEN_ABI, FAUCET_ABI, getContractAddresses } from './contracts.js';
import { walletManager } from './wallet.js';

export class BlockchainService {
  constructor() {
    this.provider = null;
    this.tokenContract = null;
    this.faucetContract = null;
    this.addresses = getContractAddresses();
    this.initProvider();
  }

  initProvider() {
    this.provider = new ethers.JsonRpcProvider(this.addresses.rpcUrl);
  }

  getTokenContract(signerOrProvider = null) {
    const providerOrSigner = signerOrProvider || this.provider;
    if (!this.tokenContract || signerOrProvider) {
      this.tokenContract = new ethers.Contract(
        this.addresses.token,
        TOKEN_ABI,
        providerOrSigner
      );
    }
    return this.tokenContract;
  }

  getFaucetContract(signerOrProvider = null) {
    const providerOrSigner = signerOrProvider || this.provider;
    if (!this.faucetContract || signerOrProvider) {
      this.faucetContract = new ethers.Contract(
        this.addresses.faucet,
        FAUCET_ABI,
        providerOrSigner
      );
    }
    return this.faucetContract;
  }

  async getBalance(address) {
    try {
      const contract = this.getTokenContract();
      const balance = await contract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      console.error("Error getting balance:", error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async canClaim(address) {
    try {
      const contract = this.getFaucetContract();
      return await contract.canClaim(address);
    } catch (error) {
      console.error("Error checking claim eligibility:", error);
      throw new Error(`Failed to check eligibility: ${error.message}`);
    }
  }

  async getRemainingAllowance(address) {
    try {
      const contract = this.getFaucetContract();
      const allowance = await contract.remainingAllowance(address);
      return allowance.toString();
    } catch (error) {
      console.error("Error getting remaining allowance:", error);
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  async getTimeUntilNextClaim(address) {
    try {
      const contract = this.getFaucetContract();
      const time = await contract.timeUntilNextClaim(address);
      return Number(time);
    } catch (error) {
      console.error("Error getting time until next claim:", error);
      return 0;
    }
  }

  async requestTokens() {
    try {
      if (!walletManager.isConnected()) {
        throw new Error("Wallet not connected");
      }

      const signer = walletManager.getSigner();
      const contract = this.getFaucetContract(signer);

      const tx = await contract.requestTokens();
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error) {
      console.error("Error requesting tokens:", error);
      
      // Parse error message
      let errorMessage = "Transaction failed";
      if (error.message.includes("Faucet is paused")) {
        errorMessage = "Faucet is currently paused";
      } else if (error.message.includes("Cannot claim tokens")) {
        errorMessage = "You must wait 24 hours between claims";
      } else if (error.message.includes("Lifetime claim limit reached")) {
        errorMessage = "You have reached your lifetime claim limit";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      }
      
      throw new Error(errorMessage);
    }
  }

  async getFaucetInfo() {
    try {
      const contract = this.getFaucetContract();
      const [faucetAmount, cooldownTime, maxClaimAmount] = await Promise.all([
        contract.FAUCET_AMOUNT(),
        contract.COOLDOWN_TIME(),
        contract.MAX_CLAIM_AMOUNT()
      ]);

      return {
        faucetAmount: ethers.formatEther(faucetAmount),
        cooldownTime: Number(cooldownTime),
        maxClaimAmount: ethers.formatEther(maxClaimAmount)
      };
    } catch (error) {
      console.error("Error getting faucet info:", error);
      return {
        faucetAmount: "100",
        cooldownTime: 86400,
        maxClaimAmount: "1000"
      };
    }
  }

  listenToEvents(callback) {
    try {
      const contract = this.getFaucetContract();
      
      contract.on("TokensClaimed", (user, amount, timestamp, event) => {
        callback({
          type: "TokensClaimed",
          user,
          amount: ethers.formatEther(amount),
          timestamp: Number(timestamp),
          transactionHash: event.log.transactionHash
        });
      });

      return () => {
        contract.removeAllListeners("TokensClaimed");
      };
    } catch (error) {
      console.error("Error setting up event listeners:", error);
      return () => {};
    }
  }
}

export const blockchainService = new BlockchainService();