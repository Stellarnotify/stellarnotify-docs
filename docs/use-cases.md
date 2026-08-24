---
id: use-cases
title: Use Cases
sidebar_position: 17
---

# Use Cases

StellarNotify is general-purpose infrastructure — any Soroban contract that emits events can be watched. These are the most common patterns.

---

## Escrow Alerts

**Protocol**: Trustless Work or any escrow contract

A user locks funds in an escrow contract and wants to know the moment the counterparty fulfils the condition and the funds are released.

**Subscription setup**
- `watched_contract`: escrow contract address
- `topics`: `["escrow_funded"]`, `["escrow_released"]`, `["dispute_opened"]`
- `channel`: Webhook or In-App

**Result**: The depositor and beneficiary both receive an instant notification when escrow state changes — no polling, no missed events.

---

## Lending Liquidations

**Protocol**: Blend or any lending/borrowing contract

A borrower's position approaches the liquidation threshold. They need a warning before they're liquidated, not after.

**Subscription setup**
- `watched_contract`: Blend lending pool contract
- `topics`: `["liquidation"]`, `["health_factor_warning"]`
- `channel`: Webhook (to trigger an automated top-up bot) + In-App (to alert the user)

**Result**: The borrower's backend receives a webhook and automatically tops up collateral. The user also gets an in-app alert via the dashboard SSE stream.

---

## DAO Votes

**Protocol**: Any on-chain governance contract

A DAO member wants to know when a new proposal is submitted, when voting opens, and when a vote passes or fails.

**Subscription setup**
- `watched_contract`: governance contract address
- `topics`: `["proposal_created"]`, `["vote_cast"]`, `["proposal_passed"]`, `["proposal_failed"]`
- `channel`: In-App or Telegram (v0.2)

**Result**: Members stay informed without checking the governance UI constantly. High-quorum votes get better participation because members are notified in real time.

---

## Stream Expiry

**Protocol**: FlowFi or any payment streaming contract

A recipient's payment stream is about to expire. They want to renegotiate or request a renewal before the stream runs dry.

**Subscription setup**
- `watched_contract`: FlowFi stream contract
- `topics`: `["stream_started"]`, `["stream_paused"]`, `["stream_expired"]`
- `channel`: Webhook

**Result**: The recipient's app receives a webhook when the stream is within N ledgers of expiry and displays a renewal prompt — all without maintaining a custom indexer.

---

## NFT / Token Events

**Protocol**: Any SEP-41 token or NFT contract

A marketplace wants to notify buyers when an NFT they bid on is purchased by someone else, or when a listing price drops.

**Subscription setup**
- `watched_contract`: token or NFT contract address
- `topics`: `["transfer"]`, `["listing_updated"]`, `["bid_accepted"]`
- `channel`: In-App

**Result**: Real-time marketplace activity feeds without building custom event infrastructure per collection.

---

## On-Chain Automation

**Protocol**: Any contract that needs to react to another contract's events

A contract wants to automatically execute logic when an event fires on a watched contract — without any off-chain component.

**Subscription setup**
- `channel`: OnChain
- StellarNotify re-emits the matched event as a Soroban event

**Result**: Your consumer contract listens for the re-emitted event and executes its logic atomically, creating composable on-chain automation with no trusted backend required.

---

## Building Your Own Integration

Any Soroban contract that emits events can be watched. See the [Integration Guide](./integration-guide) for the step-by-step setup, and the [Contract Reference](./contract/overview) for the full `subscribe()` parameter list.
