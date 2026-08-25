---
id: backend-overview
title: Backend Overview
sidebar_position: 1
---

# Backend Overview

The StellarNotify backend is a Node.js/TypeScript service responsible for ingesting Soroban events, matching them against on-chain subscriptions, and dispatching notifications to subscribers.

## Responsibilities

| Component | Role |
|---|---|
| **Event Ingester** | Polls the Stellar RPC `getEvents` endpoint and persists events beyond the 7-day window |
| **Webhook Dispatcher** | Delivers HTTP POST notifications with retry and exponential back-off |
| **SSE Server** | Streams in-app notifications to browser clients via Server-Sent Events |
| **On-Chain Re-emitter** | Submits re-emit transactions back to Stellar for on-chain channel subscribers |
| **REST API** | Exposes subscription management and notification history endpoints |

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ (subscriptions mirror, notification records, cursor)
- **Cache / Pub-Sub**: Redis 7+
- **HTTP**: Express
- **Stellar SDK**: `@stellar/stellar-sdk`

## Configuration

All configuration is provided via environment variables. Copy `.env.example` to `.env` and fill in the values:

```bash
# Stellar
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NOTIFY_CONTRACT_ID=C...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stellarnotify

# Redis
REDIS_URL=redis://localhost:6379

# API
API_SECRET=replace-me
PORT=3001
```

## See Also

- [Event Ingester](./event-ingester)
- [Webhook Dispatcher](./webhook-dispatcher)
- [API Reference](./api-reference)
- [Self-Hosting](./self-hosting)
