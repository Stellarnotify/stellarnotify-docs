---
id: faq
title: FAQ
sidebar_position: 11
---

# Frequently Asked Questions

## 1. Do I need to trust StellarNotify with my webhook URL?

No. Your webhook URL is **never stored on-chain**. Only a SHA-256 hash (`endpoint_ref`) is written to the Soroban registry. The actual URL is registered privately with the backend over an authenticated API call. On-chain observers cannot discover your endpoint.

See [Endpoint Privacy](./endpoint-privacy) for the full scheme.

---

## 2. What happens if my webhook endpoint is down?

The backend retries delivery with exponential back-off across 5 attempts (5 s → 25 s → 2 min → 10 min → 30 min). If all attempts fail the notification is marked `failed` and stored in history. You can inspect failed notifications via `GET /notifications?status=failed`.

---

## 3. Can I run my own StellarNotify backend?

Yes — it is MIT licensed and fully self-hostable. You need Node.js 20+, PostgreSQL 15+, and Redis 7+. A `docker-compose.yml` is included in the backend repo. See [Self-Hosting](./backend/self-hosting).

---

## 4. What is the 7-day RPC window problem?

Stellar's `getEvents` RPC endpoint only retains event data for at most 7 days. Any dapp that needs to replay or react to older events must run its own ingestion infrastructure. StellarNotify's backend ingester persists events continuously past that window so you never lose historical data.

---

## 5. Does StellarNotify hold any funds?

No. The Soroban registry contract is a pure subscription registry — it holds no tokens. There is no fee to subscribe (beyond the normal Stellar transaction fee and storage rent).

---

## 6. What delivery channels are supported?

| Channel | How it works |
|---|---|
| **Webhook** | HTTP POST to your HTTPS endpoint |
| **In-App** | Server-Sent Events stream to your browser frontend |
| **On-Chain** | Re-emits a Soroban event your contract can react to |

Telegram and email delivery are on the [roadmap](./roadmap) for v0.2.

---

## 7. How do topic filters work?

When you call `subscribe()` you pass a `topics` array. An empty array matches **all** events from the watched contract. A non-empty array matches events where at least one topic in the event matches a topic in your filter. Topics are compared as strings.

---

## 8. Can I watch any Soroban contract, not just StellarNotify's own contract?

Yes. You pass any `watched_contract` address to `subscribe()`. StellarNotify's ingester monitors all contracts that have at least one active subscription.

---

## 9. What happens when a subscription's TTL expires?

The subscription's Soroban storage entry expires and is no longer returned by query functions. The backend detects the expiry during its next sync and marks the subscription inactive. No further notifications are dispatched. You can create a new subscription to resume monitoring.

---

## 10. Is there a limit on how many subscriptions I can create?

Yes — the protocol has a `max_per_owner` limit set by the admin at deploy time (default: 20 per wallet address). This prevents registry spam. The limit can be updated by the admin via `update_config()`.
