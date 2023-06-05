// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";

import "./CharitableCampaign.sol";

contract CharityPlatform {
    using Counters for Counters.Counter;

    Counters.Counter private campaignId;
    mapping(uint256 => CharitableCampaign) public campaigns;

    event CampaignCreated(
        address indexed campaignAddress,
        uint256 indexed campaignId
    );

    function createCampaign(
        string calldata name,
        string calldata description,
        uint256 fundingGoal,
        uint256 deadline
    ) external {
        uint256 newCampaignId = campaignId.current();
        campaignId.increment();

        CharitableCampaign campaign = new CharitableCampaign(
            newCampaignId,
            name,
            description,
            fundingGoal,
            deadline,
            msg.sender
        );

        campaigns[newCampaignId] = campaign;
        emit CampaignCreated(address(campaign), newCampaignId);
    }

    modifier existingCampaign(uint256 id) {
        require(address(campaigns[id]) != address(0), "Campaign not found");
        _;
    }

    function donate(uint256 id) external payable existingCampaign(id) {
        require(msg.value > 0, "Value required");

        CharitableCampaign campaign = CharitableCampaign(campaigns[id]);

        campaign.donate{value: msg.value}();
    }

    function collectFunds(
        uint256 id,
        address wallet
    ) external existingCampaign(id) {
        CharitableCampaign campaign = CharitableCampaign(campaigns[id]);

        campaign.collectFunds(msg.sender, wallet);
    }

    function refund(uint256 id) external existingCampaign(id) {
        CharitableCampaign campaign = CharitableCampaign(campaigns[id]);

        campaign.refund();
    }
}
