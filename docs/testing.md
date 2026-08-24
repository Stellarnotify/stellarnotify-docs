---
id: testing
title: Testing
sidebar_position: 15
---

# Testing

This page covers how to run the test suites for the contract, backend, and frontend.

---

## Contract Tests (Rust)

Contract tests use the Soroban test SDK and run entirely in-process — no live network required.

```bash
cd stellarnotify-contract
cargo test
```

### What's Tested

| Test | Description |
|---|---|
| `test_initialise` | Contract initialises once and rejects a second call |
| `test_subscribe` | Creates a subscription and verifies storage |
| `test_subscribe_limit` | Rejects when `max_per_owner` is reached |
| `test_cancel` | Deletes subscription and cleans indexes |
| `test_pause_resume` | Pauses and resumes delivery state |
| `test_auth_required` | Non-owner cannot cancel or pause |
| `test_admin_config` | Admin can update limits; non-admin cannot |
| `test_transfer_admin` | Admin role transfers correctly |
| `test_paused_protocol` | `subscribe` rejected while protocol is paused |
| `test_ttl_too_long` | Rejects TTL exceeding `max_ttl` |

### Running a Single Test

```bash
cargo test test_subscribe -- --nocapture
```

### Clippy and Formatting

```bash
cargo clippy -- -D warnings
cargo fmt --check
```

---

## Backend Tests (Jest)

```bash
cd stellarnotify-backend
npm install
npm test
```

For a single run without watch mode:

```bash
npm test -- --runInBand
```

### What's Tested

| Suite | Description |
|---|---|
| `ingester.test.ts` | Topic matching logic, cursor advancement, RPC error handling |
| `dispatcher.test.ts` | Retry logic, back-off timing, delivery status updates |
| `api.test.ts` | REST endpoint request/response validation |
| `hash.test.ts` | `endpoint_ref` SHA-256 verification |

### Integration Tests

Integration tests spin up a local PostgreSQL and Redis instance via `testcontainers`. Ensure Docker is running before executing:

```bash
npm run test:integration
```

---

## Frontend Tests

```bash
cd stellarnotify-frontend
npm install
npm test
```

The frontend uses [Vitest](https://vitest.dev/) with React Testing Library.

### What's Tested

- Subscription list renders correctly with mocked API responses
- New subscription form validates inputs before submitting
- SSE hook connects, receives events, and invalidates the query cache
- Wallet connect flow handles Freighter not installed

---

## End-to-End Tests

E2E tests use [Playwright](https://playwright.dev/) against a locally running stack (contract on testnet, backend + frontend running locally).

```bash
cd stellarnotify-frontend
npx playwright test
```

Requires the full stack to be running. See [Quick Start](./quick-start) to get everything up.

---

## CI

All three test suites run automatically on every pull request via GitHub Actions. See the `.github/workflows/ci.yml` file for the full pipeline definition.
