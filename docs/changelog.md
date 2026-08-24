---
id: changelog
title: Changelog
sidebar_position: 13
---

# Changelog

All notable changes to StellarNotify are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

---

## [0.1.0] — 2026-08-19

Initial public release.

### Contract (`stellarnotify-contract`)

**Added**
- `initialise(admin, max_per_owner, max_ttl)` — one-time contract setup
- `subscribe(owner, watched_contract, topics, channel, endpoint_ref, ttl_ledgers)` — create an on-chain subscription
- `cancel(owner, id)` — permanently delete a subscription
- `pause_sub(owner, id)` / `resume_sub(owner, id)` — pause and resume delivery
- `update_config(admin, max_per_owner, max_ttl)` — update protocol limits
- `set_paused(admin, paused)` — emergency protocol pause
- `transfer_admin(admin, new_admin)` — transfer admin role
- `get_sub(id)`, `list_by_owner(owner)`, `list_by_contract(watched)`, `get_config()` — query functions
- Owner and watcher indexes for efficient lookup
- Full `NotifyError` enum with 11 error variants
- Events: `sub_new`, `sub_cancel`, `sub_pause`, `sub_resume`, `cfg_upd`, `proto_ps`

### Backend (`stellarnotify-backend`)

**Added**
- Event ingester — polls Stellar RPC `getEvents` every 6 seconds with cursor persistence
- Webhook dispatcher — HTTP POST delivery with 5-attempt exponential back-off
- In-App dispatcher — Redis pub/sub → Server-Sent Events stream
- On-Chain re-emitter — submits re-emit transactions to Stellar
- REST API: `GET /subscriptions`, `POST /subscriptions/endpoint`, `GET /notifications`, `GET /sse/:owner`, `GET /health`
- PostgreSQL schema with subscriptions mirror, notification records, and cursor table
- `docker-compose.yml` for local development
- Structured JSON logging to stdout

### Frontend (`stellarnotify-frontend`)

**Added**
- Subscription dashboard — list, create, and manage subscriptions
- Notification history explorer with status filtering
- Freighter wallet integration for signing transactions
- TanStack Query data fetching with SSE-driven cache invalidation
- Alert config UI for webhook and notification channel selection

### Docs (`stellarnotify-docs`)

**Added**
- Full Docusaurus 3 documentation site
- Introduction, Quick Start, Architecture, Security Model
- Contract reference: overview, initialise, subscribe, manage, errors
- Backend reference: overview, event ingester, webhook dispatcher, API reference, self-hosting
- Frontend reference: overview, wallet connect, SSE
- Integration guide, FAQ, Roadmap, Changelog
- MIT License

---

## Unreleased

See the [Roadmap](./roadmap) for planned features in v0.2.0 and v0.3.0.
