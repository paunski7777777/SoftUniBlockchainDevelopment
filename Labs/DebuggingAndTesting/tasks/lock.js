const { task } = require("hardhat/config");

task("accounts", "Prints the list of accounts")
  .addParam("acc", "num")
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (let index = 0; index < Number(taskArgs.acc); index++) {
      console.log(accounts[index].address);
    }
  });

task("send", "send ether to account")
  .addParam("acc", "account")
  .setAction(async (taskArgs, hre) => {
    const account = (await hre.ethers.getSigners())[0];

    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(`Balance account: ${hre.ethers.utils.formatEther(balance)}`);

    const tx = await account.sendTransaction({
      to: taskArgs.acc,
      value: hre.ethers.utils.parseEther("10.0"),
    });

    await tx.wait();

    const newBalance = await hre.ethers.provider.getBalance(account.address);
    console.log(`Balance account: ${hre.ethers.utils.formatEther(newBalance)}`);
  });
