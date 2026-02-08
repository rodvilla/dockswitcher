# DockSwitcher Review Guide (Rust + React)

This guide is a map for reviewing DockSwitcher with a focus on learning Rust while understanding the full system. It points you to the most important files, explains the key flows, and highlights Rust concepts you’ll see in context.

---

## 1. Fast Orientation: Project Map

**Backend (Rust / Tauri)**
- `src-tauri/src/lib.rs` — main entrypoint, tray menu, command handlers, Dock switching logic
- `src-tauri/src/store.rs` — data model + persistence (JSON config, atomic writes)
- `src-tauri/tauri.conf.json` — app metadata and window/tray configuration
- `src-tauri/capabilities/default.json` — permissions (shell, dialog, etc.)

**Frontend (React + TS)**
- `src/App.tsx` — top-level UI orchestration + IPC calls
- `src/components/*` — Sidebar, ProfileDetail, Settings, ConfirmDialog
- `src/hooks/*` — all IPC wrappers and state sync with Rust
- `src/types.ts` — shared TypeScript shapes matching Rust structs

---

## 2. Rust Review Guide (with pointers)

### 2.1 Data Model + Persistence (`src-tauri/src/store.rs`)

**What to look for:**
- Data structs (Rust equivalents of TypeScript interfaces)
- Default values and schema versioning
- Atomic file write strategy

**Key points (line references are approximate):**
- **Structs**: `AppEntry`, `Profile`, `Settings`, `StoreData` (lines 5–55)
  - Similar to TS interfaces in `src/types.ts`
- **Defaults**: `impl Default` for Settings and StoreData (lines 30–55)
  - Rust uses `Default` trait instead of JS/TS default values
- **Persistence**: `Store::load()` and `Store::save()` (lines 78–104)
  - Uses `serde_json` to serialize/deserialize
  - Writes to temp file then renames (atomic write)
  - Keeps a `.bak` backup

**Rust concepts to learn here:**
- `derive(Serialize, Deserialize)`: auto JSON serialization
- `Result<T, E>` and `?` operator: error propagation
- `PathBuf` and `std::fs`: filesystem handling

---

### 2.2 Backend Entry + Commands (`src-tauri/src/lib.rs`)

**What to look for:**
- Tauri command functions (`#[tauri::command]`)
- Tray menu construction
- Dock switching flow
- Window lifecycle (hide on close)

**Key sections:**

**1) Tray Menu + UI behavior**
- `build_tray_menu(...)` (lines ~15–40)
  - Builds a menu with profiles as check items
  - Adds “Open DockSwitcher” and “Quit DockSwitcher”

**2) Command handlers (IPC surface)**
All functions with `#[tauri::command]` can be called from React:
- Profile CRUD: `get_profiles`, `create_profile`, `update_profile`, `delete_profile`, `reorder_profiles`
- Settings: `get_settings`, `update_settings`
- Dock: `get_current_dock_apps`, `apply_profile`, `save_dock_to_profile`
- Utility: `check_dockutil`, `add_app_to_profile`, `remove_app_from_profile`

**3) Dock switching engine**
- `apply_profile(...)` (lines ~206–279)
  - `dockutil --remove all --no-restart`
  - Adds each app in order
  - `killall Dock` to refresh
  - Updates active profile and tray menu

**4) Boot + lifecycle**
- `run()` (lines ~346+)
  - Loads store
  - Builds tray
  - Window hides on close (not quit)
  - Registers command handlers

**Rust concepts to learn here:**
- `Mutex<Store>`: shared state with safe locking
- Borrowing vs. cloning (`store.data.profiles.clone()`)
- `map_err(|e| e.to_string())`: error mapping for IPC
- `std::process::Command`: running external commands

---

## 3. React Review Guide (with pointers)

### 3.1 Frontend IPC + State (`src/App.tsx`)

**What to look for:**
- Hook usage (`useProfiles`, `useDock`, `useSettings`)
- UI flow (Sidebar ↔ ProfileDetail ↔ SettingsView)
- Confirmation dialogs (delete / apply)

**Key flow:**
- Profiles + settings load on mount
- Sidebar selection changes `selectedProfileId`
- ProfileDetail actions call Dock + Profile hooks
- ConfirmDialog gates destructive actions if enabled

### 3.2 Hooks → IPC (`src/hooks/*`)

These are all direct wrappers around Tauri commands:
- `useProfiles` → `get_profiles`, `create_profile`, `update_profile`, etc.
- `useDock` → `save_dock_to_profile`, `add_app_to_profile`, `remove_app_from_profile`
- `useSettings` → `get_settings`, `update_settings`

**Pattern to notice:**
- Every hook method calls `invoke('command_name', { args })`
- Then refreshes local state (profiles or settings)

### 3.3 Components

**Sidebar (`src/components/Sidebar.tsx`)**
- Drag-and-drop profile reordering with `@dnd-kit`
- Inline rename + create
- Context menu for rename/delete

**ProfileDetail (`src/components/ProfileDetail.tsx`)**
- Drag-and-drop app list ordering
- “Save apps from Dock” and “Apply to Dock”
- “Add App” uses Tauri dialog API (wired in App.tsx)

**SettingsView (`src/components/SettingsView.tsx`)**
- Toggle UI for launch-at-login and confirmation-before-switch

**ConfirmDialog (`src/components/ConfirmDialog.tsx`)**
- Shared confirmation modal (supports destructive style)

---

## 4. Quick Reference: Rust ⇄ React Data Shapes

**Rust (`store.rs`)**
```rust
pub struct AppEntry { name: String, path: String, icon: Option<String>, bundle_id: Option<String> }
pub struct Profile { id: String, name: String, apps: Vec<AppEntry>, created_at: String, updated_at: String }
pub struct Settings { launch_at_login: bool, confirm_before_switch: bool }
```

**TypeScript (`src/types.ts`)**
```ts
export interface AppEntry { name: string; path: string; icon?: string; bundle_id?: string; }
export interface Profile { id: string; name: string; apps: AppEntry[]; created_at: string; updated_at: string; }
export interface Settings { launch_at_login: boolean; confirm_before_switch: boolean; }
```

---

## 5. Rust Primer (what to watch for)

**Core syntax in this codebase:**
- `let` vs `let mut`: immutable by default
- `&` and `&mut`: references (borrowing)
- `.clone()`: explicit copy (used when we need owned data)
- `Result<T, E>`: many functions return results instead of throwing
- `?`: propagate errors upward

**Common patterns you’ll see here:**
- `state.lock()` → access shared Store (thread-safe)
- `map_err(|e| e.to_string())` → convert Rust errors into strings for JS
- `if let Some(x) = ...` → common pattern for optional values

---

## 6. Suggested Review Order

1. `src-tauri/src/store.rs` (data model + persistence)
2. `src-tauri/src/lib.rs` (commands + dock switching)
3. `src/hooks/*` (how UI calls Rust)
4. `src/App.tsx` (UI orchestration)
5. `src/components/*` (interaction details + DnD)

---

## 7. What to Inspect for Quality

**Backend (Rust):**
- Is every mutation followed by `store.save()`?
- Are errors surfaced to UI? (most errors are returned as strings)
- Is tray menu updated after changes?

**Frontend (React):**
- Any places where state could get out of sync?
- Are all async commands awaited? (yes in hooks)
- Is confirm-before-switch working? (gated in App.tsx)

---

## 8. If You Want a Guided Review Session

I can also annotate `lib.rs` and `store.rs` line-by-line with explanations of every Rust concept and command flow. Just say the word and I’ll generate that as a follow-up document.
