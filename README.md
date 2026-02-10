# DockSwitcher

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

### Testing

```bash
npm test
```

```bash
cargo test
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

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
