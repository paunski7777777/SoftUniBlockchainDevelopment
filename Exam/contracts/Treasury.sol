// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./TreasuryToken.sol";

contract Treasury {
    using Counters for Counters.Counter;

    enum VoteOption {
        Yes,
        No
    }

    struct Vote {
        address voter;
        uint256 tokenAmount;
        VoteOption choice;
    }

    struct WithdrawRequest {
        uint256 id;
        uint256 amount;
        string description;
        uint256 votingDuration;
        uint256 votingEndDate;
        mapping(address => Vote) votes;
        mapping(address => bool) voters;
        uint256 votedYesTokens;
        uint256 votedNoTokens;
        uint256 votesCount;
        mapping(address => uint256) lockedTokens;
        bool completed;
    }

    error InvalidVoteChoice();
    error WithdrawNotPermitted();

    Counters.Counter private _withdrawId;

    TreasuryToken public token;
    address public owner;
    uint256 public totalFunds;
    mapping(address => uint256) public stakeholders;
    mapping(uint256 => WithdrawRequest) public withdrawRequests;

    event FundsStored(address indexed stakeholder, uint256 amount);
    event WithdrawInitiated(uint256 withdrawId, uint256 amount);
    event Voted(
        address indexed voter,
        uint256 withdrawId,
        VoteOption voteOption,
        uint256 amount
    );
    event WithdrawCompleted(uint256 withdrawId, uint256 amount);

    constructor(address tokenAddress) {
        owner = msg.sender;
        token = TreasuryToken(tokenAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyStakeholder() {
        require(stakeholders[msg.sender] > 0, "Not stakeholder");
        _;
    }

    modifier onlyExistingWithdrawRequest(uint256 id) {
        require(withdrawRequests[id].id > 0, "Withdraw request does not exist");
        _;
    }

    function storeFunds() external payable {
        require(msg.value > 0, "No value");

        totalFunds += msg.value;
        stakeholders[msg.sender] += msg.value;

        token.mint(msg.sender, msg.value);

        emit FundsStored(msg.sender, msg.value);
    }

    function initiateWithdrawal(
        uint256 amount,
        string calldata description,
        uint256 votingDuration
    ) external onlyOwner {
        require(amount > 0, "No amount");
        require(totalFunds > 0, "No funds to withdraw");
        require(amount <= totalFunds, "Amount <= total funds");
        require(bytes(description).length > 0, "Description required");
        require(votingDuration > 0, "No voting duration");

        totalFunds -= amount;

        _withdrawId.increment();
        uint256 newWithdrawId = _withdrawId.current();

        WithdrawRequest storage withdrawRequest = withdrawRequests[
            newWithdrawId
        ];

        withdrawRequest.id = newWithdrawId;
        withdrawRequest.amount = amount;
        withdrawRequest.description = description;
        withdrawRequest.votingDuration = votingDuration;
        withdrawRequest.votingEndDate = block.timestamp + votingDuration;

        emit WithdrawInitiated(newWithdrawId, amount);
    }

    function vote(
        uint256 withdrawId,
        VoteOption voteChoice,
        uint256 amount
    ) external onlyStakeholder onlyExistingWithdrawRequest(withdrawId) {
        WithdrawRequest storage request = withdrawRequests[withdrawId];

        require(
            voteChoice == VoteOption.Yes || voteChoice == VoteOption.No,
            "Invalid vote option"
        );
        require(amount > 0, "Tokens required");
        require(request.votingEndDate >= block.timestamp, "Voting ended");
        require(!request.voters[msg.sender], "User already voted");

        request.voters[msg.sender] = true;
        request.votesCount++;
        request.votes[msg.sender] = Vote({
            voter: msg.sender,
            tokenAmount: amount,
            choice: voteChoice
        });
        request.lockedTokens[msg.sender] = amount;

        if (voteChoice == VoteOption.Yes) {
            request.votedYesTokens += amount;
        } else if (voteChoice == VoteOption.No) {
            request.votedNoTokens += amount;
        } else {
            revert InvalidVoteChoice();
        }

        token.transfer(msg.sender, address(this), amount);

        emit Voted(msg.sender, withdrawId, voteChoice, amount);
    }

    function executeWithdrawal(
        uint256 withdrawId,
        uint256 amount,
        address wallet
    ) external onlyOwner onlyExistingWithdrawRequest(withdrawId) {
        require(amount > 0, "No amount");
        require(wallet != address(0), "Invalid address");

        WithdrawRequest storage request = withdrawRequests[withdrawId];

        require(!request.completed, "Withdraw already completed");
        require(request.amount == amount, "Amount = request amount");
        require(request.votingEndDate <= block.timestamp, "Voting not ended");

        if (
            request.votedYesTokens > request.votedNoTokens ||
            request.votesCount == 0
        ) {
            request.completed = true;

            (bool success, ) = payable(wallet).call{value: amount}("");

            require(success, "Withdraw failed");

            emit WithdrawCompleted(withdrawId, amount);
        } else {
            revert WithdrawNotPermitted();
        }
    }

    function unlockTokens(
        uint256 withdrawId,
        address wallet
    ) external onlyStakeholder onlyExistingWithdrawRequest(withdrawId) {
        WithdrawRequest storage request = withdrawRequests[withdrawId];

        require(request.votingEndDate <= block.timestamp, "Voting not ended");
        require(request.lockedTokens[msg.sender] > 0, "No tokens to unlock");

        uint256 lockedAmount = request.lockedTokens[msg.sender];
        request.lockedTokens[msg.sender] = 0;

        token.transfer(address(this), wallet, lockedAmount);
    }
}
