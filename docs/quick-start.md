---
id: quick-start
title: Quick Start
sidebar_position: 2
---

# Quick Start

Get StellarNotify running on testnet in under 10 minutes.

:::tip
This guide uses testnet. For mainnet deployment, see [Deploying to Mainnet](./deploying-to-mainnet).
:::

## Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) v22+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- [Freighter](https://freighter.app/) browser extension

## 1. Clone the repos

```bash
git clone https://github.com/yourusername/stellarnotify-contract
git clone https://github.com/yourusername/stellarnotify-backend
git clone https://github.com/yourusername/stellarnotify-frontend
```

## 2. Build and deploy the contract

:::warning
Save the contract ID printed after deployment — you'll need it for every subsequent step.
:::

```bash
cd stellarnotify-contract

# Add the WASM build target
rustup target add wasm32-unknown-unknown

# Build
stellar contract build

# Deploy to testnet (replace ADMIN_ADDRESS with your Freighter address)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellarnotify_contract.wasm \
  --source ADMIN_ADDRESS \
  --network testnet

# Note the contract ID printed — you will need it next.

# Initialise the contract
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ADMIN_ADDRESS \
  --network testnet \
  -- initialise \
  --admin ADMIN_ADDRESS \
  --max_per_owner 20 \
  --max_ttl 0
```

## 3. Configure and start the backend

:::info
The backend requires PostgreSQL and Redis running. Use the included `docker-compose.yml` if you don't have them installed locally.
:::

```bash
cd ../stellarnotify-backend
cp .env.example .env
# Edit .env: set NOTIFY_CONTRACT_ID, DATABASE_URL, REDIS_URL

npm install
npm run build

# Run DB migration
psql $DATABASE_URL < src/db/migrations/001_initial.sql

npm start
```

## 4. Configure and start the frontend

```bash
cd ../stellarnotify-frontend
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_NOTIFY_CONTRACT_ID

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Freighter wallet.

:::tip
Make sure Freighter is set to **testnet** mode before connecting.
:::

## 5. Create your first subscription

In the dashboard:
1. Click **New Subscription**
2. Paste any Soroban contract address you want to watch
3. Choose a delivery channel (Webhook, In-App, or On-Chain)
4. For Webhook: enter the SHA-256 hash of your endpoint URL
5. Sign the transaction with Freighter
6. Your subscription is live on-chain ✅
