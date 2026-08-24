---
id: contract/subscribe
title: Subscribe
sidebar_position: 3
---

# Subscribe

The `subscribe` function creates a new on-chain subscription. The caller must sign the transaction with their Stellar wallet — ownership is enforced by `require_auth()`.

## Function Signature

```rust
fn subscribe(
    env: Env,
    owner: Address,
    watched_contract: Address,
    topics: Vec<String>,
    channel: Channel,
    endpoint_ref: BytesN<32>,
    ttl_ledgers: u32,
) -> u64
```

Returns the new subscription `id`.

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `owner` | `Address` | Wallet creating the subscription (must sign) |
| `watched_contract` | `Address` | Soroban contract whose events you want to monitor |
| `topics` | `Vec<String>` | Event topic filters — empty matches all events from the contract |
| `channel` | `Channel` | Delivery channel: `Webhook`, `InApp`, or `OnChain` |
| `endpoint_ref` | `BytesN<32>` | SHA-256 hash of your webhook URL (stored on-chain). Unused for `InApp` and `OnChain` channels |
| `ttl_ledgers` | `u32` | How many ledgers the subscription stays active (`0` = use protocol max) |

## Channel Enum

```rust
pub enum Channel {
    Webhook,
    InApp,
    OnChain,
}
```

## Computing `endpoint_ref`

```bash
# SHA-256 of your endpoint URL, hex-encoded
echo -n "https://yourapp.example.com/notify" | sha256sum
```

Pass the resulting 32-byte hex value as `endpoint_ref`.

## Example

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source YOUR_ADDRESS \
  --network testnet \
  -- subscribe \
  --owner YOUR_ADDRESS \
  --watched_contract TARGET_CONTRACT_ID \
  --topics '["transfer"]' \
  --channel Webhook \
  --endpoint_ref <32_BYTE_HEX> \
  --ttl_ledgers 100000
```

## Events Emitted

On success the contract emits:

```
topics: ["sub_new", owner]
data:   (id, watched_contract)
```

## Errors

| Code | Meaning |
|---|---|
| `Paused` | Protocol is paused by admin |
| `LimitReached` | Owner has reached `max_per_owner` subscriptions |
| `TtlTooLong` | Requested TTL exceeds `max_ttl` |
