---
id: sse-consumer
title: SSE Consumer (Vanilla JS)
sidebar_position: 4
---

# SSE Consumer — Vanilla JavaScript

This example shows how to consume the StellarNotify real-time notification stream using the browser's native `EventSource` API — no framework required.

## How It Works

The backend exposes `GET /sse/:owner` as a Server-Sent Events stream. The browser opens a persistent HTTP connection and receives events as they are dispatched by the ingester. The browser reconnects automatically if the connection drops.

## Full Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>StellarNotify — Live Feed</title>
  <style>
    body { font-family: monospace; background: #0f0f0f; color: #e2e8f0; padding: 2rem; }
    h1   { color: #a78bfa; }
    #status  { margin-bottom: 1rem; font-size: 0.85rem; color: #64748b; }
    #feed    { list-style: none; padding: 0; }
    #feed li { background: #1e1e2e; border-left: 3px solid #7c3aed;
               margin-bottom: 0.5rem; padding: 0.75rem 1rem; border-radius: 4px; }
    .contract { color: #a78bfa; font-size: 0.8rem; }
    .topics   { color: #94a3b8; font-size: 0.8rem; margin-top: 0.25rem; }
  </style>
</head>
<body>

<h1>🔔 StellarNotify Live Feed</h1>
<p id="status">Connecting…</p>
<ul id="feed"></ul>

<script>
  const BACKEND_URL = "https://your-backend.example.com";
  const OWNER       = "GAAA..."; // Stellar public key of the subscriber

  const statusEl = document.getElementById("status");
  const feedEl   = document.getElementById("feed");

  let reconnectDelay = 1000; // start at 1s, back off on repeated failures

  function connect() {
    const es = new EventSource(`${BACKEND_URL}/sse/${OWNER}`);

    es.addEventListener("open", () => {
      statusEl.textContent = "● Connected — waiting for notifications";
      statusEl.style.color = "#4ade80";
      reconnectDelay = 1000; // reset back-off on successful connect
    });

    es.addEventListener("notification", (event) => {
      const data = JSON.parse(event.data);
      appendNotification(data);
    });

    es.addEventListener("error", () => {
      statusEl.textContent = `⚠ Disconnected — reconnecting in ${reconnectDelay / 1000}s…`;
      statusEl.style.color = "#f87171";
      es.close();

      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000); // cap at 30s
        connect();
      }, reconnectDelay);
    });
  }

  function appendNotification(data) {
    const li = document.createElement("li");

    const time     = new Date(data.timestamp).toLocaleTimeString();
    const contract = data.contract ?? "unknown";
    const topics   = Array.isArray(data.topics) ? data.topics.join(", ") : "";

    li.innerHTML = `
      <strong>${time}</strong> — subscription #${data.subscription_id}
      <div class="contract">${contract}</div>
      <div class="topics">${topics}</div>
    `;

    // Prepend so newest is at the top
    feedEl.prepend(li);

    // Keep the list from growing unbounded
    while (feedEl.children.length > 50) {
      feedEl.removeChild(feedEl.lastChild);
    }
  }

  connect();
</script>
</body>
</html>
```

## Key Points

- **`EventSource` reconnects automatically** when the connection drops — the browser handles this natively. The custom back-off logic above adds an exponential delay on top to avoid hammering the server.
- **No authentication on the SSE endpoint** in this example. In production, scope the stream to a verified wallet by passing a short-lived token as a query parameter and validating it server-side.
- The `notification` event name matches what the backend sends via `event: notification\ndata: {...}`.
- Notifications are prepended so the newest entry appears at the top of the list.

## Reconnection Strategy

When building production SSE consumers, you need robust reconnection logic to handle network issues, server restarts, and temporary outages.

### Exponential Backoff

The example above implements exponential backoff to prevent overwhelming the server during outages:

| Attempt | Delay |
|---------|-------|
| 1st | 1 second |
| 2nd | 2 seconds |
| 3rd | 4 seconds |
| 4th | 8 seconds |
| 5th | 16 seconds |
| 6th+ | 30 seconds (capped) |

This strategy:
- Starts fast for transient issues (network blips)
- Backs off progressively for longer outages
- Caps at 30 seconds to avoid excessive delays
- Resets on successful connection

### Connection Health Monitoring

To detect stale connections before they fail, implement a heartbeat mechanism:

```javascript
let lastHeartbeat = Date.now();
let heartbeatTimeout;

es.addEventListener("heartbeat", () => {
  lastHeartbeat = Date.now();
});

// Check for stale connection every 30 seconds
heartbeatTimeout = setInterval(() => {
  const age = Date.now() - lastHeartbeat;
  if (age > 45000) { // 45 seconds without heartbeat
    console.warn("Stale connection detected, reconnecting...");
    es.close();
    connect();
  }
}, 30000);
```

The backend should send heartbeat events every 30 seconds:

```javascript
// Backend (Express.js)
const interval = setInterval(() => {
  res.write("event: heartbeat\ndata: {}\n\n");
}, 30000);

