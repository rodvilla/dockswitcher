# DockSwitcher

[![Release](https://github.com/rodvilla/dockswitcher/actions/workflows/release.yml/badge.svg)](https://github.com/rodvilla/dockswitcher/actions/workflows/release.yml)
[![GitHub Release](https://img.shields.io/github/v/release/rodvilla/dockswitcher?include_prereleases)](https://github.com/rodvilla/dockswitcher/releases/latest)
[![License](https://img.shields.io/github/license/rodvilla/dockswitcher)](LICENSE)

macOS menu bar app to switch Dock profiles.

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
yarn install
```

### Development

Run the full desktop app with live reload:

```bash
yarn run tauri dev
```

If you only want the frontend dev server:

```bash
yarn run dev
```

### Testing

```bash
yarn test
```

```bash
cargo test
```

### Build (production)

```bash
yarn run tauri build
```

Build artifacts are generated at:

```
src-tauri/target/release/bundle/
```

This includes a `.dmg` installer and `.app` bundle.

### Preview the production frontend

```bash
yarn run build
yarn run preview
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
