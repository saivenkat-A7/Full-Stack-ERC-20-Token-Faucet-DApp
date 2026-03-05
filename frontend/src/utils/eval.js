import { ethers } from "ethers";
import { claimTokens } from "./contracts";

window.__EVAL__ = {
  connectWallet: async () => {
    if (!window.ethereum) return "NO_WALLET";
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.getAddress();
  },

  claimTokens: async () => {
    try {
      await claimTokens();
      return "CLAIM_SUCCESS";
    } catch (e) {
      return e?.reason || e?.message || "CLAIM_FAILED";
    }
  },

  getBalance: async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(
        import.meta.env.VITE_TOKEN_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      const bal = await token.balanceOf(await signer.getAddress());
      return bal.toString();
    } catch {
      return "0";
    }
  },

  isPaused: async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const faucet = new ethers.Contract(
        import.meta.env.VITE_FAUCET_ADDRESS,
        ["function isPaused() view returns (bool)"],
        provider
      );
      return await faucet.isPaused();
    } catch {
      return false;
    }
  }
};
