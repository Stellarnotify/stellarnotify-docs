---
id: security
title: Security Model
---

# Security Model

## On-Chain

- **Owner authentication** — Every mutating function calls `owner.require_auth()`. Only the subscription owner can cancel, pause, or resume their subscriptions.
- **Admin authentication** — Config changes and pausing require `admin.require_auth()`. Admin can be transferred but not bypassed.
- **No fund custody** — The contract holds no tokens. It is a pure registry.
- **Rate limiting** — `max_per_owner` limits how many subscriptions one address can create, preventing registry spam.

## Endpoint Privacy

Webhook URLs are **never stored on-chain**. Only a SHA-256 hash (`endpoint_ref`) is stored in the Soroban contract. The actual URL is registered separately with the backend via an authenticated API call. This means:

- On-chain observers cannot discover your webhook URL
- Rotating your URL requires only an API call — no on-chain transaction

## Backend

- The API key (`API_SECRET`) protects write endpoints. Replace with wallet-signature verification for production.
- Webhook delivery uses HTTPS only (no HTTP URLs accepted).
- Notification records are linked to subscriptions via foreign key — deleting a subscription cascades and removes its notifications.

## Responsible Disclosure

If you discover a security vulnerability, please email `security@stellarnotify.dev` rather than opening a public issue.
