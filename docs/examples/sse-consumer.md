---
id: examples-sse-consumer
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

## React Version

For a React implementation using `useEffect` and TanStack Query, see [SSE / Real-time Feed](../frontend/sse).
