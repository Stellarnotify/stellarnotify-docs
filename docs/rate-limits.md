---
id: rate-limits
title: Rate Limits & Quotas
sidebar_position: 8
---

# Rate Limits & Quotas

StellarNotify enforces rate limits to ensure fair resource distribution and system stability. This page documents all rate limits, headers, and best practices for handling throttling.

## Rate Limit Overview

| Resource | Limit | Window | Scope |
|----------|-------|--------|-------|
| API requests | 100 requests | 1 minute | Per API key |
| SSE connections | 10 concurrent | - | Per owner address |
| Webhook deliveries | 1000 deliveries | 1 hour | Per subscription |
| Subscription creation | 20 subscriptions | 1 hour | Per owner address |
| Endpoint registration | 50 requests | 1 hour | Per API key |

## Endpoint-Specific Limits

### Subscriptions

#### `GET /subscriptions`
- **Limit**: 60 requests per minute
- **Scope**: Per API key
- **Use case**: Fetch subscription list for a given owner

#### `POST /subscriptions/endpoint`
- **Limit**: 20 requests per hour
- **Scope**: Per API key
- **Use case**: Register webhook endpoint for a subscription

**Note**: Subscription creation on-chain is limited by Stellar network fees and transaction throughput, not by StellarNotify.

### Notifications

#### `GET /notifications`
- **Limit**: 100 requests per minute
- **Scope**: Per owner address
- **Use case**: Query notification history

### SSE Stream

#### `GET /sse/:owner`
- **Limit**: 10 concurrent connections per owner
- **Scope**: Per owner address
- **Behavior**: New connections exceeding the limit will receive `429 Too Many Requests`

**Best practice**: Reuse a single SSE connection across browser tabs using a SharedWorker or BroadcastChannel API.

### Webhook Deliveries

- **Limit**: 1000 deliveries per subscription per hour
- **Behavior**: Exceeding this limit will cause notifications to be queued and delivered in the next window
- **Bypass**: Contact support for higher limits if you have legitimate high-volume use cases

## Rate Limit Headers

Every API response includes headers indicating your current rate limit status:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed in the window | `100` |
| `X-RateLimit-Remaining` | Requests remaining in current window | `87` |
| `X-RateLimit-Reset` | Unix timestamp when the window resets | `1704153600` |
| `Retry-After` | Seconds to wait before retrying (on 429 only) | `42` |

### Example Response Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704153600
Content-Type: application/json
```

### When Rate Limited (429 Response)

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704153600
Retry-After: 42
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "retry_after_seconds": 42
}
```

## Handling Rate Limits

### Reading Rate Limit Headers

Always check rate limit headers to avoid hitting limits:

```typescript
async function fetchWithRateLimit(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  const limit = parseInt(response.headers.get("X-RateLimit-Limit") || "0");
  const remaining = parseInt(response.headers.get("X-RateLimit-Remaining") || "0");
  const reset = parseInt(response.headers.get("X-RateLimit-Reset") || "0");
  
  console.log(`Rate limit: ${remaining}/${limit} remaining`);
  console.log(`Resets at: ${new Date(reset * 1000).toLocaleString()}`);
  
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
    throw new RateLimitError(`Rate limited. Retry after ${retryAfter}s`, retryAfter);
  }
  
  return response;
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
  }
}
```

### Respecting Retry-After

When you receive a `429` response, always respect the `Retry-After` header:

