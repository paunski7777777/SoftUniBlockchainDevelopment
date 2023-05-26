import React, { useCallback, useEffect, useState } from "react";
import TransferCard from "./TransferCard/TransferCard.jsx";
import { ethers } from "ethers";
import "./TransferSection.css";
import { useWallets } from "@web3-onboard/react";
import { getContract } from "../../helpers/index.js";

const TransfersSection = () => {
  const [transfers, setTransfers] = useState([]);

  const connectedWallets = useWallets();

  useEffect(() => {
    (async () => {
      const contract = getContract(connectedWallets);
      if (!contract) {
        return;
      }

      const filter = contract.filters.Transfer(
        connectedWallets[0].accounts[0].address,
        null
      );

      const fetchedTransfers = await contract.queryFilter(filter, 0, "latest");

      const mappedTransfers = fetchedTransfers.map((transfer) => {
        transfer.value = ethers.utils.formatEther(
          transfer.args.value.toString()
        );
        transfer.to = transfer.args.to;
        return transfer;
      });

      setTransfers(mappedTransfers);
    })();
  }, [connectedWallets]);

  return (
    <section className="transfers-section">
      <h2>Transfers</h2>
      <div className="transfers-section-main">
        {transfers.map((transfer, index) => (
          <TransferCard key={index} to={transfer.to} value={transfer.value} />
        ))}
      </div>
    </section>
  );
};

export default TransfersSection;
