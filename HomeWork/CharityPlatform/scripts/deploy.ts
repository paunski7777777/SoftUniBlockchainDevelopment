import { ethers } from "hardhat";

const main = async () => {
  const CharityPlatform = await ethers.getContractFactory("CharityPlatform");
  const charityPlatform = await CharityPlatform.deploy();

  await charityPlatform.deployed();

  console.log(`Charity Platform  deployed to ${charityPlatform.address}`);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
