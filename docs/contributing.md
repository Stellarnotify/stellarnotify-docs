---
id: contributing
title: Contributing
sidebar_position: 19
---

# Contributing

StellarNotify is fully open source under the MIT license. Contributions of all kinds are welcome — code, tests, documentation, and bug reports.

## Ways to Contribute

- **Fix bugs** — browse open issues labeled `bug`
- **Add features** — check issues labeled `enhancement`
- **Write tests** — contract tests in Rust, backend tests in Jest, frontend tests in Vitest
- **Improve docs** — this site lives in `stellarnotify-docs/docs/`
- **Report issues** — open a GitHub issue with a clear description and reproduction steps

## Repositories

| Repo | Contents |
|---|---|
| [`stellarnotify-contract`](https://github.com/yourusername/stellarnotify-contract) | Soroban registry contract (Rust) |
| [`stellarnotify-backend`](https://github.com/yourusername/stellarnotify-backend) | Event ingester + dispatcher (Node.js/TypeScript) |
| [`stellarnotify-frontend`](https://github.com/yourusername/stellarnotify-frontend) | Subscription dashboard (Next.js) |
| [`stellarnotify-docs`](https://github.com/yourusername/stellarnotify-docs) | This documentation site (Docusaurus) |

## Development Setup

See [Quick Start](./quick-start) to get the full stack running locally.

## Pull Request Guidelines

1. Fork the relevant repo and create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Write tests for any new behaviour
3. Ensure all tests pass:
   - Contract: `cargo test` and `cargo clippy -- -D warnings`
   - Backend: `npm test`
   - Frontend: `npm test`
4. Keep commits atomic and descriptive
5. Open a PR against `main` with a clear title and description explaining what and why
6. Link any related issues in the PR description

## Test Requirements

Every PR that changes behaviour must include tests. See [Testing](./testing) for how to run the full test suite. PRs without tests for new behaviour will be asked to add them before merge.

## Code Style

| Language | Tooling |
|---|---|
| **Rust** | `rustfmt` + `clippy` with default settings |
| **TypeScript** | ESLint with the project config |
| **CSS** | Prettier |
| **Docs** | MDX, sentence case headings, present tense |

Run formatters before pushing:

```bash
# Rust
cargo fmt

# TypeScript / docs
npm run lint --fix
```

## Commit Messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add Telegram delivery channel
fix: retry on 429 status code from RPC
docs: clarify endpoint_ref hashing
chore: bump stellar-sdk to 12.1.0
```

## Reporting Security Vulnerabilities

Do **not** open a public issue for security bugs. Email `security@stellarnotify.dev` instead. See [Security Model](./security) for the full responsible disclosure policy.

## License

By contributing you agree your code will be released under the [MIT License](./license).