req.on("close", () => clearInterval(interval));
```

## Common SSE Errors

### Browser-Level Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `EventSource failed` | Network unreachable, DNS failure | Reconnect with exponential backoff |
| `Content-Type not text/event-stream` | Server misconfigured | Fix server `Content-Type` header |
| `CORS error` | Missing CORS headers | Add `Access-Control-Allow-Origin` on server |
| `ERR_BLOCKED_BY_CLIENT` | Ad blocker or extension | Ask user to whitelist your domain |

### Server-Level Errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| `401 Unauthorized` | Invalid or expired token | Re-authenticate user, get fresh token |
| `404 Not Found` | Owner not found or endpoint disabled | Stop reconnecting, show user error |
| `429 Too Many Requests` | Rate limit exceeded | Back off exponentially, respect `Retry-After` header |
| `503 Service Unavailable` | Server overloaded or maintenance | Reconnect with capped backoff |

### Handling Server Errors

```javascript
es.addEventListener("error", (event) => {
  if (event.target.readyState === EventSource.CLOSED) {
    console.error("Connection closed by server");
  }
  
  // Check if we received an HTTP error before connection opened
  if (event.target.readyState === EventSource.CONNECTING && event.status) {
    switch (event.status) {
      case 401:
        statusEl.textContent = "⚠ Authentication failed — please log in again";
        // Don't reconnect, show login UI
        return;
      case 404:
        statusEl.textContent = "⚠ Stream not found — subscription may be inactive";
        return;
      case 429:
        reconnectDelay = 60000; // Wait 1 minute on rate limit
        break;
    }
  }
  
  // Otherwise use standard reconnection logic
  scheduleReconnect();
});
```

## React Version

For a React implementation using `useEffect` and TanStack Query, see [SSE / Real-time Feed](../frontend/sse).

## Best Practices for Production

### Complete Robust SSE Consumer

Here's a production-ready example with all best practices implemented:

```javascript
class RobustSSEConsumer {
  constructor(url, owner, options = {}) {
    this.baseUrl = url;
    this.owner = owner;
    this.options = {
      maxReconnectDelay: 30000,
      initialReconnectDelay: 1000,
      heartbeatTimeout: 45000,
      tokenRefreshCallback: null,
      ...options
    };
    
    this.es = null;
    this.reconnectDelay = this.options.initialReconnectDelay;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.lastHeartbeat = Date.now();
    this.isIntentionallyClosed = false;
    this.listeners = new Map();
  }

  connect(token = null) {
    if (this.es) {
      this.es.close();
    }

    this.isIntentionallyClosed = false;
    const url = token 
      ? `${this.baseUrl}/sse/${this.owner}?token=${token}`
      : `${this.baseUrl}/sse/${this.owner}`;

    this.es = new EventSource(url);
    this.setupEventListeners();
    this.startHeartbeatMonitor();
  }

  setupEventListeners() {
    this.es.addEventListener("open", () => {
      console.log("✓ SSE connected");
      this.reconnectDelay = this.options.initialReconnectDelay;
      this.lastHeartbeat = Date.now();
      this.emit("connected");
    });

    this.es.addEventListener("notification", (event) => {
      const data = JSON.parse(event.data);
      this.emit("notification", data);
    });

    this.es.addEventListener("heartbeat", () => {
      this.lastHeartbeat = Date.now();
    });

    this.es.addEventListener("error", async (event) => {
      console.error("SSE error:", event);
      
      // Handle authentication errors
      if (event.status === 401 && this.options.tokenRefreshCallback) {
        try {
          const newToken = await this.options.tokenRefreshCallback();
          this.connect(newToken);
          return;
        } catch (err) {
          console.error("Token refresh failed:", err);
          this.emit("authError", err);
          return;
        }
      }

      // Handle non-retryable errors
      if (event.status === 404) {
        console.error("Stream endpoint not found");
        this.emit("fatalError", { status: 404, message: "Stream not found" });
        return;
      }

      // Handle rate limiting
      if (event.status === 429) {
        this.reconnectDelay = 60000; // 1 minute
      }

      // Reconnect for retryable errors
      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    });
  }

  startHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      const age = Date.now() - this.lastHeartbeat;
      if (age > this.options.heartbeatTimeout) {
        console.warn("Stale connection detected (no heartbeat), reconnecting...");
        this.es.close();
        this.scheduleReconnect();
      }
    }, 30000);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.emit("reconnecting", { delay: this.reconnectDelay });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.options.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  close() {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    if (this.es) {
      this.es.close();
      this.es = null;
    }
    
    this.emit("closed");
  }
}

