# AGENTS.md — DockSwitcher

macOS menu bar app to switch Dock profiles. Tauri v2 desktop app with a React 19 + TypeScript frontend and a Rust backend.

## Architecture

```
src/                  # React frontend (TypeScript, Tailwind CSS v4)
  components/         # UI components (Sidebar/, ConfirmDialog, SortableAppItem)
  hooks/              # Custom hooks (useProfiles, useDock, useSettings) — call Tauri via invoke()
  views/              # Page-level components (ProfileView, SettingsView)
  types/              # TypeScript interfaces (profile.ts, settings.ts, store.ts)
  test/               # Test setup (setup.ts)
src-tauri/            # Rust backend (Tauri v2)
  src/commands/       # Tauri command handlers (profiles.rs, settings.rs, dock.rs)
  src/store.rs        # JSON file store with atomic writes
  src/dock.rs         # dockutil CLI wrapper + output parser
  src/icon.rs         # macOS app icon extraction
  src/tray.rs         # System tray menu builder
  src/lib.rs          # App entry point, plugin/command registration
```

Frontend communicates with backend exclusively through `invoke()` from `@tauri-apps/api/core`. Each hook maps to specific Tauri commands (e.g., `useProfiles` calls `get_profiles`, `create_profile`, etc.).

## Build & Run

```bash
yarn install              # Install frontend dependencies
yarn run dev              # Vite dev server only (frontend at localhost:1420)
yarn run tauri dev        # Full desktop app with live reload
yarn run build            # TypeScript check + Vite production build
yarn run tauri build      # Production desktop app (.dmg + .app)
```

## Lint

```bash
yarn run lint             # ESLint with --max-warnings=0 (zero tolerance)
yarn run lint:fix         # ESLint with auto-fix
```

## Test

```bash
# Frontend (Vitest + jsdom + React Testing Library)
yarn test                 # Run all frontend tests once
npx vitest run src/hooks/useProfiles.test.ts          # Single test file
npx vitest run -t "loads profiles and active id"      # Single test by name

# Backend (Cargo)
yarn run tauri:test                      # All Rust tests
cd src-tauri && cargo test store         # Tests matching "store"
cd src-tauri && cargo test percent_decode_basic -- --exact   # Exact single test
```

## Git Hooks (Husky)

- **pre-commit**: Runs `yarn run lint:fix` then `yarn test`. Both must pass.
- **pre-push**: Empty (no-op).

## Code Style — TypeScript / React

### Formatting
- Double quotes for strings in TSX/TS files.
- 2-space indentation.
- Trailing commas in multi-line structures.
- Semicolons required.

### Imports
- Order: React/library imports first, then local imports (`./`, `../`).
- Use `type` keyword for type-only imports: `import type { Profile } from "../types"`.
- Barrel exports via `index.ts` in each directory. Import from barrels:
  ```ts
  import { useProfiles, useDock, useSettings } from "./hooks";
  import type { Profile } from "../types";
  ```
- No unused imports (enforced by `eslint-plugin-unused-imports`, set to error).

### Components
- Functional components only. Use `React.FC<Props>` for view/dialog components.
- Components use `default export`. Hooks use `named export`.
- Props interfaces defined in the same file or in a sibling `types.ts`.
- Use `type="button"` on all `<button>` elements.

### Hooks
- Custom hooks in `src/hooks/`, exported via `src/hooks/index.ts`.
- Wrap async operations with `useCallback`. Manage loading/error state locally.
- Communicate with backend via `invoke<T>("command_name", { paramName: value })`.
- Tauri command param names use camelCase on the JS side (Tauri auto-converts to snake_case).

### Types
- Interfaces over type aliases for object shapes.
- TypeScript strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`).
- Prefix unused parameters with `_` (e.g., `_event`).
- Mirror Rust struct field names using snake_case: `created_at`, `bundle_id`, `launch_at_login`.
- Optional fields use `?` syntax: `icon?: string`.

### Styling
- Tailwind CSS v4 utility classes exclusively. No CSS modules, no styled-components.
- Dark mode via `dark:` prefix classes (uses system preference).
- Consistent color palette: `gray-*` / `slate-*` for surfaces, `blue-600` for primary, `red-600` for destructive, `green-*` for active/success.
- Use `transition-colors` on interactive elements.

### Error Handling
- Wrap async calls in try/catch, log with `console.error("Failed to <action>:", error)`.
- No empty catch blocks.

## Code Style — Rust

### Structure
- Commands in `src-tauri/src/commands/` — one file per domain (profiles, settings, dock).
- Shared state via `tauri::State<'_, std::sync::Mutex<Store>>`.
- All commands return `Result<T, String>`. Map errors with `.map_err(|e| e.to_string())`.

### Naming
- snake_case for functions, variables, fields.
- Commands use `#[tauri::command]` attribute, function name matches JS invoke name.
- Module structure: `mod.rs` re-exports submodules with `pub mod`.

### Error Handling
- Lock mutex, map error to String: `state.lock().map_err(|e| e.to_string())?`.
- Use `?` operator for propagation. No `unwrap()` in command handlers.
- `unwrap()` acceptable in `setup()` and tests only.

### Testing
- Tests in `#[cfg(test)] mod tests` at bottom of source file.
- Use `temp_dir()` + UUID for filesystem test isolation.
- Clean up temp files in each test (`fs::remove_dir_all`).
- Test function names: `snake_case_describing_behavior` (e.g., `store_save_and_load_roundtrip`).

## Testing Patterns — Frontend

- Vitest with jsdom environment, globals enabled.
- Mock `@tauri-apps/api/core` invoke at the top of every test file:
  ```ts
  vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
  const mockInvoke = vi.mocked(invoke);
  ```
- Use `renderHook` + `waitFor` + `act` from Testing Library for hook tests.
- Clear mocks in `beforeEach`: `vi.clearAllMocks()`.
- Test file naming: `<hookName>.test.ts` colocated with the hook.
- Test structure: `describe("<hookName>")` with `it("action description")`.

## Key Dependencies

| Frontend | Backend |
|----------|---------|
| React 19, React DOM 19 | Tauri 2 (tray-icon, macos-private-api) |
| Tailwind CSS 4 (via Vite plugin) | serde / serde_json |
| @dnd-kit (core, sortable, utilities) | uuid, chrono, dirs |
| @tauri-apps/api, plugin-dialog, plugin-shell | plist, icns, base64 |
| lucide-react (icons) | tauri-plugin-opener, shell, dialog |
| Vitest 4, Testing Library | |

## Prerequisites

- macOS 14+
- Node.js LTS + Yarn
- Rust (via rustup)
- dockutil: `brew install dockutil` (or bundled in resources/)
