---
id: frontend-overview
title: Frontend Overview
sidebar_position: 1
---

# Frontend Overview

The StellarNotify frontend is a Next.js application that lets any Stellar wallet manage subscriptions and view notification history — no backend account required.

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Wallet**: Freighter via `@stellar/freighter-api`
- **Data fetching**: TanStack Query
- **Styling**: Tailwind CSS

## Key Pages

| Route | Description |
|---|---|
| `/` | Dashboard — subscription list and notification feed |
| `/subscriptions/new` | Create a new subscription |
| `/subscriptions/[id]` | Subscription detail and management |

## Connecting to the Backend

Set `NEXT_PUBLIC_API_URL` in `.env.local` to point at your backend instance:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NOTIFY_CONTRACT_ID=C...
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

## See Also

- [Wallet Connect](./wallet-connect)
- [SSE / Real-time Feed](./sse)
