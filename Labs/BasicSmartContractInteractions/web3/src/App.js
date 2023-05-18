import { useEffect, useState } from "react";
import "./App.css";

import { ethers } from "ethers";

function App() {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState();

  const handleWalletConnection = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (provider) {
      setProvider(provider);

      const accountsData = await provider.send("eth_requestAccounts", []);
      setAccounts(accountsData);

      localStorage.setItem("connectedWithWallet", true);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("connectedWithWallet")) {
      handleWalletConnection();
    }
  }, []);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setCurrentAccount(accounts[0]);
    }
  }, [accounts]);

  const getBlockNumber = async () => {
    if (provider) {
      setBlockNumber(await provider.getBlockNumber());
    }
  };

  const getBalance = async () => {
    if (provider && currentAccount) {
      const wei = await provider.getBalance(currentAccount);
      const eth = ethers.utils.formatEther(wei);
      setCurrentBalance(eth);
    }
  };

  const sendTransaction = async () => {
    if (provider) {
      setLoading(true);

      try {
        const signer = provider.getSigner();
        const tx = await signer.sendTransaction({
          to: "0x7bbd601BAa99EBF445a96275575bf3047668A96b",
          value: ethers.utils.parseEther("1.0"),
        });
        await tx.wait();

        setMessage("Success");
      } catch (error) {
        setMessage(error.message);
      }

      setLoading(false);
    }
  };

  return (
    <div className="App">
      <button onClick={handleWalletConnection}>Connect Wallet</button>
      {currentAccount ? <h1>{currentAccount}</h1> : <h1>Not connected</h1>}
      {provider && <button onClick={getBlockNumber}>Get Block Number</button>}
      {blockNumber !== null && <h1>{blockNumber}</h1>}
      {provider && <button onClick={getBalance}>Get Balance</button>}
      {currentBalance !== null && <h1>{currentBalance.toString()}</h1>}
      {provider && <button onClick={sendTransaction}>Send Transaction</button>}
      {loading && <h1>Loading...</h1>}
      <h3>{message}</h3>
    </div>
  );
}

export default App;
