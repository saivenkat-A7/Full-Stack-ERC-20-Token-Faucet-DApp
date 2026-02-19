# ERC-20 Token Faucet DApp

A full-stack decentralized application that distributes ERC-20 tokens with rate limiting and lifetime claim limits enforced on-chain.
 
## Overview    
    
This DApp demonstrates production-ready Web3 development with: 
- Smart contract design with on-chain access control 
- Wallet integration following EIP-1193 standards
- Real-time state synchronization between blockchain and UI
- Gas-efficient state management
- Complete containerization with Docker

##  Architecture

### Smart Contracts

**FaucetToken.sol** - ERC-20 compliant token with:
- Fixed maximum supply of 1,000,000 tokens
- Restricted minting capability (only faucet contract can mint)
- OpenZeppelin ERC-20 implementation for security

**TokenFaucet.sol** - Faucet distribution contract with:
- Fixed distribution of 100 tokens per claim
- 24-hour cooldown period between claims
- Lifetime maximum of 1,000 tokens per address
- Pause/unpause functionality (admin only)
- Event emissions for all state changes

### Frontend

Built with React and Ethers.js:
- Wallet connection with MetaMask
- Real-time balance and claim status updates
- Countdown timer for cooldown periods
- User-friendly error messages
- Responsive design

## Deployed Contracts

### Sepolia Testnet

**Token Contract:** `[UPDATE_AFTER_DEPLOYMENT]`
- Etherscan: https://sepolia.etherscan.io/address/[TOKEN_ADDRESS]

**Faucet Contract:** `[UPDATE_AFTER_DEPLOYMENT]`
- Etherscan: https://sepolia.etherscan.io/address/[FAUCET_ADDRESS]

##  Quick Start


### Running with Docker

1. Clone the repository and navigate to the submission folder

2. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your deployed contract addresses
```

3. Start the application:
```bash
docker compose up
```

4. Access the application at http://localhost:3000



### Local Development

#### Smart Contracts

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_TOKEN_ADDRESS=0xYourDeployedTokenAddress
VITE_FAUCET_ADDRESS=0xYourDeployedFaucetAddress
VITE_NETWORK_ID=11155111

SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Contract Parameters

- **Faucet Amount:** 100 tokens per claim
- **Cooldown Period:** 24 hours (86,400 seconds)
- **Lifetime Limit:** 1,000 tokens per address
- **Max Supply:** 1,000,000 tokens

These values were chosen to:
- Balance user accessibility with scarcity (100 tokens per claim)
- Prevent abuse while allowing regular usage (24-hour cooldown)
- Ensure fair distribution (1,000 token lifetime limit)
- Maintain token economics (1M total supply)

##  Testing

### Smart Contract Tests

Comprehensive test suite covering:
- Token deployment and minting
- Faucet claim mechanics
- Cooldown enforcement
- Lifetime limit enforcement
- Pause functionality
- Access control
- Event emissions
- Edge cases

Run tests:
```bash
npx hardhat test
```

### Frontend Evaluation Interface

The application exposes `window.__EVAL__` for programmatic testing:

```javascript
// Connect wallet
const address = await window.__EVAL__.connectWallet();

// Request tokens
const txHash = await window.__EVAL__.requestTokens();

// Check balance
const balance = await window.__EVAL__.getBalance(address);

// Check eligibility
const canClaim = await window.__EVAL__.canClaim(address);

// Get remaining allowance
const allowance = await window.__EVAL__.getRemainingAllowance(address);

// Get contract addresses
const addresses = await window.__EVAL__.getContractAddresses();
```

## Security Considerations

1. **Reentrancy Protection:** Uses OpenZeppelin's ReentrancyGuard on the requestTokens function
2. **Access Control:** Only admin can pause; only faucet can mint tokens
3. **Integer Overflow:** Solidity 0.8.x built-in overflow protection
4. **Checks-Effects-Interactions:** State updates before external calls
5. **Input Validation:** All inputs validated and sanitized
6. **Gas Optimization:** Efficient storage packing and minimal storage writes





##  Technology Stack

- **Smart Contracts:** Solidity 0.8.20
- **Development Framework:** Hardhat
- **Contract Libraries:** OpenZeppelin
- **Frontend:** React 18
- **Blockchain Library:** Ethers.js v6
- **Build Tool:** Vite
- **Containerization:** Docker
- **Network:** Sepolia Testnet

## Limitations

1. **Testnet Dependency:** Requires Sepolia testnet ETH for gas
2. **Wallet Requirement:** Users need MetaMask or compatible wallet
3. **Network Switching:** Users must manually switch to Sepolia
4. **Rate Limiting:** 24-hour cooldown may be restrictive for testing
5. **Lifetime Limit:** Users reaching limit need new addresses

##  Future Improvements

- Support for multiple networks
- Gasless transactions using meta-transactions
- Enhanced admin dashboard
- Claim history visualization
- Email/social login integration
- Dynamic claim amounts based on demand
- Referral system

##  Contract Verification

After deployment, verify contracts on Etherscan:

```bash
npx hardhat verify --network sepolia <TOKEN_ADDRESS> "0x0000000000000000000000000000000000000000"
npx hardhat verify --network sepolia <FAUCET_ADDRESS> "<TOKEN_ADDRESS>"
```

