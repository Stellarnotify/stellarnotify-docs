---
id: examples/on-chain-channel
title: On-Chain Channel (Rust)
sidebar_position: 5
---

# On-Chain Channel — Rust Contract Example

This example shows how to use the **OnChain** delivery channel, where StellarNotify re-emits matched events as Soroban events. Your contract listens for the re-emitted event and reacts — no off-chain infrastructure required.

## Use Case

You're building an automated market maker that needs to react when a specific token transfer happens on a watched contract. Instead of running an off-chain indexer + bot, you register a StellarNotify subscription with `channel: OnChain`. When the transfer event fires, StellarNotify re-emits it, and your AMM contract's logic executes atomically.

## Subscription Setup

```bash
stellar contract invoke \
  --id NOTIFY_CONTRACT_ID \
  --source YOUR_IDENTITY \
  --network testnet \
  -- subscribe \
  --owner YOUR_CONTRACT_ADDRESS \
  --watched_contract TOKEN_CONTRACT_ID \
  --topics '["transfer"]' \
  --channel OnChain \
  --endpoint_ref "0000000000000000000000000000000000000000000000000000000000000000" \
  --ttl_ledgers 100000
```

**Note**: `endpoint_ref` is set to 32 zero bytes since no webhook URL is needed for OnChain delivery.

## Listening for Re-Emitted Events

StellarNotify re-emits the event with a predictable topic structure. Your contract uses Soroban's event system to listen.

```rust
use soroban_sdk::{contract, contractimpl, log, Env, Address, Vec, String};

#[contract]
pub struct AutomatedMarketMaker;

#[contractimpl]
impl AutomatedMarketMaker {
    /// Called by an external actor when they want the AMM to react
    /// to new on-chain events from StellarNotify.
    ///
    /// This is a manual trigger — the contract does not execute automatically.
    /// A keeper bot or user calls this, and the contract reads recent events.
    pub fn process_notifications(env: Env) {
        // Query recent events from the Stellar event log
        // (Soroban does not yet support automatic event-triggered execution,
        //  so this is a pull model rather than push.)
        
        // Pseudocode — actual event querying APIs depend on Soroban SDK version:
        // let events = env.events().get_recent(...);
        
        // Filter for events re-emitted by StellarNotify with topic "notify_reemit"
        // and extract the original transfer event data
        
        log!(&env, "Processing StellarNotify re-emitted events");
        
        // Example: if transfer amount > threshold, execute swap logic
        Self::execute_swap_if_needed(env);
    }
    
    fn execute_swap_if_needed(env: Env) {
        log!(&env, "Swap logic executed based on transfer notification");
        // Add your business logic here
    }
}
```

## Re-Emitted Event Structure

When StellarNotify re-emits an event, it wraps the original event with metadata:

```
topics: ["notify_reemit", subscription_id, original_contract]
data:   { original_topics: [...], original_data: {...}, ledger: 12345678 }
```

Your contract filters for `topics[0] == "notify_reemit"` and unpacks `original_topics` and `original_data` to inspect the actual transfer event.

## Current Soroban Limitation

As of Soroban v21, contracts cannot be invoked automatically by events — there is no "event trigger" primitive yet. The pattern is:

1. StellarNotify re-emits the event on-chain
2. A keeper bot (or any external caller) invokes your contract's handler function
3. The handler queries recent events from the Stellar ledger and processes them

When Soroban adds event-triggered execution in a future release, this pattern becomes fully automated — no keeper bot needed.

## Advantages of On-Chain Channel

- **No backend** — your contract logic is entirely on-chain
- **Composability** — other contracts can read the same re-emitted events
- **Censorship resistance** — no trusted off-chain service can block delivery

## Disadvantages

- Requires keeper bot or manual triggering (until Soroban adds event triggers)
- Gas cost for every re-emit transaction (paid by the StellarNotify backend operator)
