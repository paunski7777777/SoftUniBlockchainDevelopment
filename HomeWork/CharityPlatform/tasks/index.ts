import { task } from "hardhat/config";

task("deploy", "print deployer (owner) and contract addresses").setAction(
  async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();

    const CharityPlatform = await hre.ethers.getContractFactory(
      "CharityPlatform",
      deployer
    );
    const charityPlatform = await CharityPlatform.deploy();
    await charityPlatform.deployed();

    console.log(
      `Charity Platform with owner ${deployer.address} deployed to ${charityPlatform.address}`
    );
  }
);

task(
  "create-campaign",
  "print deployer (owner) and contract addresses"
).setAction(async (taskArgs, hre) => {
  const [deployer] = await hre.ethers.getSigners();

  const CharityPlatform = await hre.ethers.getContractFactory(
    "CharityPlatform",
    deployer
  );
  const charityPlatform = await CharityPlatform.deploy();
  await charityPlatform.deployed();

  await charityPlatform.createCampaign("Test1", "test desc", 100, 10000000000);

  const deployedCampaigns = await charityPlatform.campaigns(0);
  const Campaign = await hre.ethers.getContractFactory("CharitableCampaign");
  const campaign = Campaign.attach(deployedCampaigns);

  console.log(
    `Campaign with owner ${deployer.address} deployed to ${campaign.address}`
  );
});
