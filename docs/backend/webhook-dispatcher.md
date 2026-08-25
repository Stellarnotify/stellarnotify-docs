---
id: webhook-dispatcher
title: Webhook Dispatcher
sidebar_position: 3
---

# Webhook Dispatcher

The webhook dispatcher reads `pending` notification records from PostgreSQL and delivers them via HTTP POST to the registered endpoint URLs.

## Delivery Flow

```
PostgreSQL (pending)
        │
        ▼
  Dispatcher Loop
        │
        ├─ POST https://your-endpoint.example.com/notify
        │        { event, subscription_id, contract, topics, data }
        │
        ├─ 200 OK  ──▶  mark notification as `delivered`
        │
        └─ Non-2xx / timeout ──▶ retry with exponential back-off
                                  max 5 attempts, then mark `failed`
```

## Request Format

Each webhook delivery is an HTTP POST with `Content-Type: application/json`:

```json
{
  "notification_id": "uuid",
  "subscription_id": 42,
  "contract": "CAAAA...",
  "ledger": 12345678,
  "topics": ["transfer", "GAAAA..."],
  "data": { "amount": "1000000000" },
  "timestamp": "2026-01-01T00:00:00Z"
}
```

## Retry Policy

| Attempt | Delay |
|---|---|
| 1st retry | 5 s |
| 2nd retry | 25 s |
| 3rd retry | 2 min |
| 4th retry | 10 min |
| 5th retry | 30 min |

After 5 failed attempts the notification is marked `failed` and no further retries are attempted.

## Security

- Only HTTPS endpoints are accepted. Plain HTTP URLs are rejected at registration time.
- Deliveries include a `X-StellarNotify-Signature` header (HMAC-SHA256 of the request body, keyed by `API_SECRET`) so your endpoint can verify authenticity.

## Verifying the Signature

```typescript
import crypto from "crypto";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```
