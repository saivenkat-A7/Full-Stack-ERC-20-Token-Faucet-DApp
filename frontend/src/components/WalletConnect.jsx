import React, { useState, useEffect } from 'react';
import { walletManager } from '../utils/wallet.js';

export function WalletConnect({ onConnectionChange }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = walletManager.subscribe((state) => {
      setConnected(state.connected);
      setAddress(state.address);
      if (onConnectionChange) {
        onConnectionChange(state);
      }
    });

    return unsubscribe;
  }, [onConnectionChange]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      await walletManager.connect();
      // Try to switch to Sepolia
      try {
        await walletManager.switchToSepolia();
      } catch (e) {
        console.warn("Could not switch to Sepolia:", e);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletManager.disconnect();
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!connected) {
    return (
      <div className="wallet-connect">
        <button 
          onClick={handleConnect} 
          disabled={connecting}
          className="connect-button"
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="wallet-connected">
      <div className="address-display">
        <span className="status-dot"></span>
        <span className="address">{formatAddress(address)}</span>
      </div>
      <button onClick={handleDisconnect} className="disconnect-button">
        Disconnect
      </button>
    </div>
  );
}