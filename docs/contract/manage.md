---
id: contract-manage
title: Manage Subscriptions
sidebar_position: 4
---

# Manage Subscriptions

Functions for owners and admins to manage the lifecycle of subscriptions and protocol configuration.

## Owner Functions

### `cancel`

Permanently deletes a subscription and removes it from all indexes. This cannot be undone.

```rust
fn cancel(env: Env, owner: Address, id: u64)
```

### `pause_sub`

Pauses delivery for a subscription while keeping its data on-chain. Useful for temporarily halting notifications without losing the subscription.

```rust
fn pause_sub(env: Env, owner: Address, id: u64)
```

### `resume_sub`

Resumes a paused subscription.

```rust
fn resume_sub(env: Env, owner: Address, id: u64)
```

---

## Admin Functions

### `update_config`

Updates global protocol limits. Requires admin signature.

```rust
fn update_config(env: Env, admin: Address, max_per_owner: u32, max_ttl: u32)
```

| Parameter | Type | Description |
|---|---|---|
| `max_per_owner` | `u32` | New subscription limit per wallet |
| `max_ttl` | `u32` | New maximum TTL in ledgers (`0` = unlimited) |

### `set_paused`

Pauses or unpauses the entire protocol. When paused, `subscribe` calls will fail. Existing subscriptions are not affected.

```rust
fn set_paused(env: Env, admin: Address, paused: bool)
```

### `transfer_admin`

Transfers the admin role to a new address. The current admin must sign.

```rust
fn transfer_admin(env: Env, admin: Address, new_admin: Address)
```

---

## Events Emitted

| Action | Topics | Data |
|---|---|---|
| `cancel` | `["sub_cancel", owner]` | `id` |
| `pause_sub` | `["sub_pause", owner]` | `id` |
| `resume_sub` | `["sub_resume", owner]` | `id` |
| `update_config` | `["cfg_upd", admin]` | `()` |
| `set_paused` | `["proto_ps"]` | `paused (bool)` |
