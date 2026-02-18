# Testing Guide

## Smart Contract Testing

### Running Tests

```bash
# From root directory
npm install
npx hardhat test
```

### Test Coverage

The test suite covers:

1. **Deployment Tests**
   - Token contract initialization
   - Faucet contract initialization
   - Minter role assignment

2. **Claim Tests**
   - First-time token claims
   - Cooldown period enforcement
   - Lifetime limit enforcement
   - Multiple users claiming independently

3. **Pause Functionality**
   - Owner can pause/unpause
   - Claims blocked when paused
   - Non-owners cannot pause

4. **View Functions**
   - `canClaim()` accuracy
   - `remainingAllowance()` calculations
   - `timeUntilNextClaim()` countdown

5. **Edge Cases**
   - Zero balances
   - Partial cooldown periods
   - Maximum supply limits
   - Event emissions

### Time Manipulation

Tests use Hardhat's time manipulation:

```javascript
// Fast forward 24 hours
await time.increase(24 * 60 * 60);
```

## Frontend Testing

### Manual Testing Checklist

#### Wallet Connection
- [ ] Connect button appears when disconnected
- [ ] MetaMask prompt appears on click
- [ ] Address displays after connection
- [ ] Disconnect button works
- [ ] Account changes are detected
- [ ] Network changes trigger reload

#### Token Claims
- [ ] Balance displays correctly
- [ ] Claim button enabled when eligible
- [ ] Claim button disabled during cooldown
- [ ] Transaction confirmation shows
- [ ] Balance updates after claim
- [ ] Error messages display clearly

#### Cooldown Timer
- [ ] Timer shows correctly after claim
- [ ] Timer counts down in real-time
- [ ] Button re-enables at 0:00:00
- [ ] Claim status updates properly

#### Error Handling
- [ ] Wallet rejection handled gracefully
- [ ] Insufficient gas message clear
- [ ] Cooldown error message shown
- [ ] Lifetime limit error shown
- [ ] Network errors handled

### Evaluation Interface Testing

Open browser console and test:

```javascript
// Test wallet connection
const addr = await window.__EVAL__.connectWallet();
console.log("Connected:", addr);

// Test contract addresses
const addresses = await window.__EVAL__.getContractAddresses();
console.log("Addresses:", addresses);

// Test balance check
const balance = await window.__EVAL__.getBalance(addr);
console.log("Balance:", balance);

// Test eligibility check
const canClaim = await window.__EVAL__.canClaim(addr);
console.log("Can claim:", canClaim);

// Test remaining allowance
const allowance = await window.__EVAL__.getRemainingAllowance(addr);
console.log("Remaining:", allowance);

// Test claim (if eligible)
if (canClaim) {
  const txHash = await window.__EVAL__.requestTokens();
  console.log("Transaction:", txHash);
}
```

### Expected Behavior

#### First Time User
1. Connects wallet → sees address
2. Balance shows 0 FAUCET
3. Remaining allowance shows 1000 FAUCET
4. Claim status shows "Ready to claim!"
5. Clicks "Claim Tokens"
6. MetaMask confirmation appears
7. Transaction processes (loading indicator)
8. Success message with tx hash
9. Balance updates to 100 FAUCET
10. Remaining allowance shows 900 FAUCET
11. Cooldown timer starts at 24:00:00

#### Returning User (During Cooldown)
1. Connects wallet
2. Balance shows previous claims
3. Claim button shows countdown
4. Cannot claim until timer reaches 0

#### User at Lifetime Limit
1. Connects wallet
2. Total claimed shows 1000 FAUCET
3. Remaining allowance shows 0 FAUCET
4. Claim button disabled
5. Status shows "Cannot Claim"

## Docker Testing

### Build Test

```bash
# Build image
docker compose build

# Check build size
docker images | grep token-faucet
```

### Runtime Test

```bash
# Start container
docker compose up -d

# Check health
curl http://localhost:3000/health

# Check logs
docker compose logs -f

# Stop container
docker compose down
```

### Health Check Test

```bash
# Wait for container to be healthy
docker compose up -d
sleep 30
docker ps | grep healthy
```

## Performance Testing

### Gas Costs

Run with Hardhat gas reporter:

```bash
REPORT_GAS=true npx hardhat test
```

Expected gas costs:
- Token deployment: ~1,500,000 gas
- Faucet deployment: ~800,000 gas
- First claim: ~100,000 gas
- Subsequent claims: ~80,000 gas

### Load Testing

Multiple concurrent claims:

```javascript
// In Hardhat test
const users = await ethers.getSigners();
const claims = users.slice(0, 10).map(user => 
  faucet.connect(user).requestTokens()
);
await Promise.all(claims);
```

## Security Testing

### Access Control
- [ ] Only admin can pause
- [ ] Only faucet can mint
- [ ] Users can only claim for themselves

### Reentrancy
- [ ] ReentrancyGuard prevents attacks
- [ ] State updates before external calls

### Integer Overflow
- [ ] Solidity 0.8.x prevents overflow
- [ ] Large numbers handled correctly

### Input Validation
- [ ] Zero addresses rejected
- [ ] Invalid amounts rejected
- [ ] Paused state checked

## Troubleshooting

### Common Issues

**Contract deployment fails**
- Check Sepolia ETH balance
- Verify RPC URL is correct
- Confirm private key format

**Frontend cannot connect**
- Check contract addresses in .env
- Verify network is Sepolia
- Check MetaMask is unlocked

**Claims fail**
- Ensure not in cooldown
- Check lifetime limit not reached
- Verify wallet has ETH for gas
- Confirm faucet not paused

**Docker health check fails**
- Check port 3000 is available
- Verify .env file exists
- Check container logs

### Debug Mode

Enable verbose logging:

```javascript
// In hardhat.config.js
module.exports = {
  // ...
  networks: {
    hardhat: {
      loggingEnabled: true
    }
  }
};
```

## Continuous Integration

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] Contracts compile without warnings
- [ ] Gas costs acceptable
- [ ] Security checks pass
- [ ] Docker builds successfully
- [ ] Health endpoint responds
- [ ] .env.example updated
- [ ] README.md accurate

### Post-deployment Verification

- [ ] Contracts verified on Etherscan
- [ ] Token minter set correctly
- [ ] Faucet can mint tokens
- [ ] Frontend connects properly
- [ ] Claims work end-to-end
- [ ] Events emitted correctly
- [ ] Cooldown enforced
- [ ] Lifetime limits work