import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("./tasks");

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/XZWVcs0IFDgrJhafx3wvhuGmavEYMN-V",
      accounts: [
        "b29db49073973f7aaa85096ee55e0d66739ed2379153ed25ebd1c8271963c68c",
      ],
    },
  },
  etherscan: {
    apiKey: "K7HJZ6RE2CF7CN7D8ADWX2AYCNZU1JYS5H",
  },
};

export default config;
