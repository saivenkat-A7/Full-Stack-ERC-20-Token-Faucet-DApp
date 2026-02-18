import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { blockchainService } from '../utils/blockchain.js';

export function FaucetInterface({ address, connected }) {
  const [balance, setBalance] = useState('0');
  const [canClaim, setCanClaim] = useState(false);
  const [remainingAllowance, setRemainingAllowance] = useState('0');
  const [timeUntilClaim, setTimeUntilClaim] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [faucetInfo, setFaucetInfo] = useState(null);

  useEffect(() => {
    if (connected && address) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [connected, address]);

  useEffect(() => {
    loadFaucetInfo();
  }, []);

  useEffect(() => {
    if (timeUntilClaim > 0) {
      const interval = setInterval(() => {
        setTimeUntilClaim(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeUntilClaim]);

  const loadFaucetInfo = async () => {
    try {
      const info = await blockchainService.getFaucetInfo();
      setFaucetInfo(info);
    } catch (err) {
      console.error("Error loading faucet info:", err);
    }
  };

  const loadData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const [bal, claim, allowance, time] = await Promise.all([
        blockchainService.getBalance(address),
        blockchainService.canClaim(address),
        blockchainService.getRemainingAllowance(address),
        blockchainService.getTimeUntilNextClaim(address)
      ]);

      setBalance(bal);
      setCanClaim(claim);
      setRemainingAllowance(allowance);
      setTimeUntilClaim(time);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setError(null);
    setSuccess(null);
    setClaiming(true);

    try {
      const txHash = await blockchainService.requestTokens();
      setSuccess(`Tokens claimed! Transaction: ${txHash.slice(0, 10)}...`);
      
      // Reload data after successful claim
      setTimeout(loadData, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return 'Ready to claim!';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (!connected) {
    return (
      <div className="faucet-interface">
        <div className="info-card">
          <h2>Connect your wallet to get started</h2>
          <p>Connect your MetaMask wallet to claim free tokens!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faucet-interface">
      <div className="info-grid">
        <div className="info-card">
          <div className="card-label">Your Balance</div>
          <div className="card-value">
            {loading ? '...' : ethers.formatEther(balance)} FAUCET
          </div>
        </div>

        <div className="info-card">
          <div className="card-label">Remaining Allowance</div>
          <div className="card-value">
            {loading ? '...' : ethers.formatEther(remainingAllowance)} FAUCET
          </div>
        </div>

        <div className="info-card">
          <div className="card-label">Claim Status</div>
          <div className="card-value cooldown">
            {loading ? '...' : formatTime(timeUntilClaim)}
          </div>
        </div>

        {faucetInfo && (
          <div className="info-card">
            <div className="card-label">Tokens per Claim</div>
            <div className="card-value">
              {faucetInfo.faucetAmount} FAUCET
            </div>
          </div>
        )}
      </div>

      <div className="claim-section">
        <button
          onClick={handleClaim}
          disabled={!canClaim || claiming || timeUntilClaim > 0}
          className="claim-button"
        >
          {claiming ? (
            <>
              <span className="spinner"></span>
              Claiming...
            </>
          ) : timeUntilClaim > 0 ? (
            `Wait ${formatTime(timeUntilClaim)}`
          ) : !canClaim ? (
            'Cannot Claim'
          ) : (
            'Claim Tokens'
          )}
        </button>

        {error && (
          <div className="message error-message">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            ✓ {success}
          </div>
        )}
      </div>

      <div className="info-section">
        <h3>How it works</h3>
        <ul>
          <li>Claim {faucetInfo?.faucetAmount || '100'} FAUCET tokens every 24 hours</li>
          <li>Maximum lifetime limit: {faucetInfo?.maxClaimAmount || '1000'} FAUCET</li>
          <li>Tokens are automatically sent to your wallet</li>
        </ul>
      </div>
    </div>
  );
}