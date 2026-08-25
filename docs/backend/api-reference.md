---
id: api-reference
title: API Reference
sidebar_position: 4
---

# API Reference

The backend exposes a REST API on `PORT` (default `3001`). Write endpoints require an `Authorization: Bearer <API_SECRET>` header.

## Subscriptions

### `GET /subscriptions`

Returns all subscriptions for a given owner.

**Query params**: `owner=GAAAA...`

```json
[
  {
    "id": 1,
    "owner": "GAAAA...",
    "watched_contract": "CAAAA...",
    "topics": ["transfer"],
    "channel": "Webhook",
    "status": "active",
    "ttl_ledgers": 100000
  }
]
```

### `POST /subscriptions/endpoint`

Registers the actual webhook URL for a subscription (the on-chain record only stores the SHA-256 hash).

**Auth**: required

```json
{
  "subscription_id": 1,
  "endpoint_url": "https://yourapp.example.com/notify"
}
```

## Notifications

### `GET /notifications`

Returns notification history for an owner.

**Query params**: `owner=GAAAA...`, `status=delivered|failed|pending`, `limit=50`

```json
[
  {
    "id": "uuid",
    "subscription_id": 1,
    "contract": "CAAAA...",
    "ledger": 12345678,
    "status": "delivered",
    "delivered_at": "2026-01-01T00:00:00Z"
  }
]
```

## Server-Sent Events

### `GET /sse/:owner`

Opens an SSE stream for real-time in-app notifications.

```
event: notification
data: {"subscription_id":1,"contract":"CAAAA...","topics":["transfer"],"data":{}}
```

The connection stays open. The frontend reconnects automatically on disconnect.

## Health

### `GET /health`

Returns `{ "status": "ok" }` with HTTP 200 when the service is running and database connection is healthy.
