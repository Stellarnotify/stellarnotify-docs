---
id: event-ingester
title: Event Ingester
sidebar_position: 2
---

# Event Ingester

The event ingester is the core polling loop. It continuously reads new events from the Stellar RPC and matches them against active subscriptions stored in PostgreSQL.

## How It Works

1. On startup, reads the last processed ledger sequence from the `cursor` table in PostgreSQL.
2. Calls `getEvents` with a filter for all contracts that have at least one active subscription.
3. For each returned event, queries subscriptions where `watched_contract` matches and `topics` overlap.
4. Writes matched events as `pending` notification records to PostgreSQL.
5. Advances the cursor and waits 6 seconds before the next poll.

## Cursor Persistence

The cursor ensures no events are missed across restarts. If the cursor falls behind by more than 7 days (the RPC retention window), the ingester logs a warning and attempts to catch up as quickly as possible.

```
cursor table
┌──────────────────────┬──────────┐
│ last_ledger_sequence │ 12345678 │
└──────────────────────┴──────────┘
```

## Topic Matching

Subscriptions can specify topic filters. An empty `topics` array matches all events from the watched contract. Otherwise, at least one topic in the event must match a topic in the subscription filter.

## Failure Handling

- RPC errors are retried with exponential back-off up to 5 times before the ingester pauses and alerts via log.
- Individual event processing errors are logged and skipped — they do not stop the loop.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `POLL_INTERVAL_MS` | `6000` | Milliseconds between RPC polls |
| `STELLAR_RPC_URL` | — | Stellar RPC endpoint |
| `NOTIFY_CONTRACT_ID` | — | Registry contract address to read subscriptions from |
