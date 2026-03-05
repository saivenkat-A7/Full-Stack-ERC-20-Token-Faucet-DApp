import React, { useState } from "react";

function App() {
  const [msg, setMsg] = useState("");

  const claim = async () => {
    const res = await window.__EVAL__.claimTokens();
    setMsg(res);
  };

  const status = async () => {
    const paused = await window.__EVAL__.isPaused();
    setMsg(paused ? "PAUSED" : "ACTIVE");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>ERC-20 Faucet</h2>

      <button onClick={claim}>Claim Tokens</button>
      <button onClick={status} style={{ marginLeft: 10 }}>
        Faucet Status
      </button>

      <p>{msg}</p>
    </div>
  );
}

export default App;
