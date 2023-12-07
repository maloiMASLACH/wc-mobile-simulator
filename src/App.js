import logo from "./logo.svg";
import { ethers } from "ethers";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import "./App.css";
import React, { useState } from "react";
import { io } from "socket.io-client";

const ws = io("wss://vitreus-wallet-dev.compliq.io:820", {
  query: { session_id: "321312", mobile_socket: true },
});

const createProvider = () => {
  return ApiPromise.create({
    provider: new WsProvider("wss://rpc.devnet.compliq.io:9945"),
    initWasm: false,
    types: {
      // mapping the actual specified address format
      AccountId: "EthereumAccountId",
      Address: "AccountId",
      Balance: "u128",
      RefCount: "u8",
      LookupSource: "AccountId",
      Account: {
        nonce: "U256",
        balance: "u128",
      },
      EthTransaction: "LegacyTransaction",
      DispatchErrorModule: "DispatchErrorModuleU8",
      EthereumSignature: {
        r: "H256",
        s: "H256",
        v: "U8",
      },
      ExtrinsicSignature: "EthereumSignature",
      TxPoolResultContent: {
        pending: "HashMap<H160, HashMap<U256, PoolTransaction>>",
        queued: "HashMap<H160, HashMap<U256, PoolTransaction>>",
      },
      TxPoolResultInspect: {
        pending: "HashMap<H160, HashMap<U256, Summary>>",
        queued: "HashMap<H160, HashMap<U256, Summary>>",
      },
      TxPoolResultStatus: {
        pending: "U256",
        queued: "U256",
      },
      Summary: "Bytes",
      PoolTransaction: {
        hash: "H256",
        nonce: "U256",
        blockHash: "Option<H256>",
        blockNumber: "Option<U256>",
        from: "H160",
        to: "Option<H160>",
        value: "U256",
        gasPrice: "U256",
        gas: "U256",
        input: "Bytes",
      },
    },
  });
};

function App() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");
  const [txId, setTxId] = useState("");
  const [message, setMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [value, setValue] = useState("");
  const [callValue, setCallValue] = useState("");
  const [privateKey, setPrivate] = useState("");
  const [callReceiver, setCallReceiver] = useState("");
  console.log("🚀 ~ file: App.js:10 ~ App ~ input:", input);

  ws.on("error", (error) => console.log(error));
  ws.on("message", (message) => console.log(4, message));
  ws.on("disconnect", (message) => {
    console.log(message);
    ws.connect();
  });

  const handleSubmit = () => {
    console.log(1);
    ws.emit(
      "approveConnection",

      JSON.stringify({
        address: address,
        isSuccess: true,
      })
    );
  };

  const handleDisconnect = () => {
    ws.emit(
      "disconnectSession",

      JSON.stringify({
        sessionId: input,
      })
    );
  };

  const handleReject = () => {
    console.log(3);
    ws.emit(
      "approveConnection",

      JSON.stringify({
        address: "address fro test",
        isSuccess: false,
      })
    );
  };

  const getSeesion = () => {
    console.log(2);
    ws.emit(
      "getSession",

      JSON.stringify({
        sessionId: input,
      })
    );
  };

  const submitMessage = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const signature = await signer.signMessage("message");
    const address = await signer.getAddress();
    console.log("🚀 ~ file: App.js:74 ~ submitTx ~ address:", address);
    console.log("🚀 ~ file: App.js:73 ~ submitTx ~ signature:", signature);
    ws.emit(
      "sendSigningMessage",

      JSON.stringify({
        accepted: true,
        address: address,
        signedMessage: signature,
        txId: txId,
      })
    );
  };

  const submitTx = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const nonce = await signer.getTransactionCount();
    const address = await signer.getAddress();
    ws.emit(
      "sendSigningTx",

      JSON.stringify({
        accepted: true,
        address: address,
        txId: txId,
      })
    );

    console.log("🚀 ~ file: App.js:74 ~ submitTx ~ receiver:", receiver);
    const tx = await signer.sendTransaction({
      to: receiver,
      value: value,
      nonce: nonce,
    });

    console.log("🚀 ~ file: App.js:73 ~ submitTx ~ signature:", tx);
    ws.emit(
      "sendSigningTxResult",

      JSON.stringify({
        isCompleted: true,
        address: address,
        txId: txId,
        txHash: tx.hash,
      })
    );
  };

  const submitSendCall = async () => {
    const keyring = await new Keyring({ type: "ethereum" });
    const signer = await keyring.addFromUri(privateKey);
    console.log("🚀 ~ file: App.js:190 ~ submitSendCall ~ signer:", signer);
    console.log(
      "🚀 ~ file: App.js:191 ~ submitSendCall ~ receiver:",
      callReceiver
    );

    const api = await createProvider();

    ws.emit(
      "sendSigningActionCall",

      JSON.stringify({
        accepted: true,
        address: address,
        txId: txId,
      })
    );

    const txHash = await api.tx.balances
      .transfer(callReceiver, callValue)
      .signAndSend(signer);

    ws.emit(
      "sendSigningActionCallResult",

      JSON.stringify({
        isCompleted: true,
        address: address,
        txId: txId,
        txHash: txHash,
      })
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <input
          placeholder="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          placeholder="sessionId"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={getSeesion}>getSession</button>
        <button onClick={handleSubmit}>submit</button>
        <button onClick={handleReject}>reject</button>
        <button onClick={handleDisconnect}>disconnect</button>
        CHANGE TXID BEFORE EVERY EVENT
        <input
          placeholder="txId"
          value={txId}
          onChange={(e) => setTxId(e.target.value)}
        />
        <div>
          <input
            placeholder="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={submitMessage}>SIGN MESSAGE</button>
        </div>
        <div>
          <input
            placeholder="receiver"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
          <input
            placeholder="values"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button onClick={submitTx}>SIGN TX</button>
        </div>
        <div>
          <input
            placeholder="privateKey"
            value={privateKey}
            onChange={(e) => setPrivate(e.target.value)}
          />
          <input
            placeholder="callReceiver"
            value={callReceiver}
            onChange={(e) => setCallReceiver(e.target.value)}
          />
          <input
            placeholder="callValue"
            value={callValue}
            onChange={(e) => setCallValue(e.target.value)}
          />
          <button onClick={submitSendCall}>SIGN CALL</button>
        </div>
      </header>
    </div>
  );
}

export default App;
