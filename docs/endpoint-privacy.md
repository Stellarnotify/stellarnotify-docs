---
id: endpoint-privacy
title: Endpoint Privacy
sidebar_position: 14
---

# Endpoint Privacy

This page explains the hash scheme that keeps your webhook URL private while still allowing the on-chain registry to remain trustless and verifiable.

## The Problem

A naive subscription registry would store your full webhook URL on-chain:

```
subscription.endpoint = "https://yourapp.example.com/notify?secret=abc123"
```

This is public. Anyone querying the Soroban contract can read it, enumerate all registered endpoints, and probe or spam them.

## The Solution — Store the Hash, Not the URL

StellarNotify stores only the **SHA-256 hash** of your endpoint URL on-chain:

```
subscription.endpoint_ref = sha256("https://yourapp.example.com/notify?secret=abc123")
                          = "3b4c5d..."  // 32 bytes, hex-encoded
```

The actual URL is registered **off-chain** with the backend via an authenticated API call. The backend verifies that `sha256(submitted_url) == endpoint_ref` before storing it.

```
On-chain (public):   endpoint_ref = sha256(url)   ← safe to expose
Off-chain (private): endpoint_url = "https://..."  ← stored in backend DB only
```

## What This Guarantees

| Property | Result |
|---|---|
| On-chain observers can see your `endpoint_ref` | ✅ hash only — URL not recoverable |
| Backend stores the actual URL | ✅ protected by `API_SECRET` |
| Changing your URL requires a new on-chain tx | ❌ No — just a backend API call |
| Someone can forge a different URL with the same hash | ❌ Not feasible — SHA-256 preimage resistance |

## Computing `endpoint_ref`

### Node.js / TypeScript

```typescript
import { createHash } from "crypto";

function endpointRef(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

const ref = endpointRef("https://yourapp.example.com/notify");
// "3b4c5d6e..." — pass this to subscribe()
```

### Browser

```typescript
async function endpointRef(url: string): Promise<string> {
  const encoded = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

### Bash

```bash
echo -n "https://yourapp.example.com/notify" | sha256sum | awk '{print $1}'
```

## Rotating Your Endpoint URL

If your endpoint URL changes (e.g., you move to a new server or rotate a secret query parameter), you do **not** need to cancel and recreate the subscription on-chain.

1. Compute the SHA-256 hash of the new URL
2. Verify it matches the `endpoint_ref` stored on-chain for your subscription

   — if it doesn't match, you'll need a new on-chain subscription with the updated hash

3. If it matches (e.g., same URL, different server behind it), call the backend API:

```bash
curl -X PUT https://your-stellarnotify-instance.example.com/subscriptions/endpoint \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 42,
    "endpoint_url": "https://new-server.example.com/notify"
  }'
```

## Why Not Encrypt the URL Instead?

Encryption requires a key. A key stored on-chain is visible. A key stored off-chain means you're trusting the backend anyway. The hash scheme avoids the key management problem entirely — the backend doesn't need to decrypt anything, just verify.

## Relationship to the Security Model

The hash scheme is one part of the broader security model. See [Security Model](./security) for authentication, rate limiting, and responsible disclosure.
