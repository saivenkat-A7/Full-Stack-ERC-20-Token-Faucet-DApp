const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFaucet", function () {
  let Token, Faucet, token, faucet;
  let owner, user1, user2;

  const CLAIM_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Token
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.waitForDeployment();

    // Deploy Faucet
    Faucet = await ethers.getContractFactory("TokenFaucet");
    faucet = await Faucet.deploy(await token.getAddress());
    await faucet.waitForDeployment();

    // Transfer token ownership to faucet
    await token.transferOwnership(await faucet.getAddress());
  });

  it("should allow a user to claim tokens successfully", async function () {
    await expect(
      faucet.connect(user1).requestTokens()
    ).to.emit(faucet, "TokensClaimed");

    const balance = await token.balanceOf(user1.address);
    expect(balance).to.equal(CLAIM_AMOUNT);
  });

  it("should not allow claiming again before cooldown period", async function () {
    // First claim
    await faucet.connect(user1).requestTokens();

    // Second claim immediately should fail
    await expect(
      faucet.connect(user1).requestTokens()
    ).to.be.revertedWith("Cooldown period not elapsed");
  });
  it("should allow claiming again after cooldown period", async function () {
  // First claim
  await faucet.connect(user1).requestTokens();

  // Fast forward time by 24 hours + 1 second
  await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
  await ethers.provider.send("evm_mine");

  // Second claim should now succeed
  await expect(
    faucet.connect(user1).requestTokens()
  ).to.emit(faucet, "TokensClaimed");

  const balance = await token.balanceOf(user1.address);
  expect(balance).to.equal(CLAIM_AMOUNT * 2n);
});
it("should not allow claiming more than lifetime limit", async function () {
  // Claim 10 times successfully
  for (let i = 0; i < 10; i++) {
    await faucet.connect(user1).requestTokens();

    // Advance time for next claim
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");
  }

  // 11th claim should fail
  await expect(
    faucet.connect(user1).requestTokens()
  ).to.be.revertedWith("Lifetime claim limit reached");
});
it("should prevent users from claiming when faucet is paused", async function () {
  // Owner pauses the faucet
  await faucet.connect(owner).pause();

  // User cannot claim
  await expect(
    faucet.connect(user1).requestTokens()
  ).to.be.revertedWith("Faucet is paused");
});

it("should allow claiming again after unpausing", async function () {
  // Pause then unpause
  await faucet.connect(owner).pause();
  await faucet.connect(owner).unpause();

  // User can claim
  await expect(
    faucet.connect(user1).requestTokens()
  ).to.emit(faucet, "TokensClaimed");
});

it("should not allow non-owner to pause or unpause", async function () {
  await expect(
    faucet.connect(user1).pause()
  ).to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount");

  await expect(
    faucet.connect(user1).unpause()
  ).to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount");
});


});
