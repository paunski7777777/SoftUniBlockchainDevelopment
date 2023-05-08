// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

contract HomeRepairService {
    enum RequestStatus {
        New,
        Accepted,
        Confirmed,
        Verified,
        Paid,
        MoneyReturned
    }

    enum PaymentStatus {
        Pending,
        Processed,
        MoneyReturned
    }

    struct Request {
        uint256 id;
        address requestor;
        string description;
        RequestStatus status;
        uint256 cost;
        uint256 addedOn;
        uint256 verifiersCount;
        mapping(address => bool) verifiers;
        address payable repairer;
    }

    struct Payment {
        uint256 requestId;
        uint256 amount;
        PaymentStatus status;
    }

    address payable public immutable administrator;
    mapping(uint256 => Request) public requests;
    mapping(uint256 => Payment) public payments;

    constructor() {
        administrator = payable(msg.sender);
    }

    modifier administratorOnly() {
        require(msg.sender == administrator, "User should be administrator");
        _;
    }

    modifier requestExistAndStatusIsCorrect(
        uint256 requestId,
        RequestStatus expectedStatus
    ) {
        require(requests[requestId].id > 0, "Request does not exist");
        require(
            requests[requestId].status == expectedStatus,
            "Unexpected request status"
        );
        _;
    }

    modifier paymentForRequestExist(uint256 requestId) {
        require(
            payments[requestId].requestId > 0,
            "Payment for request does not exist"
        );
        _;
    }

    function addRepairRequest(uint256 requestId, string calldata description)
        external
    {
        require(requestId > 0, "Please, provide positive request ID");
        require(bytes(description).length > 0, "Please, provide a description");
        require(
            requests[requestId].id != requestId,
            "Request with the provided ID is already registered"
        );
        require(
            msg.sender != administrator,
            "Administrator cannot add requests"
        );

        Request storage newRequest = requests[requestId];

        newRequest.id = requestId;
        newRequest.description = description;
        newRequest.status = RequestStatus.New;
        newRequest.addedOn = block.timestamp;
        newRequest.requestor = msg.sender;
        newRequest.verifiersCount = 0;
    }

    function acceptRepairRequest(
        uint256 requestId,
        uint256 cost,
        address repairer
    )
        external
        administratorOnly
        requestExistAndStatusIsCorrect(requestId, RequestStatus.New)
    {
        Request storage request = requests[requestId];

        request.status = RequestStatus.Accepted;
        request.cost = cost;
        request.repairer = payable(repairer);
    }

    function addPayment(uint256 requestId)
        external
        payable
        requestExistAndStatusIsCorrect(requestId, RequestStatus.Accepted)
    {
        require(msg.value > 0, "Provided value should be greater than 0");

        Request storage request = requests[requestId];

        require(
            msg.sender == request.requestor,
            "Sender should be same as the requestor"
        );
        require(
            msg.value == request.cost,
            "Provided value should be equal to the requests cost"
        );
        require(
            payments[requestId].requestId <= 0,
            "Payment already provided for the request"
        );

        Payment storage newPayment = payments[requestId];
        newPayment.requestId = requestId;
        newPayment.amount = msg.value;
        newPayment.status = PaymentStatus.Pending;

        payable(administrator).transfer(msg.value);
    }

    function confirmRepairRequest(uint256 requestId)
        external
        administratorOnly
        requestExistAndStatusIsCorrect(requestId, RequestStatus.Accepted)
        paymentForRequestExist(requestId)
    {
        Request storage request = requests[requestId];

        request.status = RequestStatus.Confirmed;
    }

    function verifyJobIsDone(uint256 requestId)
        external
        requestExistAndStatusIsCorrect(requestId, RequestStatus.Confirmed)
    {
        Request storage request = requests[requestId];

        require(
            msg.sender != administrator,
            "Administrator cannot verify request"
        );
        require(
            msg.sender != request.requestor,
            "Requestor cannot verify request"
        );
        require(
            msg.sender != request.repairer,
            "Repairer cannot verify request"
        );
        require(
            !request.verifiers[msg.sender],
            "Auditor has already verified the request"
        );

        request.verifiers[msg.sender] = true;
        request.verifiersCount++;
    }

    function executeRepairRequest(uint256 requestId)
        external
        payable
        administratorOnly
        requestExistAndStatusIsCorrect(requestId, RequestStatus.Confirmed)
        paymentForRequestExist(requestId)
    {
        Request storage request = requests[requestId];

        require(
            request.verifiersCount >= 2,
            "The request repair should be verified by at least two auditors"
        );

        Payment storage payment = payments[requestId];

        require(
            address(administrator).balance >= payment.amount,
            "Insufficient balance to make the payment"
        );
        require(
            msg.value == payment.amount,
            "Send amount should be equal to the payment amount"
        );
        require(
            payment.status == PaymentStatus.Pending,
            "Payment should be pending in order to process it"
        );

        payable(request.repairer).transfer(msg.value);

        request.status = RequestStatus.Paid;
        payment.status = PaymentStatus.Processed;
        request.status = RequestStatus.Verified;
    }

    function moneyBack(uint256 requestId)
        external
        payable
        requestExistAndStatusIsCorrect(requestId, RequestStatus.Confirmed)
        paymentForRequestExist(requestId)
    {
        Request storage request = requests[requestId];

        uint256 dateDifferance = (block.timestamp - request.addedOn) /
            60 /
            60 /
            24;

        require(
            dateDifferance > 31,
            "Request should not be verified more than a month"
        );

        Payment storage payment = payments[requestId];

        require(
            payment.status != PaymentStatus.MoneyReturned,
            "Money already returned to user"
        );
        require(
            msg.value == request.cost,
            "Returned amount should be equal to the requests cost"
        );

        payable(request.requestor).transfer(msg.value);

        request.status = RequestStatus.MoneyReturned;
        payment.status = PaymentStatus.MoneyReturned;
    }
}
