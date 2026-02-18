// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FaucetToken
 * @dev ERC-20 token with restricted minting capability
 */
contract FaucetToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens
    address public minter;

    event MinterUpdated(address indexed newMinter);

    constructor(address initialMinter) ERC20("Faucet Token", "FAUCET") Ownable(msg.sender) {
        minter = initialMinter;
        emit MinterUpdated(initialMinter);
    }

    /**
     * @dev Modifier to restrict function to minter only
     */
    modifier onlyMinter() {
        require(msg.sender == minter, "Only minter can call this function");
        _;
    }

    /**
     * @dev Mint new tokens to specified address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(to, amount);
    }

    /**
     * @dev Update the minter address (only owner)
     * @param newMinter New minter address
     */
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Invalid minter address");
        minter = newMinter;
        emit MinterUpdated(newMinter);
    }
}
