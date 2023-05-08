// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

contract AuctionPlatform {
    struct Auction {
        uint256 id;
        bool active;
        uint256 startTime;
        uint256 endTime;
        uint256 duration;
        string itemName;
        string itemDescription;
        uint256 itemStartingPrice;
        address creator;
        address highestBidder;
        uint256 highestBid;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => uint256)) availableToWithdrawal;

    event NewAuction(
        uint256 indexed auctionId,
        uint256 startTime,
        uint256 duration,
        string itemName,
        string itemDescription,
        uint256 itemStartingPrice,
        address creator
    );

    event NewHighestBid(
        uint256 indexed auctionId,
        address bidder,
        uint256 amount
    );

    event FinalizeAuction(
        uint256 indexed auctionId,
        address winner,
        uint256 bid
    );

    modifier auctionExist(uint256 auctionId) {
        require(auctions[auctionId].id > 0, "Auction does not exist");
        _;
    }

    modifier onlyActiveAuction(uint256 auctionId) {
        require(auctions[auctionId].active, "Auction is inactive");
        _;
    }

    function createAuction(
        uint256 auctionId,
        uint256 startTime,
        uint256 duration,
        string calldata itemName,
        string calldata itemDescription,
        uint256 itemStartingPrice
    ) external {
        require(auctionId > 0, "Please provide auction ID greater than zero");
        require(
            startTime > block.timestamp,
            "Start time should be greater then the current time"
        );
        require(duration > 0, "Duration should be greater then zero");
        require(
            auctions[auctionId].id != auctionId,
            "Auction with the provided ID is already registered"
        );
        require(bytes(itemName).length > 0, "Please provide an item name");
        require(
            bytes(itemDescription).length > 0,
            "Please provide an item description"
        );

        Auction storage newAuction = auctions[auctionId];

        newAuction.id = auctionId;
        newAuction.startTime = startTime;
        newAuction.duration = duration;
        newAuction.itemName = itemName;
        newAuction.itemDescription = itemDescription;
        newAuction.itemStartingPrice = itemStartingPrice;
        newAuction.active = true;
        newAuction.creator = msg.sender;

        emit NewAuction(
            auctionId,
            startTime,
            duration,
            itemName,
            itemDescription,
            itemStartingPrice,
            msg.sender
        );
    }

    function placeBid(uint256 auctionId)
        external
        payable
        auctionExist(auctionId)
        onlyActiveAuction(auctionId)
    {
        Auction storage auction = auctions[auctionId];

        require(block.timestamp >= auction.startTime, "Auction is not started");
        require(
            msg.value > auction.highestBid,
            "Please provide bid higher then last one"
        );
        require(
            msg.sender != auction.highestBidder,
            "Sender already has the highest bid"
        );

        uint256 previousHighestBid = auction.highestBid;
        address previousHighestBidder = auction.highestBidder;

        if (previousHighestBid > 0) {
            availableToWithdrawal[previousHighestBidder][
                auctionId
            ] += previousHighestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit NewHighestBid(auctionId, msg.sender, msg.value);
    }

    function finalizeAuction(uint256 auctionId)
        external
        auctionExist(auctionId)
        onlyActiveAuction(auctionId)
    {
        Auction storage auction = auctions[auctionId];

        require(
            block.timestamp >= auction.startTime + auction.duration,
            "The auction is still in progress"
        );

        if (auction.highestBid > 0) {
            payable(auction.creator).transfer(auction.highestBid);
        }

        emit FinalizeAuction(
            auctionId,
            auction.highestBidder,
            auction.highestBid
        );

        auction.active = false;
        auction.endTime = block.timestamp;
    }

    function withdraw(uint256 auctionId) external auctionExist(auctionId) {
        uint256 withdrawAmount = availableToWithdrawal[msg.sender][auctionId];

        require(withdrawAmount > 0, "There are no funds to withdraw");

        availableToWithdrawal[msg.sender][auctionId] = 0;

        payable(msg.sender).transfer(withdrawAmount);
    }
}
