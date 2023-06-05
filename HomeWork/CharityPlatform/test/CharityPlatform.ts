import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CharityPlatform", () => {
  const campaignName: string = "Test Campaign 1";
  const campaignDescription: string = "Test Campaign 1 Description";
  const campaignFundingGoal = ethers.utils.parseEther("10");
  const campaignDeadlineEnded: number = 1685993092;
  const campaignDeadlineActive: number = 1687993792;

  let deployer: any, account1: any, account2: any;

  before(async () => {
    [deployer, account1, account2] = await ethers.getSigners();
  });

  const deployAndCreateFixture = async (deadline: number) => {
    const CharityPlatform = await ethers.getContractFactory("CharityPlatform");
    const charityPlatform = await CharityPlatform.deploy();
    const charityPlatformOwner = charityPlatform.connect(deployer);

    const campaignTx = await charityPlatformOwner.createCampaign(
      campaignName,
      campaignDescription,
      campaignFundingGoal,
      deadline
    );
    await campaignTx.wait();

    return { charityPlatform };
  };

  const deployCreateAndGetFixture = async () => {
    const CharityPlatform = await ethers.getContractFactory(
      "CharityPlatform",
      deployer
    );
    const charityPlatform = await CharityPlatform.deploy();
    const charityPlatformOwner = charityPlatform.connect(deployer);

    const campaignTx = await charityPlatformOwner.createCampaign(
      campaignName,
      campaignDescription,
      campaignFundingGoal,
      campaignDeadlineActive
    );
    await campaignTx.wait();

    const campaignAddress = await charityPlatform.campaigns(0);
    if (campaignAddress === undefined) {
      throw Error("No campaign address");
    }
    const Campaign = await ethers.getContractFactory("CharitableCampaign");
    const campaign = Campaign.attach(campaignAddress);

    return { charityPlatform, campaign, charityPlatformOwner };
  };

  const endedFixture = () => deployAndCreateFixture(campaignDeadlineEnded);
  const activeFixture = () => deployAndCreateFixture(campaignDeadlineActive);

  describe("Donation", () => {
    it("Reverts if non-existing campaign", async () => {
      const { charityPlatform } = await loadFixture(endedFixture);

      await expect(
        charityPlatform.donate(4387, { value: 1 })
      ).to.be.revertedWith("Campaign not found");
    });

    it("Reverts if value < 0", async () => {
      const { charityPlatform } = await loadFixture(endedFixture);

      await expect(charityPlatform.donate(0, { value: 0 })).to.be.revertedWith(
        "Value required"
      );
    });

    it("Reverts if campaign ended", async () => {
      const { charityPlatform } = await loadFixture(endedFixture);

      await expect(charityPlatform.donate(0, { value: 10 })).to.be.revertedWith(
        "Campaign ended"
      );
    });

    it("Reverts if exceeding funding goal", async () => {
      const { charityPlatform } = await loadFixture(activeFixture);

      await expect(
        charityPlatform.donate(0, { value: ethers.utils.parseEther("11") })
      ).to.be.revertedWith("Exceeding funding goal");
    });

    it("Reverts if funding completed", async () => {
      const { charityPlatform } = await loadFixture(activeFixture);

      await charityPlatform.donate(0, { value: ethers.utils.parseEther("10") });

      await expect(
        charityPlatform.donate(0, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("Funding completed");
    });

    it("Reverts if funding completed", async () => {
      const { charityPlatform } = await loadFixture(activeFixture);

      await charityPlatform.donate(0, { value: ethers.utils.parseEther("10") });

      await expect(
        charityPlatform.donate(0, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("Funding completed");
    });

    it("Total funds raised", async () => {
      const { charityPlatform, campaign } = await loadFixture(
        deployCreateAndGetFixture
      );

      const price = 10;

      await charityPlatform.donate(0, { value: price });
      const totalFundsRaised = await campaign.totalFundsRaised();

      expect(totalFundsRaised).to.equal(price);
    });

    it("Campaign finished", async () => {
      const { charityPlatform, campaign } = await loadFixture(
        deployCreateAndGetFixture
      );

      await charityPlatform.donate(0, { value: ethers.utils.parseEther("10") });
      const isFinished = await campaign.isFinished();

      expect(isFinished).to.equal(true);
    });

    it("User donations increased", async () => {
      const { charityPlatform, campaign } = await loadFixture(
        deployCreateAndGetFixture
      );

      const price = 10;

      await charityPlatform.donate(0, { value: price });
      const donation = await campaign.donations(charityPlatform.address);

      expect(donation).to.equal(price);
    });

    it("User received NFT", async () => {
      const { charityPlatform, campaign } = await loadFixture(
        deployCreateAndGetFixture
      );

      const price = 10;

      await charityPlatform.donate(0, { value: price });
      const isSent = await campaign.nftSent(charityPlatform.address);

      expect(isSent).to.equal(true);
    });

    it("Donate emits Event", async () => {
      const { campaign } = await loadFixture(deployCreateAndGetFixture);

      const donation: number = 10;
      await expect(await campaign.donate({ value: donation }))
        .to.emit(campaign, "UserDonated")
        .withArgs(deployer.address, donation);
    });
  });

  describe("Fund release", () => {
    it("Reverts if sender is not owner", async () => {
      const { charityPlatform } = await loadFixture(deployCreateAndGetFixture);

      const account1Platform = charityPlatform.connect(account1);

      await expect(
        account1Platform.collectFunds(0, deployer.address)
      ).to.be.revertedWith("Sender not owner");
    });

    it("Reverts if campaign not finished", async () => {
      const { charityPlatformOwner } = await loadFixture(
        deployCreateAndGetFixture
      );

      await expect(
        charityPlatformOwner.collectFunds(0, deployer.address)
      ).to.be.revertedWith("Campaign not finished");
    });

    it("Funds collected and totalFundsRaised is 0", async () => {
      const { charityPlatform, campaign } = await loadFixture(
        deployCreateAndGetFixture
      );

      await charityPlatform.donate(0, { value: ethers.utils.parseEther("10") });
      await charityPlatform.collectFunds(0, deployer.address);

      const totalFundsRaised = await campaign.totalFundsRaised();
      expect(totalFundsRaised).to.equal(0);
    });

    it("Funds collected and sent to address", async () => {
      const { charityPlatform } = await loadFixture(deployCreateAndGetFixture);

      const deployerBalance = await ethers.provider.getBalance(
        deployer.address
      );
      await charityPlatform.donate(0, { value: ethers.utils.parseEther("10") });
      await charityPlatform.collectFunds(0, deployer.address);

      const deployerNewBalance = await ethers.provider.getBalance(
        deployer.address
      );

      expect(
        parseFloat(ethers.utils.formatEther(deployerBalance))
      ).to.be.closeTo(
        parseFloat(ethers.utils.formatEther(deployerNewBalance)),
        0.001
      );
    });
  });
});
