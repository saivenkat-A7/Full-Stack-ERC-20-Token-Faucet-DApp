// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Token.sol";

contract TokenFaucet is Ownable, ReentrancyGuard {
    Token public immutable token;

    uint256 public constant COOLDOWN_TIME = 24 hours;
    uint256 public constant CLAIM_AMOUNT = 100 * 10 ** 18;
    uint256 public constant MAX_CLAIM_AMOUNT = 1000 * 10 ** 18;

    bool private _paused;

    mapping(address => uint256) public lastClaimAt;
    mapping(address => uint256) public totalClaimed;

    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetPaused(bool paused);

    constructor(address tokenAddress) Ownable(msg.sender) {
        token = Token(tokenAddress);
    }

    function pause() external onlyOwner {
        _paused = true;
        emit FaucetPaused(true);
    }

    function unpause() external onlyOwner {
        _paused = false;
        emit FaucetPaused(false);
    }

    function paused() external view returns (bool) {
        return _paused;
    }

    function isPaused() external view returns (bool) {
        return _paused;
    }

  
    function canClaim(address user) public view returns (bool) {
        if (_paused) return false;
        if (totalClaimed[user] + CLAIM_AMOUNT > MAX_CLAIM_AMOUNT) return false;
        if (block.timestamp < lastClaimAt[user] + COOLDOWN_TIME) return false;
        return true;
    }

    function remainingAllowance(address user) external view returns (uint256) {
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) {
            return 0;
        }
        return MAX_CLAIM_AMOUNT - totalClaimed[user];
    }

    function faucetStatus() external view returns (string memory) {
        if (_paused) {
            return "PAUSED";
        }
        return "ACTIVE";
    }

    function requestTokens() external nonReentrant {
        require(!_paused, "Faucet is paused");
        require(
            block.timestamp >= lastClaimAt[msg.sender] + COOLDOWN_TIME,
            "Cooldown period not elapsed"
        );
        require(
            totalClaimed[msg.sender] + CLAIM_AMOUNT <= MAX_CLAIM_AMOUNT,
            "Lifetime claim limit reached"
        );

        // Effects
        lastClaimAt[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += CLAIM_AMOUNT;

        // Interaction
        token.mint(msg.sender, CLAIM_AMOUNT);

        emit TokensClaimed(msg.sender, CLAIM_AMOUNT, block.timestamp);
    }
}
