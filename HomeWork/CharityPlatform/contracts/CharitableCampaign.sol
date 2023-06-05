// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CharitableCampaign is ERC721, Ownable {
    uint256 public id;
    string public description;
    uint256 public fundingGoal;
    uint256 public deadline;
    uint256 public totalFundsRaised;
    mapping(address => uint256) public donations;
    bool public isFinished;
    uint256 public refunds;
    mapping(address => bool) public nftSent;
    uint256 private fundsToCollect;

    event UserDonated(address indexed user, uint256 amount);
    event UserRefunded(address indexed user, uint256 amount);

    constructor(
        uint256 _id,
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _deadline,
        address _creator
    ) ERC721(_name, "") {
        require(bytes(_name).length > 0, "Name required");
        require(_fundingGoal > 0, "Funding goal required");
        require(_deadline > 0, "Deadline required");
        require(block.timestamp > deadline, "Deadline > now");

        id = _id;
        description = _description;
        fundingGoal = _fundingGoal;
        deadline = _deadline;

        transferOwnership(_creator);
    }

    modifier onlyActive() {
        require(block.timestamp < deadline, "Campaign ended");
        _;
    }

    function donate() public payable onlyActive {
        require(totalFundsRaised < fundingGoal, "Funding completed");
        require(
            msg.value + totalFundsRaised <= fundingGoal,
            "Exceeding funding goal"
        );

        donations[msg.sender] += msg.value;
        totalFundsRaised += msg.value;

        if (!nftSent[msg.sender]) {
            nftSent[msg.sender] = true;
            _mint(msg.sender, id);
        }

        if (totalFundsRaised == fundingGoal) {
            isFinished = true;
        }

        emit UserDonated(msg.sender, msg.value);
    }

    function collectFunds(address sender, address wallet) public payable {
        require(sender == owner(), "Sender not owner");
        require(
            isFinished || block.timestamp >= deadline,
            "Campaign not finished"
        );

        fundsToCollect = totalFundsRaised;
        totalFundsRaised = 0;

        (bool success, ) = payable(wallet).call{value: fundsToCollect}("");

        require(success, "Funds collection failed");
    }

    function refund() public payable {
        require(!isFinished, "Campaign not finished");
        require(donations[msg.sender] > 0, "User not donated");
        require(totalFundsRaised < fundingGoal, "Funding goal reached");
        require(block.timestamp >= deadline, "Campaign not finished");

        uint256 donatedAmount = donations[msg.sender];
        donations[msg.sender] = 0;
        totalFundsRaised -= donatedAmount;
        refunds += donatedAmount;

        emit UserRefunded(msg.sender, donatedAmount);

        (bool success, ) = payable(msg.sender).call{value: donatedAmount}("");

        require(success, "Refund failed");
    }
}
