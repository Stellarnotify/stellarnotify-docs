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

## Signature Algorithm

StellarNotify signs every webhook delivery using HMAC-SHA256 to ensure the request originated from the dispatcher and hasn't been tampered with.

### How It Works

1. **The dispatcher** computes `HMAC-SHA256(request_body, API_SECRET)` and converts the result to a hexadecimal string.
2. **The signature** is sent in the `X-StellarNotify-Signature` header.
3. **Your endpoint** must compute the same HMAC on the received body and compare it with the header value using a constant-time comparison function to prevent timing attacks.

### Headers Sent

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-StellarNotify-Signature` | `<hex-encoded-hmac-sha256>` |
| `X-StellarNotify-Timestamp` | `<unix-timestamp-seconds>` |

### Security Best Practices

- **Always verify the signature** before processing the webhook payload.
- **Use constant-time comparison** to prevent timing attacks (e.g., `crypto.timingSafeEqual` in Node.js).
- **Check timestamp freshness** to reject replayed requests (reject if older than 5 minutes).
- **Store your API_SECRET securely** — use environment variables, never commit to version control.

## Verifying the Signature

Below are examples in multiple languages showing how to verify webhook signatures securely.

### TypeScript / Node.js

```typescript
import crypto from "crypto";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Express.js webhook endpoint example
import express from "express";
const app = express();

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-stellarnotify-signature"] as string;
  const timestamp = req.headers["x-stellarnotify-timestamp"] as string;
  const secret = process.env.API_SECRET!;

  // Check timestamp freshness (reject older than 5 minutes)
  const age = Date.now() / 1000 - parseInt(timestamp);
  if (age > 300) {
    return res.status(400).json({ error: "Request too old" });
  }

  // Verify signature
  const body = req.body.toString("utf8");
  if (!verifySignature(body, signature, secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process webhook
  const payload = JSON.parse(body);
  console.log("Valid webhook received:", payload.notification_id);
  res.status(200).json({ received: true });
});
```

#### Test Examples (TypeScript)

```typescript
import { describe, it, expect } from "vitest";

describe("Webhook Signature Verification", () => {
  const secret = "test-secret-key";
  const body = JSON.stringify({ notification_id: "abc-123", subscription_id: 42 });

  it("should accept valid signature", () => {
    const validSig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifySignature(body, validSig, secret)).toBe(true);
  });

  it("should reject invalid signature", () => {
    const invalidSig = "0".repeat(64);
    expect(verifySignature(body, invalidSig, secret)).toBe(false);
  });

  it("should reject signature with wrong secret", () => {
    const wrongSig = crypto.createHmac("sha256", "wrong-secret").update(body).digest("hex");
    expect(verifySignature(body, wrongSig, secret)).toBe(false);
  });

  it("should reject signature for modified body", () => {
    const validSig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const modifiedBody = body.replace("42", "99");
    expect(verifySignature(modifiedBody, validSig, secret)).toBe(false);
  });
});
```

### Python

```python
import hmac
import hashlib
import time
from flask import Flask, request, jsonify

app = Flask(__name__)
API_SECRET = "your-api-secret"

def verify_signature(body: bytes, signature: str, secret: str) -> bool:
    """Verify HMAC-SHA256 signature using constant-time comparison."""
    expected = hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("X-StellarNotify-Signature")
    timestamp = request.headers.get("X-StellarNotify-Timestamp")
    
    if not signature or not timestamp:
        return jsonify({"error": "Missing signature headers"}), 400
    
    # Check timestamp freshness (reject older than 5 minutes)
    age = time.time() - int(timestamp)
    if age > 300:
        return jsonify({"error": "Request too old"}), 400
    
    # Verify signature
    body = request.get_data()
    if not verify_signature(body, signature, API_SECRET):
        return jsonify({"error": "Invalid signature"}), 401
    
    # Process webhook
    payload = request.get_json()
    print(f"Valid webhook received: {payload['notification_id']}")
    return jsonify({"received": True}), 200

if __name__ == "__main__":
    app.run(port=8080)
```

#### Test Examples (Python)

```python
import unittest
import json

