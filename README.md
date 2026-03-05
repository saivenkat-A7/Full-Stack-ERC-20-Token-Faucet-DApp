# ERC-20 Token Faucet DApp

A full-stack ERC-20 Token Faucet DApp with on-chain rate limiting, lifetime claim caps, admin controls, frontend wallet integration, and Dockerized production deployment.

---

## Features

* ERC-20 compliant token  
* Faucet with:
  * 24-hour cooldown per address  
  * Lifetime claim limit  
  * Admin pause / unpause  
  * Reentrancy protection  
* Full Hardhat test suite  
* Frontend wallet integration  
* Mandatory `window.__EVAL__` interface  
* Dockerized frontend with `/health` endpoint  

---

## Tech Stack

* Solidity `0.8.20`  
* Hardhat + Ethers v6  
* React + Vite  
* Docker + Nginx  
* Localhost / Sepolia compatible  

---

## Contracts

### `Token.sol`

* ERC-20 token  
* Fixed max supply  
* Minting restricted to Faucet contract (owner-only)  

### `TokenFaucet.sol`

* Enforces 24h cooldown  
* Enforces lifetime claim cap  
* Owner-controlled pause / unpause  
* Emits `TokensClaimed` events  
* Uses checks-effects-interactions pattern  
* Reentrancy protected  

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Compile contracts
```bash
npx hardhat compile
```

### 3. Run tests
```bash
npx hardhat test
```

All core faucet behaviors are covered:
* Claim success  
* Cooldown enforcement  
* Lifetime limit  
* Pause / unpause  
* Access control  

### 4. Start local blockchain
```bash
npx hardhat node
```

### 5. Deploy contracts (new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

This deploys:
* ERC-20 Token  
* Faucet contract  
* Transfers token ownership to the faucet  

---

## Frontend

### Build frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Docker Deployment

### Build and run
```bash
docker-compose up -d --build
```

### Health check
```bash
curl http://localhost:3000/health
```

Expected response:
```text
OK
```

### Frontend access
```bash
http://localhost:3000
```

---

## Evaluation Interface

The frontend exposes the mandatory evaluation interface:

```js
window.__EVAL__
```

### Available methods
```js
await window.__EVAL__.claim();   // "CLAIM_SUCCESS" or revert reason
await window.__EVAL__.status();  // "ACTIVE" or "PAUSED"
```

This interface is used for automated evaluation and testing.

---

## Environment Variables

### `.env.example`
```env
SEPOLIA_RPC_URL=YOUR_RPC_URL
PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```
