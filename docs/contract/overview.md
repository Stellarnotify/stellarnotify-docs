---
id: contract-overview
title: Contract Overview
---

# Contract Overview

The StellarNotify contract is a Soroban smart contract written in Rust. It acts as a public, permissionless subscription registry.

## Contract Functions

### Admin

| Function | Description |
|---|---|
| `initialise(admin, max_per_owner, max_ttl)` | One-time setup |
| `update_config(admin, max_per_owner, max_ttl)` | Update protocol limits |
| `set_paused(admin, paused)` | Emergency pause/unpause |
| `transfer_admin(admin, new_admin)` | Transfer admin role |

### Subscriptions

| Function | Description |
|---|---|
| `subscribe(owner, watched_contract, topics, channel, endpoint_ref, ttl_ledgers)` | Create a subscription |
| `cancel(owner, id)` | Permanently delete a subscription |
| `pause_sub(owner, id)` | Pause deliveries (keeps data) |
| `resume_sub(owner, id)` | Resume a paused subscription |

### Queries

| Function | Description |
|---|---|
| `get_sub(id)` | Get full subscription data |
| `list_by_owner(owner)` | List subscription IDs by owner |
| `list_by_contract(watched)` | List subscription IDs by watched contract |
| `get_config()` | Read protocol configuration |

## Events Emitted

| Event | Topics | Data |
|---|---|---|
| `sub_new` | `(sub_new, owner)` | `(id, watched_contract)` |
| `sub_cancel` | `(sub_cancel, owner)` | `id` |
| `sub_pause` | `(sub_pause, owner)` | `id` |
| `sub_resume` | `(sub_resume, owner)` | `id` |
| `cfg_upd` | `(cfg_upd, admin)` | `()` |
| `proto_ps` | `proto_ps` | `paused (bool)` |
