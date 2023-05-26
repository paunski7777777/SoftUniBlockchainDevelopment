import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./EventModal.css";
import { getContract } from "../../helpers";
import { useWallets } from "@web3-onboard/react";

const EventModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [address, setAddress] = useState(null);
  const [amount, setAmount] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const connectedWallets = useWallets();

  useEffect(() => {
    const contract = getContract(connectedWallets);
    if (!contract) {
      return;
    }

    const filter = contract.filters.Transfer(
      connectedWallets[0].accounts[0].address,
      null
    );

    contract.on(filter, (from, _to, amount, event) => {
      setAddress(from);
      setAmount(ethers.utils.formatEther(amount.toString()));
      setTxHash(event.transactionHash);
      setIsVisible(true);
    });

    return () => {
      contract.removeAllListeners();
    };
  }, [connectedWallets]);

  function handleClose() {
    setIsVisible(false);
  }

  if (isVisible) {
    return (
      <div className="event-modal-overlay">
        <div className="event-modal-content">
          <h2>New tokens received!</h2>
          <p>From: {address}</p>
          <p>Amount: {amount} ETH</p>
          <p>Tx Hash: {txHash}</p>
          <button className="event-modal-close" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export default EventModal;
