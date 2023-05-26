import React, { useEffect, useState } from "react";
import { useConnectWallet, useWallets } from "@web3-onboard/react";

import "./Navbar.css";

import { formatEthAddress } from "../../helpers";

const Navbar = ({ onDisconnect }) => {
  const [userWalletAddress, setUserWalletAddress] = useState(null);
  const [{ wallet }] = useConnectWallet();
  const connectedWallets = useWallets();

  useEffect(() => {
    if (
      connectedWallets &&
      connectedWallets.length > 0 &&
      connectedWallets[0].accounts &&
      connectedWallets[0].accounts.length > 0
    ) {
      setUserWalletAddress(connectedWallets[0].accounts[0].address);
    } else {
      setUserWalletAddress(null);
    }
  }, [connectedWallets]);

  return (
    <div className="navbar">
      <div className="navbar-left">
        <span className="navbar-label">SoftUni</span>
      </div>
      {wallet && (
        <>
          <p className="navbar-label" style={{ margin: "10px" }}>
            {userWalletAddress && formatEthAddress(userWalletAddress)}
          </p>
          <div className="navbar-right">
            <button className="disconnect-button" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
