const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenFaucet", function () {
  let token, faucet, owner, user1, user2;
  const FAUCET_AMOUNT = ethers.parseEther("100");
  const MAX_CLAIM_AMOUNT = ethers.parseEther("1000");
  const COOLDOWN_TIME = 24 * 60 * 60; // 24 hours

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Token
    const Token = await ethers.getContractFactory("FaucetToken");
    // Deploy with zero address first, then update
    token = await Token.deploy(ethers.ZeroAddress);
    await token.waitForDeployment();

    // Deploy Faucet
    const Faucet = await ethers.getContractFactory("TokenFaucet");
    faucet = await Faucet.deploy(await token.getAddress());
    await faucet.waitForDeployment();

    // Set faucet as minter
    await token.setMinter(await faucet.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await faucet.token()).to.equal(await token.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await faucet.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await faucet.isPaused()).to.equal(false);
    });

    it("Should set faucet as minter", async function () {
      expect(await token.minter()).to.equal(await faucet.getAddress());
    });
  });

  describe("Token Claims", function () {
    it("Should allow first-time claim", async function () {
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed")
        .withArgs(user1.address, FAUCET_AMOUNT, await time.latest() + 1);

      expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
      expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT);
    });

    it("Should update lastClaimAt after claim", async function () {
      const tx = await faucet.connect(user1).requestTokens();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      expect(await faucet.lastClaimAt(user1.address)).to.equal(block.timestamp);
    });

    it("Should revert on immediate re-claim (cooldown)", async function () {
      await faucet.connect(user1).requestTokens();
      
      await expect(faucet.connect(user1).requestTokens())
        .to.be.reverted;
    });

    it("Should allow claim after cooldown period", async function () {
      await faucet.connect(user1).requestTokens();
      
      // Fast forward 24 hours
      await time.increase(COOLDOWN_TIME);
      
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed");
      
      expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT * 2n);
    });

    it("Should enforce lifetime claim limit", async function () {
      // Claim maximum times (10 claims of 100 tokens each)
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        if (i < 9) {
          await time.increase(COOLDOWN_TIME);
        }
      }
      
      expect(await faucet.totalClaimed(user1.address)).to.equal(MAX_CLAIM_AMOUNT);
      
      // Try to claim again
      await time.increase(COOLDOWN_TIME);
      await expect(faucet.connect(user1).requestTokens())
        .to.be.reverted;
    });

    it("Should allow multiple users to claim independently", async function () {
      await faucet.connect(user1).requestTokens();
      await faucet.connect(user2).requestTokens();
      
      expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
      expect(await token.balanceOf(user2.address)).to.equal(FAUCET_AMOUNT);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      await expect(faucet.setPaused(true))
        .to.emit(faucet, "FaucetPaused")
        .withArgs(true);
      
      expect(await faucet.isPaused()).to.equal(true);
    });

    it("Should prevent claims when paused", async function () {
      await faucet.setPaused(true);
      
      await expect(faucet.connect(user1).requestTokens())
        .to.be.revertedWith("Faucet is paused");
    });

    it("Should allow claims after unpause", async function () {
      await faucet.setPaused(true);
      await faucet.setPaused(false);
      
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed");
    });

    it("Should only allow owner to pause", async function () {
      await expect(faucet.connect(user1).setPaused(true))
        .to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("canClaim should return true for eligible user", async function () {
      expect(await faucet.canClaim(user1.address)).to.equal(true);
    });

    it("canClaim should return false during cooldown", async function () {
      await faucet.connect(user1).requestTokens();
      expect(await faucet.canClaim(user1.address)).to.equal(false);
    });

    it("canClaim should return false when paused", async function () {
      await faucet.setPaused(true);
      expect(await faucet.canClaim(user1.address)).to.equal(false);
    });

    it("canClaim should return false at lifetime limit", async function () {
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        if (i < 9) await time.increase(COOLDOWN_TIME);
      }
      
      await time.increase(COOLDOWN_TIME);
      expect(await faucet.canClaim(user1.address)).to.equal(false);
    });

    it("remainingAllowance should return correct amount", async function () {
      expect(await faucet.remainingAllowance(user1.address)).to.equal(MAX_CLAIM_AMOUNT);
      
      await faucet.connect(user1).requestTokens();
      expect(await faucet.remainingAllowance(user1.address)).to.equal(MAX_CLAIM_AMOUNT - FAUCET_AMOUNT);
    });

    it("remainingAllowance should return 0 at limit", async function () {
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        if (i < 9) await time.increase(COOLDOWN_TIME);
      }
      
      expect(await faucet.remainingAllowance(user1.address)).to.equal(0);
    });

    it("timeUntilNextClaim should return 0 for new user", async function () {
      expect(await faucet.timeUntilNextClaim(user1.address)).to.equal(0);
    });

    it("timeUntilNextClaim should return correct time", async function () {
      await faucet.connect(user1).requestTokens();
      const timeLeft = await faucet.timeUntilNextClaim(user1.address);
      
      expect(timeLeft).to.be.closeTo(COOLDOWN_TIME, 5);
    });
  });

  describe("Token Contract", function () {
    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("Faucet Token");
      expect(await token.symbol()).to.equal("FAUCET");
    });

    it("Should have correct max supply", async function () {
      expect(await token.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000"));
    });

    it("Should only allow minter to mint", async function () {
      await expect(token.connect(user1).mint(user1.address, FAUCET_AMOUNT))
        .to.be.revertedWith("Only minter can call this function");
    });

    it("Should not exceed max supply", async function () {
      // Try to mint more than max supply
      const maxSupply = await token.MAX_SUPPLY();
      await expect(faucet.mint(user1.address, maxSupply + 1n))
        .to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero balance queries", async function () {
      expect(await token.balanceOf(user1.address)).to.equal(0);
    });

    it("Should emit Transfer events", async function () {
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, FAUCET_AMOUNT);
    });

    it("Should handle partial cooldown period", async function () {
      await faucet.connect(user1).requestTokens();
      await time.increase(COOLDOWN_TIME / 2);
      
      await expect(faucet.connect(user1).requestTokens())
        .to.be.reverted;
    });
  });
});