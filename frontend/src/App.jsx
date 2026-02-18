import React, { useState } from 'react';
import { WalletConnect } from './components/WalletConnect.jsx';
import { FaucetInterface } from './components/FaucetInterface.jsx';
import './utils/eval.js';
import './App.css';

function App() {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: null
  });

  const handleConnectionChange = (state) => {
    setWalletState(state);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <h1>🚰 Token Faucet</h1>
            <WalletConnect onConnectionChange={handleConnectionChange} />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <FaucetInterface 
            address={walletState.address}
            connected={walletState.connected}
          />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Built with Solidity, React, and Ethers.js | Deployed on Sepolia Testnet</p>
        </div>
      </footer>
    </div>
  );
}

export default App;