class TestWebhookSignature(unittest.TestCase):
    def setUp(self):
        self.secret = "test-secret-key"
        self.body = json.dumps({"notification_id": "abc-123", "subscription_id": 42}).encode()
    
    def test_valid_signature(self):
        valid_sig = hmac.new(
            self.secret.encode("utf-8"),
            self.body,
            hashlib.sha256
        ).hexdigest()
        self.assertTrue(verify_signature(self.body, valid_sig, self.secret))
    
    def test_invalid_signature(self):
        invalid_sig = "0" * 64
        self.assertFalse(verify_signature(self.body, invalid_sig, self.secret))
    
    def test_wrong_secret(self):
        wrong_sig = hmac.new(
            b"wrong-secret",
            self.body,
            hashlib.sha256
        ).hexdigest()
        self.assertFalse(verify_signature(self.body, wrong_sig, self.secret))
    
    def test_modified_body(self):
        valid_sig = hmac.new(
            self.secret.encode("utf-8"),
            self.body,
            hashlib.sha256
        ).hexdigest()
        modified_body = self.body.replace(b"42", b"99")
        self.assertFalse(verify_signature(modified_body, valid_sig, self.secret))

if __name__ == "__main__":
    unittest.main()
```

### Rust

```rust
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

fn verify_signature(body: &[u8], signature: &str, secret: &str) -> bool {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(body);
    
    let expected = hex::encode(mac.finalize().into_bytes());
    
    // Constant-time comparison
    use subtle::ConstantTimeEq;
    expected.as_bytes().ct_eq(signature.as_bytes()).into()
}

async fn webhook_handler(req: HttpRequest, body: web::Bytes) -> HttpResponse {
    let signature = match req.headers().get("X-StellarNotify-Signature") {
        Some(s) => s.to_str().unwrap_or(""),
        None => return HttpResponse::BadRequest().json("Missing signature header"),
    };
    
    let timestamp = match req.headers().get("X-StellarNotify-Timestamp") {
        Some(t) => t.to_str().unwrap_or("0").parse::<u64>().unwrap_or(0),
        None => return HttpResponse::BadRequest().json("Missing timestamp header"),
    };
    
    // Check timestamp freshness (reject older than 5 minutes)
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    if now - timestamp > 300 {
        return HttpResponse::BadRequest().json("Request too old");
    }
    
    // Verify signature
    let secret = std::env::var("API_SECRET").expect("API_SECRET must be set");
    if !verify_signature(&body, signature, &secret) {
        return HttpResponse::Unauthorized().json("Invalid signature");
    }
    
    // Process webhook
    let payload: Value = serde_json::from_slice(&body).unwrap();
    println!("Valid webhook received: {}", payload["notification_id"]);
    HttpResponse::Ok().json(serde_json::json!({"received": true}))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/webhook", web::post().to(webhook_handler))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

#### Test Examples (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_signature() {
        let secret = "test-secret-key";
        let body = r#"{"notification_id":"abc-123","subscription_id":42}"#;
        
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(body.as_bytes());
        let valid_sig = hex::encode(mac.finalize().into_bytes());
        
        assert!(verify_signature(body.as_bytes(), &valid_sig, secret));
    }

    #[test]
    fn test_invalid_signature() {
        let secret = "test-secret-key";
        let body = r#"{"notification_id":"abc-123","subscription_id":42}"#;
        let invalid_sig = "0".repeat(64);
        
        assert!(!verify_signature(body.as_bytes(), &invalid_sig, secret));
    }

    #[test]
    fn test_wrong_secret() {
        let secret = "test-secret-key";
        let body = r#"{"notification_id":"abc-123","subscription_id":42}"#;
        
        let mut mac = HmacSha256::new_from_slice(b"wrong-secret").unwrap();
        mac.update(body.as_bytes());
        let wrong_sig = hex::encode(mac.finalize().into_bytes());
        
        assert!(!verify_signature(body.as_bytes(), &wrong_sig, secret));
    }

    #[test]
    fn test_modified_body() {
        let secret = "test-secret-key";
        let body = r#"{"notification_id":"abc-123","subscription_id":42}"#;
        
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(body.as_bytes());
        let valid_sig = hex::encode(mac.finalize().into_bytes());
        
        let modified_body = r#"{"notification_id":"abc-123","subscription_id":99}"#;
        assert!(!verify_signature(modified_body.as_bytes(), &valid_sig, secret));
    }
}
```
