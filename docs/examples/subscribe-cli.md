---
id: subscribe-cli
title: Subscribe via Stellar CLI (Bash)
sidebar_position: 2
---

# Subscribe via Stellar CLI (Bash)

This example shows how to create a subscription directly from the terminal using the [Stellar CLI](https://developers.stellar.org/docs/tools/cli).

## Prerequisites

- Stellar CLI v22+ installed
- A funded testnet account configured as a CLI identity
- The StellarNotify registry contract deployed (see [Quick Start](../quick-start))

## 1. Compute `endpoint_ref`

The on-chain record stores the SHA-256 hash of your webhook URL, not the URL itself.

```bash
# Store your webhook URL
WEBHOOK_URL="https://yourapp.example.com/notify"

# Compute SHA-256 hash (hex)
ENDPOINT_REF=$(echo -n "$WEBHOOK_URL" | sha256sum | awk '{print $1}')
echo "endpoint_ref: $ENDPOINT_REF"
```

## 2. Create the Subscription

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source YOUR_IDENTITY \
  --network testnet \
  -- subscribe \
  --owner YOUR_ADDRESS \
  --watched_contract TARGET_CONTRACT_ID \
  --topics '["transfer"]' \
  --channel Webhook \
  --endpoint_ref "$ENDPOINT_REF" \
  --ttl_ledgers 100000
```

The command prints the new subscription ID on success.

```
42
```

## 3. Register the Endpoint URL

Tell the backend the actual URL so it knows where to deliver webhooks:

```bash
curl -X POST https://your-backend.example.com/subscriptions/endpoint \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"subscription_id\": 42,
    \"endpoint_url\": \"$WEBHOOK_URL\"
  }"
```

## 4. Verify the Subscription

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source YOUR_IDENTITY \
  --network testnet \
  -- get_sub \
  --id 42
```

Expected output:

```json
{
  "id": 42,
  "owner": "GAAA...",
  "watched_contract": "CAAAA...",
  "topics": ["transfer"],
  "channel": "Webhook",
  "endpoint_ref": "3b4c5d...",
  "ttl_ledgers": 100000,
  "status": "active"
}
```

## 5. List Your Subscriptions

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source YOUR_IDENTITY \
  --network testnet \
  -- list_by_owner \
  --owner YOUR_ADDRESS
```

## Channel Variants

Change the `--channel` flag to switch delivery method:

| Flag | Delivery |
|---|---|
| `--channel Webhook` | HTTP POST to your endpoint |
| `--channel InApp` | SSE stream in the dashboard |
| `--channel OnChain` | Re-emitted Soroban event |

For `InApp` and `OnChain` channels, `--endpoint_ref` should be 32 zero bytes since no URL is needed:

```bash
--endpoint_ref "0000000000000000000000000000000000000000000000000000000000000000"
```

## Cancelling a Subscription

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source YOUR_IDENTITY \
  --network testnet \
  -- cancel \
  --owner YOUR_ADDRESS \
  --id 42
```
