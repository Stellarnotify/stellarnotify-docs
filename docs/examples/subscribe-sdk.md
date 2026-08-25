---
id: subscribe-sdk
title: Subscribe via stellar-sdk (JS)
sidebar_position: 1
---

# Subscribe via stellar-sdk (JavaScript)

This example shows how to create an on-chain subscription programmatically using `@stellar/stellar-sdk` in a Node.js or browser context.

## Install

```bash
npm install @stellar/stellar-sdk
```

## Full Example

```typescript
import {
  Contract,
  Networks,
  TransactionBuilder,
  rpc,
  xdr,
  Address,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { createHash } from "crypto";

// ─── Config ────────────────────────────────────────────────
const RPC_URL         = "https://soroban-testnet.stellar.org";
const CONTRACT_ID     = "C...";          // StellarNotify registry contract
const OWNER_ADDRESS   = "G...";          // Subscriber's public key
const WATCHED_CONTRACT = "C...";         // Contract to monitor
const WEBHOOK_URL     = "https://yourapp.example.com/notify";
// ────────────────────────────────────────────────────────────

/** SHA-256 hash of the webhook URL — stored on-chain, not the URL itself */
function endpointRef(url: string): Buffer {
  return createHash("sha256").update(url).digest();
}

async function subscribe() {
  const server  = new rpc.Server(RPC_URL);
  const account = await server.getAccount(OWNER_ADDRESS);
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "subscribe",
        new Address(OWNER_ADDRESS).toScVal(),                    // owner
        new Address(WATCHED_CONTRACT).toScVal(),                 // watched_contract
        nativeToScVal(["transfer"], { type: "string" }),         // topics
        nativeToScVal({ tag: "Webhook", values: [] }),           // channel
        xdr.ScVal.scvBytes(endpointRef(WEBHOOK_URL)),            // endpoint_ref
        nativeToScVal(100000, { type: "u32" }),                  // ttl_ledgers
      )
    )
    .setTimeout(30)
    .build();

  // Simulate first to check for errors
  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  // Assemble the transaction with the simulation result
  const preparedTx = rpc.assembleTransaction(tx, simResult).build();

  // Sign with your keypair (in production: pass to Freighter instead)
  // preparedTx.sign(keypair);

  const sendResult = await server.sendTransaction(preparedTx);
  console.log("Transaction hash:", sendResult.hash);

  // Poll for confirmation
  let getResult = await server.getTransaction(sendResult.hash);
  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 2000));
    getResult = await server.getTransaction(sendResult.hash);
  }

  if (getResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    console.log("Subscription created ✅");
  } else {
    console.error("Transaction failed:", getResult);
  }
}

subscribe().catch(console.error);
```

## Key Points

- `endpoint_ref` is the SHA-256 hash of your webhook URL — never pass the raw URL
- `topics` is an array of strings — pass an empty array `[]` to match all events
- `ttl_ledgers` of `0` uses the protocol's configured `max_ttl`
- In a browser context, replace the `keypair.sign()` call with Freighter's `signTransaction` — see [Wallet Connect](../frontend/wallet-connect)

## Next Step

After the transaction confirms, register your actual webhook URL with the backend:

```bash
curl -X POST https://your-backend.example.com/subscriptions/endpoint \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "subscription_id": <id>, "endpoint_url": "https://yourapp.example.com/notify" }'
```
