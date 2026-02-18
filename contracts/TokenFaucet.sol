// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Token.sol";

/**
 * @title TokenFaucet
 * @dev Faucet contract that distributes tokens with rate limiting
 */
contract TokenFaucet is ReentrancyGuard, Ownable {
    FaucetToken public immutable token;
    
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 tokens per claim
    uint256 public constant COOLDOWN_TIME = 24 hours;
    uint256 public constant MAX_CLAIM_AMOUNT = 1000 * 10**18; // 1000 tokens lifetime limit
    
    bool public paused;
    
    mapping(address => uint256) public lastClaimAt;
    mapping(address => uint256) public totalClaimed;
    
    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetPaused(bool paused);
    
    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        token = FaucetToken(tokenAddress);
        paused = false;
    }
    
    /**
     * @dev Request tokens from the faucet
     */
    function requestTokens() external nonReentrant {
        require(!paused, "Faucet is paused");
        require(canClaim(msg.sender), "Cannot claim tokens at this time");
        require(remainingAllowance(msg.sender) >= FAUCET_AMOUNT, "Lifetime claim limit reached");
        
        lastClaimAt[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += FAUCET_AMOUNT;
        
        token.mint(msg.sender, FAUCET_AMOUNT);
        
        emit TokensClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Check if an address can claim tokens
     * @param user Address to check
     * @return bool True if user can claim
     */
    function canClaim(address user) public view returns (bool) {
        if (paused) return false;
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) return false;
        if (lastClaimAt[user] == 0) return true;
        return block.timestamp >= lastClaimAt[user] + COOLDOWN_TIME;
    }
    
    /**
     * @dev Get remaining claimable amount for an address
     * @param user Address to check
     * @return uint256 Remaining claimable amount
     */
    function remainingAllowance(address user) public view returns (uint256) {
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) return 0;
        return MAX_CLAIM_AMOUNT - totalClaimed[user];
    }
    
    /**
     * @dev Check if faucet is paused
     * @return bool Current pause state
     */
    function isPaused() public view returns (bool) {
        return paused;
    }
    
    /**
     * @dev Pause or unpause the faucet (only owner)
     * @param _paused New pause state
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit FaucetPaused(_paused);
    }
    
    /**
     * @dev Get time until next claim for an address
     * @param user Address to check
     * @return uint256 Seconds until next claim (0 if can claim now)
     */
    function timeUntilNextClaim(address user) public view returns (uint256) {
        if (lastClaimAt[user] == 0) return 0;
        uint256 nextClaimTime = lastClaimAt[user] + COOLDOWN_TIME;
        if (block.timestamp >= nextClaimTime) return 0;
        return nextClaimTime - block.timestamp;
    }
}
