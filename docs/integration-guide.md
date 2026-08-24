---
id: integration-guide
title: Integration Guide
sidebar_position: 10
---

# Integration Guide

This guide shows how to integrate StellarNotify into your own dapp so your users receive real-time alerts when your contract emits events.

## Overview

There are three steps:

1. **Subscribe on-chain** — call `subscribe()` on the StellarNotify registry contract from your user's wallet
2. **Register the endpoint** — tell the backend the actual delivery URL (webhook, Telegram chat ID, or email)
3. **Receive and handle notifications** — process the inbound payload on your server or listen on the SSE stream

---

## Step 1 — Subscribe On-Chain

Your frontend calls the StellarNotify registry contract. The user signs with their wallet (Freighter or any Stellar-compatible signer).

```typescript
import { Contract, Networks, TransactionBuilder, rpc } from "@stellar/stellar-sdk";

const CONTRACT_ID = "C..."; // StellarNotify registry contract
const RPC_URL = "https://soroban-testnet.stellar.org";

async function createSubscription(
  userPublicKey: string,
  watchedContract: string,
  endpointHash: string // SHA-256 hex of your webhook URL
) {
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(userPublicKey);

  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "subscribe",
        // parameters match the contract ABI
      )
    )
    .setTimeout(30)
    .build();

  // Pass tx to Freighter for signing, then submit
}
```

See [subscribe.md](./contract/subscribe) for the full parameter reference.

---

## Step 2 — Register the Endpoint

After the on-chain subscription is created, register the actual delivery URL with the backend. Only an HTTPS URL is accepted.

```bash
curl -X POST https://your-stellarnotify-instance.example.com/subscriptions/endpoint \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 42,
    "endpoint_url": "https://yourapp.example.com/notify"
  }'
```

The on-chain record stores only the SHA-256 hash of this URL. The backend verifies the hash matches before storing.

---

## Step 3 — Receive Notifications

### Webhook (HTTP POST)

Your endpoint will receive a POST request:

```json
{
  "notification_id": "uuid",
  "subscription_id": 42,
  "contract": "CAAAA...",
  "ledger": 12345678,
  "topics": ["transfer", "GAAAA..."],
  "data": { "amount": "1000000000" },
  "timestamp": "2026-01-01T00:00:00Z"
}
```

Verify the `X-StellarNotify-Signature` header (HMAC-SHA256) before processing. See [Webhook Dispatcher](./backend/webhook-dispatcher) for the verification snippet.

Respond with HTTP `2xx` to acknowledge. Non-2xx responses trigger a retry.

### In-App (SSE)

Open an SSE connection from your frontend:

```typescript
const es = new EventSource(`https://your-stellarnotify-instance.example.com/sse/${userPublicKey}`);

es.addEventListener("notification", (e) => {
  const data = JSON.parse(e.data);
  showToast(`New event from ${data.contract}`);
});
```

### On-Chain

If you subscribed with `channel: OnChain`, StellarNotify re-emits a Soroban event. Your own contract (or another listener) can react to it without any HTTP infrastructure.

---

## Computing `endpoint_ref`

The on-chain subscription stores a SHA-256 hash of your endpoint URL rather than the URL itself.

```typescript
import { createHash } from "crypto";

function hashEndpoint(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

const endpointRef = hashEndpoint("https://yourapp.example.com/notify");
// Pass this 32-byte hex value to subscribe()
```

See [Endpoint Privacy](./endpoint-privacy) for the full rationale.

---

## Checklist

- [ ] StellarNotify backend is running and reachable
- [ ] Registry contract ID is set in your frontend env
- [ ] User wallet signs the `subscribe()` transaction
- [ ] Endpoint URL registered via `POST /subscriptions/endpoint`
- [ ] Webhook receiver validates the HMAC-SHA256 signature
- [ ] Respond with `2xx` to acknowledge delivery
