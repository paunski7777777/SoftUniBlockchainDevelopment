import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Treasury", () => {
  const tokenInitialSupply: number = 1000000;

  let deployer: any, account1: any, account2: any, account3: any;

  before(async () => {
    [deployer, account1, account2, account3] = await ethers.getSigners();
  });

  const deployAndCreateWithFundsFixture = async () => {
    const TreasuryToken = await ethers.getContractFactory("TreasuryToken");
    const treasuryToken = await TreasuryToken.deploy(tokenInitialSupply);

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(treasuryToken.address);
    const treasuryOwner = treasury.connect(deployer);

    await treasuryOwner.storeFunds({ value: 100 });

    return { treasuryToken, treasury, treasuryOwner };
  };

  const deployAndCreateWithoutFundsFixture = async () => {
    const TreasuryToken = await ethers.getContractFactory("TreasuryToken");
    const treasuryToken = await TreasuryToken.deploy(tokenInitialSupply);

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(treasuryToken.address);
    const treasuryOwner = treasury.connect(deployer);

    return { treasuryToken, treasury, treasuryOwner };
  };

  const deployAndCreateWithWithdrawRequestFixture = async () => {
    const TreasuryToken = await ethers.getContractFactory("TreasuryToken");
    const treasuryToken = await TreasuryToken.deploy(tokenInitialSupply);

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(treasuryToken.address);
    const treasuryOwner = treasury.connect(deployer);

    await treasuryOwner.storeFunds({ value: 1000 });

    const account1Treasury = treasury.connect(account1);
    const account2Treasury = treasury.connect(account2);

    await account1Treasury.storeFunds({ value: 500 });
    await account2Treasury.storeFunds({ value: 500 });

    await treasuryOwner.initiateWithdrawal(700, "test", 500);

    return { treasury, account1Treasury, account2Treasury, treasuryToken };
  };

  describe("Initiate Withdrawal", () => {
    it("Reverts if not owner", async () => {
      const { treasury } = await loadFixture(
        deployAndCreateWithoutFundsFixture
      );

      const account1Treasury = treasury.connect(account1);

      await expect(
        account1Treasury.initiateWithdrawal(10, "test", 500)
      ).to.be.revertedWith("Not owner");
    });

    it("Reverts if no amount", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      await expect(
        treasuryOwner.initiateWithdrawal(0, "test", 500)
      ).to.be.revertedWith("No amount");
    });

    it("Reverts if amount > total funds", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      await expect(
        treasuryOwner.initiateWithdrawal(10000, "test", 500)
      ).to.be.revertedWith("Amount <= total funds");
    });

    it("Reverts if no description", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      await expect(
        treasuryOwner.initiateWithdrawal(10, "", 500)
      ).to.be.revertedWith("Description required");
    });

    it("Reverts if no duration", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      await expect(
        treasuryOwner.initiateWithdrawal(10, "test", 0)
      ).to.be.revertedWith("No voting duration");
    });

    it("Reverts if no funds", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithoutFundsFixture
      );

      await expect(
        treasuryOwner.initiateWithdrawal(10, "test", 500)
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Initiate Withdrawal emits event", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      const withdrawAmount = 10;

      await expect(
        await treasuryOwner.initiateWithdrawal(withdrawAmount, "test", 500)
      )
        .to.emit(treasuryOwner, "WithdrawInitiated")
        .withArgs(1, withdrawAmount);
    });

    it("Total funds calculations", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      const withdrawAmount = 10;

      const currentTotalFunds = ethers.utils.formatEther(
        await treasuryOwner.totalFunds()
      );

      await treasuryOwner.initiateWithdrawal(withdrawAmount, "test", 500);

      const newTotalFunds = ethers.utils.formatEther(
        await treasuryOwner.totalFunds()
      );

      expect(currentTotalFunds).to.not.be.equal(newTotalFunds);
    });

    it("Request exist", async () => {
      const { treasuryOwner } = await loadFixture(
        deployAndCreateWithFundsFixture
      );

      await treasuryOwner.initiateWithdrawal(10, "test", 500);

      const request = await treasuryOwner.withdrawRequests(1);

      expect(request.id).to.be.equal(1);
    });
  });

  describe("Voting", () => {
    it("Reverts if user not stakeholder", async () => {
      const { treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      const account3Treasury = treasury.connect(account3);

      await expect(account3Treasury.vote(1, 1, 100)).to.be.revertedWith(
        "Not stakeholder"
      );
    });

    it("Reverts if non-existing withdraw request", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      await expect(account1Treasury.vote(777, 1, 100)).to.be.revertedWith(
        "Withdraw request does not exist"
      );
    });

    it("Reverts if invalid vote option", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      await expect(account1Treasury.vote(1, 10, 100)).to.be.revertedWith;
    });

    it("Reverts if no tokens", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      await expect(account1Treasury.vote(1, 0, 0)).to.be.revertedWith(
        "Tokens required"
      );
    });

    it("Reverts if voting ended", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      const request = await account1Treasury.withdrawRequests(1);

      await time.increaseTo(request.votingEndDate);

      await expect(account1Treasury.vote(1, 0, 100)).to.be.revertedWith(
        "Voting ended"
      );
    });

    it("Reverts if user already voted", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      await account1Treasury.vote(1, 0, 10);

      await expect(account1Treasury.vote(1, 0, 100)).to.be.revertedWith(
        "User already voted"
      );
    });

    it("Vote emits event", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      const withdrawId = 1;
      const voteOption = 0;
      const tokens = 100;

      await expect(await account1Treasury.vote(withdrawId, voteOption, tokens))
        .to.emit(account1Treasury, "Voted")
        .withArgs(account1.address, withdrawId, voteOption, tokens);
    });

    it("Votes calculations", async () => {
      const { account1Treasury } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      const withdrawId = 1;
      const voteOption = 0;
      const tokens = 100;

      const request = await account1Treasury.withdrawRequests(1);

      const currentVotesCount = request.votesCount;

      await account1Treasury.vote(withdrawId, voteOption, tokens);

      const updatedRequest = await account1Treasury.withdrawRequests(1);
      const newVotesCount = updatedRequest.votesCount;

      const votedYesTokens = updatedRequest.votedYesTokens;
      const votedNoTokens = updatedRequest.votedNoTokens;

      expect(currentVotesCount).to.not.be.equal(newVotesCount);
      expect(votedYesTokens).to.be.equal(tokens);
      expect(votedNoTokens).to.be.equal(0);
    });

    it("Tokens balance after vote", async () => {
      const { account1Treasury, treasuryToken } = await loadFixture(
        deployAndCreateWithWithdrawRequestFixture
      );

      const withdrawId = 1;
      const voteOption = 0;
      const tokens = 100;

      const currentBalance = await treasuryToken.balanceOf(
        account1Treasury.address
      );
      await account1Treasury.vote(withdrawId, voteOption, tokens);

      const newBalance = await treasuryToken.balanceOf(
        account1Treasury.address
      );

      expect(currentBalance).not.to.equal(newBalance);
    });
  });
});
