---
id: frontend/wallet-connect
title: Wallet Connect
sidebar_position: 2
---

# Wallet Connect

The frontend uses [Freighter](https://freighter.app/) for wallet connection and transaction signing. No custodial keys or backend accounts are involved.

## Installation

Freighter is installed as a browser extension. Users without Freighter will see a prompt to install it.

```bash
npm install @stellar/freighter-api
```

## Connecting

```typescript
import { getPublicKey, isConnected } from "@stellar/freighter-api";

async function connectWallet(): Promise<string | null> {
  const connected = await isConnected();
  if (!connected) return null;
  const publicKey = await getPublicKey();
  return publicKey;
}
```

## Signing Transactions

When a user creates, cancels, or pauses a subscription, the frontend builds the Soroban transaction, passes it to Freighter for signing, and submits it to the RPC:

```typescript
import { signTransaction } from "@stellar/freighter-api";
import { rpc, Transaction } from "@stellar/stellar-sdk";

async function signAndSubmit(tx: Transaction, networkPassphrase: string) {
  const signed = await signTransaction(tx.toXDR(), { networkPassphrase });
  const server = new rpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL!);
  return server.sendTransaction(
    new Transaction(signed, networkPassphrase)
  );
}
```

## Network Detection

The app reads `NEXT_PUBLIC_STELLAR_NETWORK` (`testnet` or `mainnet`) at build time and uses the corresponding RPC URL and network passphrase. Freighter will prompt the user to switch networks if there is a mismatch.
