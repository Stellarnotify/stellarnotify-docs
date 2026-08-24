---
id: deploying-to-mainnet
title: Deploying to Mainnet
sidebar_position: 16
---

# Deploying to Mainnet

This page covers the full checklist for deploying StellarNotify to the Stellar public network.

:::warning
Mainnet deployments are permanent and use real XLM. Work through the entire checklist before submitting any transaction.
:::

---

## Pre-Deploy Checklist

### Contract

- [ ] All contract tests pass: `cargo test`
- [ ] No Clippy warnings: `cargo clippy -- -D warnings`
- [ ] Contract built in release mode: `stellar contract build`
- [ ] Reviewed `max_per_owner` and `max_ttl` values for production limits
- [ ] Admin address is a hardware wallet or multi-sig — not a hot key
- [ ] Contract WASM hash recorded for verification

### Backend

- [ ] All backend tests pass: `npm test`
- [ ] `API_SECRET` is a randomly generated 256-bit secret — not the default
- [ ] `DATABASE_URL` points to a production PostgreSQL instance (not local)
- [ ] `REDIS_URL` points to a production Redis instance
- [ ] TLS termination configured on the API (nginx / Caddy in front)
- [ ] Firewall rules allow only required ports
- [ ] Log aggregation configured (stdout → log service)
- [ ] Backup schedule set for PostgreSQL

### Frontend

- [ ] `NEXT_PUBLIC_STELLAR_NETWORK=mainnet`
- [ ] `NEXT_PUBLIC_STELLAR_RPC_URL` set to a mainnet RPC endpoint
- [ ] `NEXT_PUBLIC_NOTIFY_CONTRACT_ID` set to the deployed mainnet contract ID
- [ ] Build passes: `npm run build`

---

## 1. Deploy the Contract

```bash
cd stellarnotify-contract

# Build release WASM
stellar contract build

# Deploy to mainnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellarnotify_contract.wasm \
  --source ADMIN_ADDRESS \
  --network mainnet

# Save the printed contract ID — you need it in every subsequent step
export CONTRACT_ID=C...
```

## 2. Initialise the Contract

Choose your production limits carefully. These can be updated later via `update_config` but require an admin transaction.

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source ADMIN_ADDRESS \
  --network mainnet \
  -- initialise \
  --admin ADMIN_ADDRESS \
  --max_per_owner 50 \
  --max_ttl 2000000
```

| Parameter | Recommended value | Notes |
|---|---|---|
| `max_per_owner` | 50 | Adjust based on expected usage |
| `max_ttl` | 2000000 | ~3 months at 5s/ledger; `0` = unlimited |

## 3. Verify the Contract

Confirm the contract is initialised correctly:

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network mainnet \
  -- get_config
```

Expected output:

```json
{
  "admin": "GAAA...",
  "max_per_owner": 50,
  "max_ttl": 2000000,
  "paused": false
}
```

## 4. Configure and Start the Backend

```bash
cd stellarnotify-backend
cp .env.example .env
```

Edit `.env` with mainnet values:

```bash
STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
NOTIFY_CONTRACT_ID=C...   # from step 1
DATABASE_URL=postgresql://user:password@prod-db:5432/stellarnotify
REDIS_URL=redis://prod-redis:6379
API_SECRET=<random-256-bit-secret>
PORT=3001
```

```bash
npm run build
psql $DATABASE_URL < src/db/migrations/001_initial.sql
npm start
```

## 5. Deploy the Frontend

```bash
cd stellarnotify-frontend
cp .env.local.example .env.local
```

```bash
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
NEXT_PUBLIC_NOTIFY_CONTRACT_ID=C...
NEXT_PUBLIC_API_URL=https://api.stellarnotify.dev
```

```bash
npm run build
# Deploy build/ output to your hosting provider (Vercel, Netlify, etc.)
```

---

## Post-Deploy Verification

1. Open the frontend and connect a Freighter wallet set to **mainnet**
2. Create a test subscription on a known contract
3. Confirm the subscription appears in `GET /subscriptions?owner=...`
4. Trigger an event on the watched contract and confirm a notification is delivered
5. Check `GET /health` returns `{ "status": "ok" }`
6. Monitor ingester cursor lag for the first 30 minutes

---

## Rolling Back

The contract cannot be deleted from Soroban storage once deployed. To disable it:

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source ADMIN_ADDRESS \
  --network mainnet \
  -- set_paused \
  --admin ADMIN_ADDRESS \
  --paused true
```

This prevents new subscriptions while leaving existing data intact.
