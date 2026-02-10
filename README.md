# DockSwitcher

[![Release](https://github.com/rodvilla/dockswitcher/actions/workflows/release.yml/badge.svg)](https://github.com/rodvilla/dockswitcher/actions/workflows/release.yml)
[![GitHub Release](https://img.shields.io/github/v/release/rodvilla/dockswitcher?label=download)](https://github.com/rodvilla/dockswitcher/releases/latest)
[![License](https://img.shields.io/github/license/rodvilla/dockswitcher)](LICENSE)

macOS menu bar app to switch Dock profiles.

## Download

Grab the latest `.dmg` from the [Releases page](https://github.com/rodvilla/dockswitcher/releases/latest).

Builds are available for both Apple Silicon (aarch64) and Intel (x86_64).

## Building from source

### Prerequisites

- macOS 14+
- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://rustup.rs/)
- Tauri CLI v2: `cargo install tauri-cli`

### Clone and install

```bash
git clone https://github.com/rodvilla/dockswitcher.git
cd dockswitcher
npm install
```

### Development

Run the full desktop app with live reload:

```bash
npm run tauri dev
```

If you only want the frontend dev server:

```bash
npm run dev
```

### Build (production)

```bash
npm run tauri build
```

Build artifacts are generated at:

```
src-tauri/target/release/bundle/
```

This includes a `.dmg` installer and `.app` bundle.

### Preview the production frontend

```bash
npm run build
npm run preview
```

## Releases

Releases are automated via GitHub Actions using [`tauri-action`](https://github.com/tauri-apps/tauri-action).

To create a new release:

1. Update the version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
2. Commit with a message like `release: v0.2.0`.
3. Tag and push:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The workflow builds macOS binaries for both architectures (Apple Silicon + Intel), creates a draft GitHub Release, and uploads the `.dmg` and `.app` artifacts. Review and publish the draft from the [Releases page](https://github.com/rodvilla/dockswitcher/releases).

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
