---
id: contract-initialise
title: Initialise
sidebar_position: 2
---

# Initialise

The `initialise` function is called once after deployment to configure the contract. Calling it a second time will return an error.

## Function Signature

```rust
fn initialise(env: Env, admin: Address, max_per_owner: u32, max_ttl: u32)
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `admin` | `Address` | The address that will hold the admin role |
| `max_per_owner` | `u32` | Maximum number of active subscriptions per wallet address |
| `max_ttl` | `u32` | Maximum TTL in ledgers a subscription can request (`0` = unlimited) |

## Example

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ADMIN_ADDRESS \
  --network testnet \
  -- initialise \
  --admin ADMIN_ADDRESS \
  --max_per_owner 20 \
  --max_ttl 0
```

## Errors

| Code | Meaning |
|---|---|
| `AlreadyInitialised` | Contract has already been initialised |

## Related

- [`update_config`](./manage) — Update limits after deployment
- [`transfer_admin`](./manage) — Transfer the admin role
