---
id: contract-errors
title: Error Codes
sidebar_position: 5
---

# Error Codes

All StellarNotify contract errors are defined as a Soroban `contracterror` enum and are returned as structured error values rather than panics.

## Error Reference

| Code | Name | Description |
|---|---|---|
| `1` | `NotInitialised` | A function was called before `initialise()` |
| `2` | `AlreadyInitialised` | `initialise()` was called a second time |
| `3` | `Unauthorised` | Caller is not the owner or admin of the resource |
| `4` | `Paused` | Protocol is paused; `subscribe` calls are rejected |
| `5` | `LimitReached` | Owner has reached the `max_per_owner` subscription limit |
| `6` | `TtlTooLong` | Requested TTL exceeds the configured `max_ttl` |
| `7` | `NotFound` | Subscription ID does not exist |
| `8` | `AlreadyPaused` | `pause_sub` called on a subscription that is already paused |
| `9` | `NotPaused` | `resume_sub` called on a subscription that is not paused |

## Handling Errors

In the Stellar CLI you will see errors as `HostError` with a contract error code. In JavaScript/TypeScript with `stellar-sdk`:

```typescript
import { rpc } from "@stellar/stellar-sdk";

try {
  await server.simulateTransaction(tx);
} catch (e) {
  if (e instanceof rpc.Api.SimulateTransactionErrorResponse) {
    console.error("Contract error:", e.error);
  }
}
```
