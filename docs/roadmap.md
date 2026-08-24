---
id: roadmap
title: Roadmap
sidebar_position: 12
---

# Roadmap

## v0.1.0 — Current Release

The initial release establishes the core notification primitive.

- Soroban registry contract (subscribe, cancel, pause, resume)
- Three delivery channels: Webhook, In-App (SSE), On-Chain
- Node.js backend with event ingester and webhook dispatcher
- PostgreSQL + Redis storage layer
- Next.js frontend dashboard with Freighter wallet integration
- Self-hostable — MIT licensed

---

## v0.2.0 — Planned

**Additional delivery channels**

- Telegram bot notifications — subscribe with a chat ID
- Email delivery via SMTP / SendGrid
- Discord webhook support

**Subscription management improvements**

- TTL auto-renewal option — extend a subscription before it expires without creating a new one
- Bulk subscribe — create multiple subscriptions in a single transaction
- Subscription templates — save and reuse topic filter sets

**Backend reliability**

- Dead-letter queue for permanently failed webhook deliveries
- Prometheus metrics endpoint (`/metrics`) for monitoring ingester lag and delivery success rate
- Admin dashboard for backend operators

---

## v0.3.0 — Planned

**On-chain enhancements**

- Subscription NFTs — transferable subscription ownership via Soroban tokens
- Fee model — optional micro-fee per notification to fund public backend operators
- Multi-sig subscription ownership

**Ecosystem integrations**

- Blend protocol — liquidation alerts out of the box
- Trustless Work — escrow milestone notifications
- FlowFi — stream expiry and top-up alerts

**Developer tooling**

- `stellarnotify-js` SDK — typed client for subscribe, list, and cancel
- CLI tool — manage subscriptions from the terminal without a browser
- Webhook tester — replay any historical notification to your endpoint

---

## Contributing to the Roadmap

Have a feature request? Open an issue on [GitHub](https://github.com/yourusername/stellarnotify-contract) with the label `enhancement`. Community votes on issues help prioritise what ships in the next release.
