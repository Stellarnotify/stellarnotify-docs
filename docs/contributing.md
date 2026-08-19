---
id: contributing
title: Contributing
---

# Contributing

StellarNotify is fully open source under the MIT license. Contributions of all kinds are welcome.

## Ways to Contribute

- Fix bugs — browse open issues labeled `bug`
- Add features — check issues labeled `enhancement`
- Write tests — contract tests in Rust, backend tests in Jest
- Improve docs — this site is in `stellarnotify-docs/docs/`
- Report issues — open a GitHub issue with a clear description

## Development Setup

See [Quick Start](./quick-start.md) to get the full stack running locally.

## Pull Request Guidelines

1. Fork the relevant repo and create a branch: `git checkout -b feat/your-feature`
2. Write tests for new behaviour
3. Ensure `cargo test` passes (contract) and `npm test` passes (backend)
4. Keep commits atomic and descriptive
5. Open a PR against `main` with a clear description of what and why

## Code Style

- **Rust**: `rustfmt` + `clippy` with default settings
- **TypeScript**: ESLint with the project config
- **Docs**: MDX, sentence case headings

## License

By contributing you agree your code will be released under the [MIT License](./license.md).