```typescript
async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchWithRateLimit(url, options);
    } catch (error) {
      if (error instanceof RateLimitError && attempt < maxRetries - 1) {
        console.log(`Rate limited, waiting ${error.retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

## Quota Management

### Monitoring Your Usage

Check your current usage via the API:

```bash
curl -H "Authorization: Bearer YOUR_API_SECRET" \
  https://your-backend.example.com/quota
```

Response:

```json
{
  "owner": "GAAA...",
  "api_requests": {
    "used": 87,
    "limit": 100,
    "window_reset": "2026-01-01T12:35:00Z"
  },
  "sse_connections": {
    "active": 3,
    "limit": 10
  },
  "subscriptions": {
    "count": 5,
    "limit": 20
  }
}
```

### Increasing Limits

If your application requires higher limits:

1. Review your usage patterns to ensure efficiency
2. Implement caching and request batching where possible
3. Contact support with your use case details
4. Consider self-hosting for unlimited control (see [Self-Hosting Guide](./backend/self-hosting))

## Best Practices

### ✅ Do

- **Monitor rate limit headers** and adjust request frequency dynamically
- **Implement exponential backoff** when receiving 429 responses
- **Cache responses** when data doesn't change frequently
- **Batch operations** when possible (e.g., query multiple notifications in one request)
- **Reuse SSE connections** across browser tabs
- **Respect Retry-After** headers explicitly

### ❌ Don't

- **Ignore 429 responses** and retry immediately
- **Poll aggressively** when you can use SSE for real-time updates
- **Create multiple SSE connections** for the same owner
- **Hardcode retry delays** without reading Retry-After
- **Request data you already have cached**

## Error Handling Example

Complete example with exponential backoff and rate limit handling:

```typescript
class StellarNotifyClient {
  private baseUrl: string;
  private apiSecret: string;
  
  constructor(baseUrl: string, apiSecret: string) {
    this.baseUrl = baseUrl;
    this.apiSecret = apiSecret;
  }
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.apiSecret}`,
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    let attempt = 0;
    let delay = 1000; // Start with 1 second
    
    while (attempt < 5) {
      try {
        const response = await fetch(url, { ...options, headers });
        
        // Log rate limit status
        const remaining = response.headers.get("X-RateLimit-Remaining");
        if (remaining && parseInt(remaining) < 10) {
          console.warn(`Rate limit nearly exhausted: ${remaining} requests remaining`);
        }
        
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || String(delay / 1000));
          console.warn(`Rate limited. Waiting ${retryAfter}s...`);
          await this.sleep(retryAfter * 1000);
          attempt++;
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
      } catch (error) {
        if (attempt === 4) throw error; // Last attempt, give up
        
        console.warn(`Request failed (attempt ${attempt + 1}/5), retrying in ${delay}ms...`);
        await this.sleep(delay);
        delay = Math.min(delay * 2, 30000); // Exponential backoff, cap at 30s
        attempt++;
      }
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const client = new StellarNotifyClient(
  "https://your-backend.example.com",
  process.env.API_SECRET!
);

const subscriptions = await client.request("/subscriptions?owner=GAAA...");
```

## Self-Hosting

When self-hosting StellarNotify, you have full control over rate limits. Configure them in your environment:

```bash
# .env
RATE_LIMIT_API_REQUESTS_PER_MINUTE=200
RATE_LIMIT_SSE_CONNECTIONS_PER_OWNER=20
RATE_LIMIT_WEBHOOK_DELIVERIES_PER_HOUR=5000
```

See the [Self-Hosting Guide](./backend/self-hosting) for more details.

## Advanced Backoff Strategies

### Exponential Backoff with Jitter

Adding random jitter prevents thundering herd problems when many clients retry simultaneously:

```typescript
class ExponentialBackoff {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  
  constructor(maxAttempts = 5, baseDelay = 1000, maxDelay = 30000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.attempt < this.maxAttempts) {
      try {
        const result = await fn();
        this.reset();
        return result;
      } catch (error) {
        this.attempt++;
        
        if (this.attempt >= this.maxAttempts) {
          throw new Error(`Failed after ${this.maxAttempts} attempts: ${error}`);
        }
        
        const delay = this.calculateDelay();
        console.log(`Attempt ${this.attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw new Error("Unreachable");
  }
  
  private calculateDelay(): number {
    // Exponential: baseDelay * 2^attempt
    const exponential = this.baseDelay * Math.pow(2, this.attempt - 1);
    
    // Cap at maxDelay
    const capped = Math.min(exponential, this.maxDelay);
    
    // Add jitter: ±25% random variance
    const jitter = capped * 0.25 * (Math.random() * 2 - 1);
    
    return Math.floor(capped + jitter);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private reset(): void {
    this.attempt = 0;
  }
}

// Usage
const backoff = new ExponentialBackoff(5, 1000, 30000);

const data = await backoff.execute(async () => {
  const response = await fetch("https://api.example.com/data");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
});
```

### Adaptive Rate Limiting

Dynamically adjust request rate based on rate limit headers:

```typescript
class AdaptiveRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsRemaining = 100;
  private limitPerWindow = 100;
  private resetTime = Date.now() + 60000;
  private minInterval = 600; // Start with 600ms between requests (100/min)
  
  async request<T>(fn: () => Promise<Response>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const response = await fn();
          this.updateLimits(response.headers);
          
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
            console.warn(`Rate limited, waiting ${retryAfter}s`);
            await this.sleep(retryAfter * 1000);
            // Retry the request
            return this.request(fn);
          }
          
          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Check if we need to wait for window reset
      if (this.requestsRemaining === 0) {
        const waitTime = this.resetTime - Date.now();
        if (waitTime > 0) {
          console.log(`Rate limit exhausted, waiting ${waitTime}ms for reset`);
          await this.sleep(waitTime);
        }
      }
      
      const task = this.queue.shift();
      if (task) {
        await task();
        this.requestsRemaining--;
        
        // Adaptive delay: slow down as we approach the limit
        const utilizationRatio = 1 - (this.requestsRemaining / this.limitPerWindow);
        const adaptiveInterval = this.minInterval * (1 + utilizationRatio * 2);
        
        await this.sleep(adaptiveInterval);
      }
    }
    
    this.processing = false;
  }
  
  private updateLimits(headers: Headers) {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");
    
    if (limit) this.limitPerWindow = parseInt(limit);
    if (remaining) this.requestsRemaining = parseInt(remaining);
    if (reset) this.resetTime = parseInt(reset) * 1000;
    
    // Update minimum interval based on limit
    this.minInterval = (60 * 1000) / this.limitPerWindow;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const limiter = new AdaptiveRateLimiter();

// All requests automatically respect rate limits
const subscriptions = await limiter.request(() => 
  fetch("https://api.example.com/subscriptions?owner=GAAA...")
);

const notifications = await limiter.request(() =>
  fetch("https://api.example.com/notifications?owner=GAAA...")
);
```

### Circuit Breaker Pattern

Prevent cascading failures by temporarily stopping requests after repeated failures:

```typescript
enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Failing, reject immediately
  HALF_OPEN // Testing if service recovered
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceLastFailure >= this.resetTimeout) {
        console.log("Circuit breaker entering HALF_OPEN state");
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error(
          `Circuit breaker is OPEN. Retry in ${Math.ceil((this.resetTimeout - timeSinceLastFailure) / 1000)}s`
        );
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      console.log("Circuit breaker entering CLOSED state (recovered)");
      this.state = CircuitState.CLOSED;
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      console.error(`Circuit breaker tripped after ${this.failureCount} failures`);
      this.state = CircuitState.OPEN;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

// Usage: Combine with exponential backoff
const breaker = new CircuitBreaker(5, 60000);
const backoff = new ExponentialBackoff(3, 1000, 10000);

async function fetchWithResilience(url: string) {
  return breaker.execute(() =>
    backoff.execute(() =>
      fetch(url).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    )
  );
}

// This will fail fast if the circuit is open
try {
  const data = await fetchWithResilience("https://api.example.com/data");
} catch (error) {
  console.error("Request failed:", error.message);
}
```

### Python Implementation

```python
import time
import random
from typing import Callable, TypeVar, Optional
from enum import Enum

T = TypeVar('T')

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout: int = 60):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
    
    def execute(self, fn: Callable[[], T]) -> T:
        if self.state == CircuitState.OPEN:
            time_since_failure = time.time() - self.last_failure_time
            
            if time_since_failure >= self.reset_timeout:
                print("Circuit breaker entering HALF_OPEN state")
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception(
                    f"Circuit breaker is OPEN. Retry in {int(self.reset_timeout - time_since_failure)}s"
                )
        
        try:
            result = fn()
            self._on_success()
            return result
        except Exception as error:
            self._on_failure()
            raise error
    
    def _on_success(self):
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            print("Circuit breaker entering CLOSED state (recovered)")
            self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            print(f"Circuit breaker tripped after {self.failure_count} failures")
            self.state = CircuitState.OPEN

class ExponentialBackoff:
    def __init__(self, max_attempts: int = 5, base_delay: float = 1.0, max_delay: float = 30.0):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
    
    def execute(self, fn: Callable[[], T]) -> T:
        attempt = 0
        
        while attempt < self.max_attempts:
            try:
                return fn()
            except Exception as error:
                attempt += 1
                
                if attempt >= self.max_attempts:
                    raise Exception(f"Failed after {self.max_attempts} attempts") from error
                
                delay = self._calculate_delay(attempt)
                print(f"Attempt {attempt} failed, retrying in {delay:.2f}s...")
                time.sleep(delay)
        
        raise Exception("Unreachable")
    
    def _calculate_delay(self, attempt: int) -> float:
        exponential = self.base_delay * (2 ** (attempt - 1))
        capped = min(exponential, self.max_delay)
        jitter = capped * 0.25 * (random.random() * 2 - 1)
        return capped + jitter

# Usage
breaker = CircuitBreaker(failure_threshold=5, reset_timeout=60)
backoff = ExponentialBackoff(max_attempts=3, base_delay=1.0, max_delay=10.0)

def fetch_with_resilience(url: str):
    return breaker.execute(
        lambda: backoff.execute(
            lambda: requests.get(url).json()
        )
    )
```

These patterns ensure your application handles rate limits gracefully and recovers automatically from transient failures.