// Usage
const consumer = new RobustSSEConsumer(
  "https://api.stellarnotify.com",
  "GAAA...",
  {
    tokenRefreshCallback: async () => {
      const response = await fetch("/api/refresh-token");
      const { token } = await response.json();
      return token;
    }
  }
);

consumer.on("connected", () => {
  console.log("Stream connected");
  statusEl.textContent = "● Connected";
  statusEl.style.color = "#4ade80";
});

consumer.on("notification", (data) => {
  console.log("Notification received:", data);
  appendNotification(data);
});

consumer.on("reconnecting", ({ delay }) => {
  console.log(`Reconnecting in ${delay}ms...`);
  statusEl.textContent = `⚠ Reconnecting in ${delay / 1000}s...`;
  statusEl.style.color = "#f59e0b";
});

consumer.on("authError", () => {
  statusEl.textContent = "⚠ Authentication failed — please log in";
  statusEl.style.color = "#ef4444";
  // Show login modal
});

consumer.on("fatalError", (error) => {
  console.error("Fatal SSE error:", error);
  statusEl.textContent = `⚠ Connection failed: ${error.message}`;
  statusEl.style.color = "#ef4444";
});

// Start connection
consumer.connect();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  consumer.close();
});
```

### TypeScript React Hook Example

```typescript
import { useEffect, useRef, useState } from "react";

interface SSENotification {
  notification_id: string;
  subscription_id: number;
  contract: string;
  topics: string[];
  data: Record<string, any>;
  timestamp: string;
}

interface UseSSEOptions {
  url: string;
  owner: string;
  token?: string;
  onNotification?: (data: SSENotification) => void;
  onError?: (error: Error) => void;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export function useSSE({ url, owner, token, onNotification, onError }: UseSSEOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectIn, setReconnectIn] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isActive = true;

    const connect = () => {
      if (!isActive) return;

      const endpoint = token
        ? `${url}/sse/${owner}?token=${token}`
        : `${url}/sse/${owner}`;

      const es = new EventSource(endpoint);
      esRef.current = es;
      setStatus("connecting");

      es.addEventListener("open", () => {
        if (!isActive) return;
        setStatus("connected");
        reconnectDelayRef.current = 1000;
        setReconnectIn(null);
      });

      es.addEventListener("notification", (event) => {
        if (!isActive) return;
        try {
          const data: SSENotification = JSON.parse(event.data);
          onNotification?.(data);
        } catch (err) {
          console.error("Failed to parse notification:", err);
        }
      });

      es.addEventListener("error", () => {
        if (!isActive) return;
        setStatus("error");
        es.close();

        const delay = reconnectDelayRef.current;
        setReconnectIn(delay);

        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(delay * 2, 30000);
          connect();
        }, delay);

        onError?.(new Error("SSE connection failed"));
      });
    };

    connect();

    return () => {
      isActive = false;
      setStatus("disconnected");
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, [url, owner, token, onNotification, onError]);

  return { status, reconnectIn };
}

// Usage in component
function NotificationFeed() {
  const [notifications, setNotifications] = useState<SSENotification[]>([]);

  const { status, reconnectIn } = useSSE({
    url: "https://api.stellarnotify.com",
    owner: "GAAA...",
    onNotification: (data) => {
      setNotifications(prev => [data, ...prev].slice(0, 50));
    },
    onError: (error) => {
      console.error("SSE error:", error);
    }
  });

  return (
    <div>
      <div className="status">
        {status === "connected" && "● Connected"}
        {status === "connecting" && "Connecting..."}
        {status === "error" && reconnectIn && `Reconnecting in ${reconnectIn / 1000}s...`}
      </div>
      <ul>
        {notifications.map(n => (
          <li key={n.notification_id}>
            {n.contract} — {n.topics.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Connection Timeout Strategy

| Scenario | Strategy | Notes |
|----------|----------|-------|
| Initial connection | 10 second timeout | If no `open` event within 10s, reconnect |
| Reconnection attempts | Exponential backoff | 1s → 2s → 4s → 8s → 16s → 30s (max) |
| Heartbeat missing | 45 second threshold | Close and reconnect if no heartbeat for 45s |
| Rate limit (429) | 60 second delay | Respect `Retry-After` header if present |
| Auth failure (401) | No auto-reconnect | Refresh token, then reconnect manually |
| Not found (404) | No auto-reconnect | Subscription may be inactive |

### Testing Your SSE Consumer

```javascript
// Simulate network failure
setTimeout(() => {
  console.log("Simulating network failure...");
  consumer.close();
  setTimeout(() => consumer.connect(), 2000);
}, 10000);

// Monitor connection stability
let eventCount = 0;
consumer.on("notification", () => {
  eventCount++;
  console.log(`Received ${eventCount} events`);
});

setInterval(() => {
  console.log(`Event rate: ${eventCount} events/min`);
  eventCount = 0;
}, 60000);
```
