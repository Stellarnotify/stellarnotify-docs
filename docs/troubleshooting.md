---
id: troubleshooting
title: Troubleshooting
sidebar_position: 22
---

# Troubleshooting

Common issues and their solutions.

---

## Contract Errors

### `AlreadyInitialised`

**Cause**: You called `initialise()` a second time.

**Solution**: The contract can only be initialised once. If you need to change config, use `update_config()` instead.

---

### `LimitReached`

**Cause**: The subscription owner has reached the `max_per_owner` limit.

**Solution**: Cancel unused subscriptions with `cancel()`, or ask the admin to increase `max_per_owner` via `update_config()`.

---

### `TtlTooLong`

**Cause**: The requested `ttl_ledgers` exceeds the protocol's `max_ttl`.

**Solution**: Pass a lower value for `ttl_ledgers`, or pass `0` to use the protocol's default max.

---

### `Unauthorised`

**Cause**: The caller is not the owner of the subscription or not the admin.

**Solution**: Ensure the transaction is signed by the correct address. Check that `owner.require_auth()` is satisfied.

---

## Backend Issues

### Ingester is falling behind (cursor lag > 1 hour)

**Symptoms**: Backend logs show `cursor_lag_seconds` metric increasing.

**Cause**: The RPC endpoint is slow, or the backend cannot keep up with the event volume.

**Solution**:
1. Check your RPC endpoint latency: `curl -w "@%{time_total}s" $STELLAR_RPC_URL`
2. Switch to a faster RPC provider if latency is high
3. Increase `POLL_INTERVAL_MS` to reduce RPC load (default 6000ms)
4. Scale the backend horizontally (run multiple ingester instances with a shared cursor lock)

---

### Webhook deliveries timing out

**Symptoms**: Notifications stuck in `pending` status, logs show `ECONNREFUSED` or `ETIMEDOUT`.

**Cause**: Your webhook endpoint is unreachable or responding too slowly.

**Solution**:
1. Check your endpoint is publicly accessible: `curl -X POST https://yourapp.example.com/notify`
2. Ensure your server responds within 10 seconds (webhook timeout)
3. If processing is slow, respond `200 OK` immediately and queue the work asynchronously
4. Check firewall rules allow inbound HTTPS traffic

---

### `Invalid signature` errors on webhook receiver

**Cause**: The `STELLARNOTIFY_SECRET` on your receiver does not match the backend's `API_SECRET`.

**Solution**: Ensure both values are identical. The signature is computed as `HMAC-SHA256(request_body, API_SECRET)`.

---

### SSE stream not receiving events

**Symptoms**: Frontend SSE connection is open but no `notification` events arrive.

**Cause**: Redis pub/sub is not working, or the owner address is incorrect.

**Solution**:
1. Verify Redis is running: `redis-cli ping` should return `PONG`
2. Check the frontend is passing the correct owner public key to `/sse/:owner`
3. Confirm the subscription's `channel` is set to `InApp`, not `Webhook` or `OnChain`

---

## Frontend Issues

### Freighter wallet not detected

**Symptoms**: Frontend shows "Freighter not installed" even though the extension is active.

**Cause**: The extension API is not available when the page loads.

**Solution**:
1. Reload the page
2. Ensure Freighter extension is enabled in your browser settings
3. Check browser console for errors related to `window.freighter`

---

### Transaction simulation fails

**Symptoms**: `simulateTransaction` returns an error before signing.

**Cause**: Contract parameters are incorrect, or the contract is paused.

**Solution**:
1. Check contract status: call `get_config()` and verify `paused: false`
2. Validate all parameters match the contract's expected types (Address, Vec, u32, etc.)
3. Ensure your account has enough XLM to cover fees and rent

---

### Network mismatch error

**Symptoms**: Freighter prompts to switch networks.

**Cause**: Your frontend's `NEXT_PUBLIC_STELLAR_NETWORK` does not match Freighter's active network.

**Solution**: Switch Freighter to testnet or mainnet to match your frontend config, or rebuild the frontend with the correct network setting.

---

## Build Issues

### Docusaurus build fails with "Broken link" error

**Cause**: A doc file references another doc that doesn't exist, or a sidebar entry points to a missing `id`.

**Solution**:
1. Run `npm run build` to see which link is broken
2. Verify all `id` values in frontmatter match sidebar references
3. Check all internal links use valid paths (e.g., `./contract/overview`, not `./contract/overview.md`)

---

### Contract build fails with `wasm32-unknown-unknown` target not found

**Cause**: Rust WASM target is not installed.

**Solution**:
```bash
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
```

---

## Database Issues

### Migration fails with "relation already exists"

**Cause**: The migration was partially applied before failing.

**Solution**:
1. Drop the database and recreate it (testnet only):
   ```bash
   dropdb stellarnotify
   createdb stellarnotify
   psql $DATABASE_URL < src/db/migrations/001_initial.sql
   ```
2. For production, write a rollback script or manually reconcile schema state

---

## Still Stuck?

If your issue isn't covered here:
- Check the [Support](./support) page for community channels
- Open an issue on [GitHub](https://github.com/yourusername/stellarnotify-contract/issues) with full error logs and reproduction steps
