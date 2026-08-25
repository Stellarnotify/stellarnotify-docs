---
id: examples-webhook-receiver
title: Webhook Receiver in Express
sidebar_position: 3
---

# Webhook Receiver in Express

This example shows how to receive and verify StellarNotify webhook deliveries in an Express server.

## Install

```bash
npm install express
npm install -D @types/express typescript ts-node
```

## Full Example

```typescript
import express, { Request, Response } from "express";
import crypto from "crypto";

const app  = express();
const PORT = process.env.PORT ?? 3002;

// Must match the API_SECRET configured in your StellarNotify backend
const STELLARNOTIFY_SECRET = process.env.STELLARNOTIFY_SECRET ?? "";

// ─── Signature Verification ───────────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature sent in X-StellarNotify-Signature.
 * Always use crypto.timingSafeEqual to prevent timing attacks.
 */
function verifySignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", STELLARNOTIFY_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    // Buffer lengths differ — signature is invalid
    return false;
  }
}

// ─── Raw body capture ─────────────────────────────────────────────────────────
// We need the raw Buffer to verify the signature, so we capture it before
// express.json() parses the body.

app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ─── Webhook endpoint ─────────────────────────────────────────────────────────

app.post("/notify", (req: Request & { rawBody?: Buffer }, res: Response) => {
  const signature = req.headers["x-stellarnotify-signature"];

  // 1. Reject if signature header is missing
  if (!signature || typeof signature !== "string") {
    console.warn("Missing signature header");
    return res.status(401).json({ error: "Missing signature" });
  }

  // 2. Reject if signature does not match
  if (!verifySignature(req.rawBody ?? Buffer.alloc(0), signature)) {
    console.warn("Invalid signature — possible spoofed request");
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 3. Parse and handle the notification payload
  const notification = req.body as {
    notification_id: string;
    subscription_id: number;
    contract: string;
    ledger: number;
    topics: string[];
    data: Record<string, unknown>;
    timestamp: string;
  };

  console.log("Received notification:", {
    id:       notification.notification_id,
    contract: notification.contract,
    topics:   notification.topics,
    ledger:   notification.ledger,
  });

  // 4. Handle by topic
  const [eventName] = notification.topics;

  switch (eventName) {
    case "transfer":
      handleTransfer(notification);
      break;
    case "escrow_funded":
      handleEscrowFunded(notification);
      break;
    default:
      console.log("Unhandled event:", eventName);
  }

  // 5. Respond 200 to acknowledge delivery.
  //    Any non-2xx response triggers a retry from StellarNotify.
  res.status(200).json({ received: true });
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleTransfer(notification: { data: Record<string, unknown> }) {
  const amount = notification.data["amount"];
  console.log(`Transfer detected — amount: ${amount}`);
  // Add your business logic here
}

function handleEscrowFunded(notification: { data: Record<string, unknown> }) {
  const escrowId = notification.data["escrow_id"];
  console.log(`Escrow funded — id: ${escrowId}`);
  // Add your business logic here
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Webhook receiver listening on port ${PORT}`);
});
```

## Key Points

- **Always verify the signature** before processing a payload. Use `crypto.timingSafeEqual` to avoid timing attacks.
- **Capture the raw body** before JSON parsing — the HMAC is computed over the raw bytes, not the parsed object.
- **Respond with `2xx` immediately** and process asynchronously if your handler is slow. StellarNotify retries on non-2xx responses.
- The `STELLARNOTIFY_SECRET` must match the `API_SECRET` set in your StellarNotify backend `.env`.

## Running the Server

```bash
# Set your secret
export STELLARNOTIFY_SECRET=your-api-secret
export PORT=3002

ts-node webhook-receiver.ts
```

Then register this endpoint with your subscription:

```bash
curl -X POST https://your-backend.example.com/subscriptions/endpoint \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 42,
    "endpoint_url": "https://yourapp.example.com/notify"
  }'
```
