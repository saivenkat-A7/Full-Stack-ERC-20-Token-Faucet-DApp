export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const FAUCET_ABI = [
  "function requestTokens()",
  "function canClaim(address) view returns (bool)",
  "function remainingAllowance(address) view returns (uint256)",
  "function isPaused() view returns (bool)",
  "function lastClaimAt(address) view returns (uint256)",
  "function totalClaimed(address) view returns (uint256)",
  "function timeUntilNextClaim(address) view returns (uint256)",
  "function FAUCET_AMOUNT() view returns (uint256)",
  "function COOLDOWN_TIME() view returns (uint256)",
  "function MAX_CLAIM_AMOUNT() view returns (uint256)",
  "event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp)",
  "event FaucetPaused(bool paused)"
];

export const getContractAddresses = () => {
  return {
    token: import.meta.env.VITE_TOKEN_ADDRESS || "",
    faucet: import.meta.env.VITE_FAUCET_ADDRESS || "",
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
    networkId: import.meta.env.VITE_NETWORK_ID || "11155111"
  };
};