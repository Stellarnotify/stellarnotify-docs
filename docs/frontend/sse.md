---
id: sse
title: Real-time Feed (SSE)
sidebar_position: 3
---

# Real-time Feed (SSE)

In-app notifications are delivered via [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) over a persistent HTTP connection from the backend. No WebSocket setup is required.

## How It Works

1. The frontend opens a `GET /sse/:owner` connection to the backend when the user's wallet is connected.
2. The backend subscribes to a Redis pub/sub channel keyed by the owner address.
3. When the ingester matches an event for that owner, it publishes to Redis, which pushes it down the SSE stream.
4. The frontend receives the event and updates the notification feed in real time via TanStack Query's cache invalidation.

## React Hook Example

```typescript
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useNotificationStream(owner: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!owner) return;

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/sse/${owner}`
    );

    es.addEventListener("notification", (event) => {
      const notification = JSON.parse(event.data);
      // Append to the cached notifications list
      queryClient.invalidateQueries({ queryKey: ["notifications", owner] });
      console.log("New notification:", notification);
    });

    es.onerror = () => {
      // Browser reconnects automatically after a short delay
    };

    return () => es.close();
  }, [owner, queryClient]);
}
```

## Fallback

If the SSE connection is unavailable (e.g., behind a proxy that buffers responses), the notification feed falls back to polling `GET /notifications` every 30 seconds via TanStack Query's `refetchInterval`.
