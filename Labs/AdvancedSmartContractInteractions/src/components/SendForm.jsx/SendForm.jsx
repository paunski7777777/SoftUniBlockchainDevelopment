import React, { useEffect, useState } from "react";
import "./SendForm.css";
import { useWallets } from "@web3-onboard/react";

import { ethers } from "ethers";
import { getContract } from "../../helpers";

const SendForm = () => {
  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedGasCost, setEstimatedGasCost] = useState("0");

  const connectedWallets = useWallets();

  const handleSendToChange = (e) => {
    setSendTo(e.target.value);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleSend = async (e) => {
    setMessage("");
    setIsLoading(true);
    e.preventDefault();

    const contract = getContract(connectedWallets);
    if (!contract) {
      return;
    }

    try {
      const result = await contract.transfer(
        sendTo,
        ethers.utils.parseEther(amount)
      );
      await result.wait();

      showMessage("Success");

      setSendTo("");
      setAmount(0);
    } catch (error) {
      console.log(error);
      showMessage(error.message);
    }

    setIsLoading(false);
  };

  const showMessage = (text) => {
    setMessage(text);
  };

  useEffect(() => {
    (async () => {
      if (
        connectedWallets &&
        connectedWallets.length > 0 &&
        connectedWallets[0] &&
        connectedWallets[0].accounts &&
        connectedWallets[0].accounts.length > 0
      ) {
        const contract = getContract(connectedWallets);
        if (!contract) {
          return;
        }

        const contractBalance = ethers.utils.formatEther(
          await contract.balanceOf(connectedWallets[0].accounts[0].address)
        );
        setBalance(contractBalance);
      }
    })();
  }, [connectedWallets]);

  useEffect(() => {
    if (connectedWallets && amount && sendTo) {
      (async () => {
        const contract = getContract(connectedWallets);
        if (!contract) {
          return;
        }

        try {
          const gasCost = await contract.estimateGas.transfer(
            sendTo,
            ethers.utils.parseEther(amount)
          );

          setEstimatedGasCost(ethers.utils.formatEther(gasCost.toString()));
        } catch (error) {
          console.log(error);
        }
      })();
    }
  }, [connectedWallets, sendTo, amount]);

  return (
    <div className="form-wrapper">
      <p>Balance: {balance} LSP</p>
      <form className="send-form" onSubmit={handleSend}>
        <div>
          <label htmlFor="sendTo">Send to:</label>
          <input
            type="text"
            id="sendTo"
            value={sendTo}
            onChange={handleSendToChange}
            required
          />
        </div>
        <div>
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={handleAmountChange}
            required
          />
        </div>
        <label htmlFor="estimatedGasCost">
          Network Fee: {estimatedGasCost} ETH
        </label>
        <button type="submit">Send</button>
      </form>
      {isLoading && <p>Loading...</p>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default SendForm;
