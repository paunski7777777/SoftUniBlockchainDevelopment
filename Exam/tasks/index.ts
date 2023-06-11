import { task } from "hardhat/config";

task("deploy", "print deployer (owner) and contract addresses").setAction(
  async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();

    const TreasuryToken = await hre.ethers.getContractFactory(
      "TreasuryToken",
      deployer
    );
    const treasuryToken = await TreasuryToken.deploy(1000000);
    await treasuryToken.deployed();

    const Treasury = await hre.ethers.getContractFactory("Treasury", deployer);
    const treasury = await Treasury.deploy(treasuryToken.address);
    await treasury.deployed();

    console.log(
      `Treasury Token with owner ${deployer.address} deployed to ${treasuryToken.address}`
    );
    console.log(
      `Treasury with owner ${deployer.address} deployed to ${treasury.address}`
    );
  }
);

task("store-funds", "print stakeholder and amount")
  .addParam("amount", "amount to store")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();

    const TreasuryToken = await hre.ethers.getContractFactory(
      "TreasuryToken",
      deployer
    );
    const treasuryToken = await TreasuryToken.deploy(1000000);
    await treasuryToken.deployed();

    const Treasury = await hre.ethers.getContractFactory("Treasury", deployer);
    const treasury = await Treasury.deploy(treasuryToken.address);
    await treasury.deployed();

    const currentFunds = await treasury.totalFunds();
    await treasury.storeFunds({ value: taskArgs.amount });
    const newFunds = await treasury.totalFunds();

    console.log(
      `Stakeholder ${deployer.address} increased the treasury funds from ${currentFunds} to ${newFunds}`
    );
  });
