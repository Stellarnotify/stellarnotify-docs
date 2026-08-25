---
id: architecture
title: Architecture
sidebar_position: 3
---

# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Stellar Network                          │
│                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │  Any Soroban        │    │  StellarNotify           │   │
│  │  Contract           │───▶│  Registry Contract       │   │
│  │  (watched)          │    │  (subscriptions on-chain)│   │
│  └─────────────────────┘    └──────────┬───────────────┘   │
└────────────────────────────────────────┼────────────────────┘
                                         │
                    ┌────────────────────▼──────────────────┐
                    │         StellarNotify Backend         │
                    │                                       │
                    │  ┌─────────────┐  ┌───────────────┐  │
                    │  │  Event      │  │  Webhook      │  │
                    │  │  Ingester   │  │  Dispatcher   │  │
                    │  └──────┬──────┘  └───────┬───────┘  │
                    │         │                 │           │
                    │  ┌──────▼─────────────────▼───────┐  │
                    │  │     PostgreSQL + Redis          │  │
                    │  └─────────────────────────────────┘  │
                    │                                       │
                    │  ┌─────────────────────────────────┐  │
                    │  │  REST API + SSE endpoints        │  │
                    │  └─────────────────────────────────┘  │
                    └───────────────────────────────────────┘
                                         │
                    ┌────────────────────▼──────────────────┐
                    │        StellarNotify Frontend         │
                    │  Next.js · Freighter · TanStack Query │
                    └───────────────────────────────────────┘
```

## Data Flow

1. **Subscription created** — User signs a `subscribe()` transaction via Freighter. The subscription is stored in the Soroban registry contract (persistent storage).

2. **Event ingestion** — The backend polls `getEvents` from the Stellar RPC on a 6-second interval. All events from watched contracts are matched against active subscriptions.

3. **Notification dispatch** — Matched events are written to PostgreSQL as `pending` notifications, then dispatched:
   - **Webhook**: HTTP POST with retry + exponential back-off
   - **In-App**: Published to Redis pub/sub → SSE stream to browser
   - **On-Chain**: A re-emit transaction is submitted back to Stellar

4. **Frontend** — The dashboard reads subscription data from the backend REST API. The notification feed combines polled data with live SSE updates.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Freighter
    participant Stellar
    participant Backend
    participant PostgreSQL
    participant Redis
    participant Webhook

    Note over User,Webhook: 1. Subscription Creation
    User->>Frontend: Create subscription
    Frontend->>Freighter: Sign subscribe() tx
    Freighter->>Stellar: Submit transaction
    Stellar-->>Frontend: Subscription ID

    Frontend->>Backend: POST /subscriptions/endpoint
    Backend->>PostgreSQL: Store endpoint URL
    Backend-->>Frontend: OK

    Note over User,Webhook: 2. Event Ingestion (continuous loop)
    loop Every 6 seconds
        Backend->>Stellar: getEvents (RPC)
        Stellar-->>Backend: Events from watched contracts
        Backend->>Backend: Match events to subscriptions
        Backend->>PostgreSQL: Write pending notifications
    end

    Note over User,Webhook: 3. Notification Dispatch
    Backend->>PostgreSQL: Read pending notifications
    
    alt Webhook Channel
        Backend->>Webhook: HTTP POST with HMAC signature
        Webhook-->>Backend: 200 OK
        Backend->>PostgreSQL: Mark delivered
    end
    
    alt In-App Channel
        Backend->>Redis: Publish notification
        Redis->>Frontend: SSE stream push
        Frontend->>User: Display alert
    end
    
    alt On-Chain Channel
        Backend->>Stellar: Submit re-emit transaction
        Stellar-->>Backend: Confirmed
    end
```

## Storage

| Layer | What is stored |
|---|---|
| Soroban contract | Subscription definitions, owner/watcher indexes |
| PostgreSQL | Mirror of subscriptions, notification records, cursor |
| Redis | Pub/sub channels for real-time in-app delivery |

## Security Model

See the [Security Model](./security.md) page.
