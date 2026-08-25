# StellarNotify Documentation

Official documentation site for [StellarNotify](https://stellarnotify.dev) — on-chain event notification infrastructure for the Stellar/Soroban ecosystem.

## About StellarNotify

StellarNotify solves the 7-day RPC event retention limit on Stellar by providing:

- **Soroban smart contract** — public, permissionless subscription registry
- **Event ingestion backend** — continuous polling and event matching
- **Multi-channel delivery** — Webhook, In-App (SSE), and On-Chain re-emit
- **Self-hostable** — MIT licensed, run your own infrastructure

## Documentation

Visit **[stellarnotify.dev](https://stellarnotify.dev)** for the full docs.

## Local Development

```bash
npm install
npm start
```

This starts a local dev server at [http://localhost:3000](http://localhost:3000). Most changes are reflected live without restarting.

## Build

```bash
npm run build
```

Generates static content into the `build/` directory. Serve with:

```bash
npm run serve
```

## Contributing

Found a typo or broken link? Open a PR! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Structure

```
docs/
├── introduction.md
├── quick-start.md
├── architecture.md
├── contract/          # Contract reference
├── backend/           # Backend reference
├── frontend/          # Frontend reference
├── examples/          # Code examples
├── integration-guide.md
├── use-cases.md
├── faq.md
├── roadmap.md
├── changelog.md
└── ...
```

## Links

- **Main Site**: [stellarnotify.dev](https://stellarnotify.dev)
- **Contract Repo**: [github.com/yourusername/stellarnotify-contract](https://github.com/yourusername/stellarnotify-contract)
- **Backend Repo**: [github.com/yourusername/stellarnotify-backend](https://github.com/yourusername/stellarnotify-backend)
- **Frontend Repo**: [github.com/yourusername/stellarnotify-frontend](https://github.com/yourusername/stellarnotify-frontend)
- **Discord**: [discord.gg/stellar](https://discord.gg/stellar) (`#dev-soroban`)

## License

MIT — see [LICENSE](./LICENSE)
