const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy Token (with zero address first, will update minter after faucet deployment)
  console.log("\nDeploying FaucetToken...");
  const Token = await hre.ethers.getContractFactory("FaucetToken");
  const token = await Token.deploy(hre.ethers.ZeroAddress);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("FaucetToken deployed to:", tokenAddress);

  // Deploy Faucet
  console.log("\nDeploying TokenFaucet...");
  const Faucet = await hre.ethers.getContractFactory("TokenFaucet");
  const faucet = await Faucet.deploy(tokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("TokenFaucet deployed to:", faucetAddress);

  // Set faucet as minter
  console.log("\nSetting faucet as minter...");
  const tx = await token.setMinter(faucetAddress);
  await tx.wait();
  console.log("Faucet set as minter");

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    token: tokenAddress,
    faucet: faucetAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", deploymentFile);

  // Create .env file for frontend
  const frontendEnv = `VITE_RPC_URL=${process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY"}
VITE_TOKEN_ADDRESS=${tokenAddress}
VITE_FAUCET_ADDRESS=${faucetAddress}
VITE_NETWORK_ID=11155111
`;

  const frontendEnvPath = path.join(__dirname, "../frontend/.env");
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log("Frontend .env file created");

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Token:", tokenAddress);
  console.log("Faucet:", faucetAddress);
  console.log("\nEtherscan verification:");
  console.log(`Token: https://sepolia.etherscan.io/address/${tokenAddress}`);
  console.log(`Faucet: https://sepolia.etherscan.io/address/${faucetAddress}`);
  
  console.log("\nTo verify contracts on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${tokenAddress} "${hre.ethers.ZeroAddress}"`);
  console.log(`npx hardhat verify --network sepolia ${faucetAddress} "${tokenAddress}"`);

  // Wait for Etherscan to index
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for Etherscan to index contracts...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("\nVerifying Token contract...");
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [hre.ethers.ZeroAddress],
      });
      console.log("Token verified!");
    } catch (error) {
      console.log("Token verification error:", error.message);
    }

    try {
      console.log("\nVerifying Faucet contract...");
      await hre.run("verify:verify", {
        address: faucetAddress,
        constructorArguments: [tokenAddress],
      });
      console.log("Faucet verified!");
    } catch (error) {
      console.log("Faucet verification error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });