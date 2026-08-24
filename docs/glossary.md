---
id: glossary
title: Glossary
sidebar_position: 18
---

# Glossary

Key terms used throughout the StellarNotify documentation.

---

### Channel

The delivery method for a notification. StellarNotify supports three channels:

- **Webhook** — HTTP POST to a registered HTTPS endpoint
- **InApp** — Server-Sent Events stream to a connected browser client
- **OnChain** — Re-emits a Soroban event on the Stellar network

Specified as the `channel` parameter when calling `subscribe()`.

---

### Cursor

A pointer to the last ledger sequence processed by the event ingester. Persisted in PostgreSQL so the ingester resumes from the correct position after a restart. If the cursor falls more than 7 days behind the chain tip, events in that gap may be unreachable via the Stellar RPC.

---

### endpoint_ref

A SHA-256 hash of a subscriber's webhook URL, stored on-chain in the Soroban registry contract. The actual URL is never stored on-chain — only this 32-byte hash. The backend verifies `sha256(submitted_url) == endpoint_ref` before storing the real URL. See [Endpoint Privacy](./endpoint-privacy).

---

### Ingest / Ingester

The background process that polls the Stellar RPC `getEvents` endpoint, matches returned events against active subscriptions, and writes matched events as `pending` notification records to PostgreSQL. Runs on a configurable interval (default: 6 seconds).

---

### NotifyError

The Soroban `contracterror` enum that defines all error conditions the StellarNotify contract can return. Errors are returned as structured values rather than panics. See [Error Codes](./contract/errors) for the full list.

---

### Registry Contract

The Soroban smart contract that stores all subscription data on-chain. It is the single source of truth for subscription ownership, topic filters, channel types, and TTLs. The backend reads from it; the frontend writes to it via signed wallet transactions.

---

### Subscription

An on-chain record created by calling `subscribe()` that instructs StellarNotify to watch a specific contract for specific events and deliver notifications to a specific channel. Each subscription has an owner, a `watched_contract`, optional `topics` filters, a `channel`, an `endpoint_ref`, and a TTL.

---

### Topic Filter

An array of strings passed to `subscribe()` that narrows which events trigger a notification. An empty array matches all events from the watched contract. A non-empty array matches events where at least one topic in the event matches a topic in the filter.

---

### TTL (Time-to-Live)

The number of ledgers a subscription remains active, measured from the ledger it was created on. After the TTL expires, the subscription's Soroban storage entry expires and the backend stops dispatching notifications for it. Specified as `ttl_ledgers` in `subscribe()`. A value of `0` uses the protocol's configured `max_ttl`.

---

### Watched Contract

The Soroban contract address whose events a subscription monitors. Any deployed Soroban contract can be a watched contract — StellarNotify is not limited to its own contracts.

---

### Webhook

An HTTP POST request sent by the StellarNotify backend to a subscriber's registered HTTPS endpoint when a matched event is detected. The payload is JSON and includes a `X-StellarNotify-Signature` HMAC-SHA256 header for verification. See [Webhook Dispatcher](./backend/webhook-dispatcher).
