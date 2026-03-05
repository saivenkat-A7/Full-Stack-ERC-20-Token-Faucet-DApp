import { ethers } from "ethers";

const FAUCET_ADDRESS = import.meta.env.VITE_FAUCET_ADDRESS;
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;

const faucetAbi = [
  "function requestTokens()",
  "function isPaused() view returns (bool)"
];


function getProvider() {
  if (!window.ethereum) throw new Error("No wallet");
  return new ethers.BrowserProvider(window.ethereum);
}

async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
}

async function getFaucet() {
  if (!FAUCET_ADDRESS) throw new Error("Missing faucet address");
  const signer = await getSigner();
  return new ethers.Contract(FAUCET_ADDRESS, faucetAbi, signer);
}

export async function claimTokens() {
  const faucet = await getFaucet();
  const tx = await faucet.requestTokens();
  await tx.wait();
}

export async function getStatus() {
  try {
    if (!window.ethereum) return "NO_WALLET";

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Basic connectivity check
    await signer.getAddress();

    return "READY";
  } catch (err) {
    return "STATUS_ERROR";
  }
}
