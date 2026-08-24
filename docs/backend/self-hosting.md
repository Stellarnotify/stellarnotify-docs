---
id: backend/self-hosting
title: Self-Hosting
sidebar_position: 5
---

# Self-Hosting

StellarNotify is MIT licensed and fully self-hostable. You control your own data and delivery infrastructure.

## Requirements

| Service | Minimum version |
|---|---|
| Node.js | 20 LTS |
| PostgreSQL | 15 |
| Redis | 7 |

## Docker Compose (recommended)

A `docker-compose.yml` is included in the backend repo:

```bash
git clone https://github.com/yourusername/stellarnotify-backend
cd stellarnotify-backend
cp .env.example .env
# Edit .env

docker compose up -d
```

This starts the backend, PostgreSQL, and Redis together.

## Manual Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run database migrations
psql $DATABASE_URL < src/db/migrations/001_initial.sql

# Start
npm start
```

## Upgrading

```bash
git pull
npm install
# Apply any new migration files in src/db/migrations/
npm run build && npm start
```

## Connecting to Mainnet

Change these values in `.env`:

```bash
STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
NOTIFY_CONTRACT_ID=<mainnet contract id>
```

## Production Considerations

- Rotate `API_SECRET` and use a secrets manager rather than a plain `.env` file.
- Put the API behind a reverse proxy (nginx, Caddy) with TLS termination.
- Set up log aggregation — the backend writes structured JSON logs to stdout.
- Monitor the cursor lag metric to ensure the ingester stays within the 7-day RPC window.
