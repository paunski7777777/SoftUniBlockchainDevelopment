import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTMarketPlace } from "../typechain-types";

describe("NFTMarketPlace", () => {
  let marketPlaceFirstUser: NFTMarketPlace,
    deployer: any,
    firstUser: any,
    secondUser: any;

  before(async () => {
    [deployer, firstUser, secondUser] = await ethers.getSigners();
    const { nftMarketPlace } = await loadFixture(deployAndMintFixture);
    marketPlaceFirstUser = getUser(nftMarketPlace, firstUser);
  });

  const deployAndMintFixture = async () => {
    const NFTMarketPlaceFactory = await ethers.getContractFactory(
      "NFTMarketPlace",
      deployer
    );
    const nftMarketPlace = await NFTMarketPlaceFactory.deploy();
    const nftMarketPlaceFirstUser = nftMarketPlace.connect(firstUser);

    const tx = await nftMarketPlaceFirstUser.createNFT("test url");

    return { nftMarketPlace, deployer, firstUser };
  };

  const listFixture = async () => {
    const { nftMarketPlace } = await loadFixture(deployAndMintFixture);
    const price = ethers.utils.parseEther("1");
    await marketPlaceFirstUser.approve(nftMarketPlace.address, 0);
    await marketPlaceFirstUser.listNFTForSale(nftMarketPlace.address, 0, price);

    return { nftMarketPlace };
  };

  describe("Listing", () => {
    it("Reverts if price == 0", async () => {
      const { nftMarketPlace } = await loadFixture(deployAndMintFixture);

      await expect(
        nftMarketPlace.listNFTForSale(nftMarketPlace.address, 0, 0)
      ).to.be.revertedWith("Price must be != 0");
    });

    it("Reverts when already listed", async () => {
      const { nftMarketPlace } = await loadFixture(deployAndMintFixture);

      const price = ethers.utils.parseEther("1");

      await marketPlaceFirstUser.approve(nftMarketPlace.address, 0);
      await marketPlaceFirstUser.listNFTForSale(
        nftMarketPlace.address,
        0,
        price
      );

      await expect(
        marketPlaceFirstUser.listNFTForSale(nftMarketPlace.address, 0, price)
      ).to.be.revertedWith("Already listed");
    });

    it("Should succeed NFT for sale", async () => {
      const { nftMarketPlace } = await loadFixture(deployAndMintFixture);

      const price = ethers.utils.parseEther("1");

      await marketPlaceFirstUser.approve(nftMarketPlace.address, 0);

      await expect(
        marketPlaceFirstUser.listNFTForSale(nftMarketPlace.address, 0, price)
      )
        .to.emit(nftMarketPlace, "NFTListed")
        .withArgs(nftMarketPlace.address, 0, price);
    });
  });

  describe("Purchasing", () => {
    it("Reverts if not listed", async () => {
      const { nftMarketPlace } = await loadFixture(deployAndMintFixture);

      await expect(
        nftMarketPlace.purchaseNFT(
          nftMarketPlace.address,
          0,
          secondUser.address
        )
      ).to.be.revertedWith("Not listed");
    });

    it("Reverts if incorrect price", async () => {
      const { nftMarketPlace } = await loadFixture(listFixture);

      const wrongPrice = ethers.utils.parseEther("0.1");

      await expect(
        nftMarketPlace.purchaseNFT(
          nftMarketPlace.address,
          0,
          secondUser.address,
          { value: wrongPrice }
        )
      ).to.be.revertedWith("Incorrect price");
    });

    it("Deletes nft", async () => {
      const { nftMarketPlace } = await loadFixture(listFixture);

      const price = ethers.utils.parseEther("1");

      await nftMarketPlace.purchaseNFT(
        nftMarketPlace.address,
        0,
        secondUser.address,
        { value: price }
      );

      expect(
        (await nftMarketPlace.nftSales(nftMarketPlace.address, 0)).price
      ).to.equal(0);
      expect(await nftMarketPlace.ownerOf(0)).to.equal(secondUser.address);
    });
  });
});

const getUser = (marketPlace: NFTMarketPlace, user: any) => {
  return marketPlace.connect(user);
};
