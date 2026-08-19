---
id: introduction
title: Introduction
sidebar_position: 1
slug: /
---

# StellarNotify

**StellarNotify** is open-source, on-chain event notification infrastructure for the Stellar/Soroban ecosystem.

## The Problem

Stellar's RPC `getEvents` endpoint retains data for **at most 7 days**. Every dapp that needs to react to contract events — escrow funded, vote cast, stream started, loan liquidated — must build and maintain its own polling infrastructure. This is duplicated work across every project in the ecosystem.

## What StellarNotify Does

- Provides a **Soroban smart contract** that acts as a public subscription registry. Any wallet can subscribe to events from any contract, on-chain, without trust in any third party.
- A **backend indexer** ingests events continuously past the 7-day RPC window and routes them to the correct subscribers.
- Delivers notifications via three channels:
  - **Webhook** — HTTP POST to your registered endpoint
  - **In-App** — Server-Sent Events stream for real-time UI updates
  - **On-Chain** — Re-emits a Soroban event so any other contract or listener can react
- A **frontend dashboard** lets any Stellar wallet manage subscriptions and view notification history.

## Who It's For

| User | Use Case |
|---|---|
| **dApp developers** | Get notified when your contract's state changes without running an indexer |
| **Protocol integrators** | React to events from Blend, Trustless Work, FlowFi, and any Soroban contract |
| **End users** | Receive alerts when their escrow is funded, their vote passes, or their stream expires |
| **Ecosystem tools** | Build on top of a shared notification primitive — no reinventing the wheel |

## Design Principles

1. **On-chain truth** — Subscriptions live on-chain. The backend is stateless relative to subscription data.
2. **Self-hostable** — Anyone can run their own StellarNotify backend. MIT licensed.
3. **No vendor lock-in** — The contract works independently of any backend. Read subscription state directly from Soroban.
4. **Minimal trust surface** — Endpoint URLs are stored privately off-chain; only a SHA-256 hash is stored on-chain.
