import { ethers } from "hardhat";

async function main() {
  const TreasuryToken = await ethers.getContractFactory("TreasuryToken");
  const treasuryToken = await TreasuryToken.deploy(1000000);

  await treasuryToken.deployed();

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(treasuryToken.address);

  await treasury.deployed();

  console.log(`Treasury Token deployed to ${treasuryToken.address}`);
  console.log(`Treasury deployed to ${treasury.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
