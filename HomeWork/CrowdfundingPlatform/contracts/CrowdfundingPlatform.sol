// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";

import "./Campaign.sol";

contract CrowdfundingPlatform {
    using Counters for Counters.Counter;

    Counters.Counter private campaignId;
    Campaign[] public campaigns;

    event CampaignCreated(address indexed campaignAddress);

    function createCampgain(
        string calldata name,
        string calldata symbol,
        string calldata description,
        uint256 fundingGoal,
        uint256 duration,
        uint256 initialSupply
    ) external {
        campaignId.increment();
        uint256 newCampaignId = campaignId.current();

        Campaign campaign = new Campaign(
            newCampaignId,
            name,
            symbol,
            description,
            duration,
            fundingGoal,
            initialSupply,
            msg.sender
        );

        campaigns.push(campaign);

        emit CampaignCreated(address(campaign));
    }

    function getCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }
}
