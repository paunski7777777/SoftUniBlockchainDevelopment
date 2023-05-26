import React from "react";

import "./TransferCard.css";

const TransferCard = ({ to, value }) => {
  return (
    <div className="transfer-card">
      <h3>To: {to}</h3>
      <p>Value: {value}</p>
    </div>
  );
};

export default TransferCard;
