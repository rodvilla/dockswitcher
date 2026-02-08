# Project Reference Document (PRD): DockSwitcher

## 1. Project Overview

**Project Name:** DockSwitcher

**Description:** A macOS menu bar application (agent) that allows users to switch between different "Dock Profiles" (e.g., Work, Personal, Dev). It automates the process of adding/removing apps from the macOS Dock based on the selected context.

**Primary Goal:** Provide a bug-free, persistent, and native-feeling alternative to existing tools like ContextDock and Dockify — specifically solving issues with data persistence upon reboot and removing Dock icon clutter.

**Platform:** macOS only (Sonoma 14.0+, Sequoia 15.0+).

---

## 2. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | [Tauri v2](https://v2.tauri.app/) (latest stable) | Rust backend + native WKWebView. ~10MB bundle vs Electron's ~150MB. |
| **Language** | TypeScript (frontend) + Rust (backend/system) | Rust handles tray, shell commands, window management. TS handles UI. |
| **Frontend Framework** | React 19 + Vite | Tauri v2's default frontend bundler is Vite. |
| **Styling** | Tailwind CSS v4 | |
| **UI Components** | shadcn/ui | Clean, native-feeling components matching macOS aesthetic. |
| **Icons** | lucide-react | Consistent icon style across the UI. |
| **Persistence** | JSON file via `serde_json` (Rust) | Plain `config.json` at `~/Library/Application Support/com.dockswitcher.app/config.json`. No ORM or DB needed for this data shape. |
| **Dock Manipulation** | `dockutil` v3.x (embedded binary) | Swift-based CLI. Bundled in `src-tauri/resources/` and referenced via `app.path().resource_dir()`. |
| **Shell Execution** | `tauri-plugin-shell` | Executes `dockutil` commands from the Rust backend. |
| **Build/Package** | `tauri-cli` + `cargo-bundle` | Produces `.dmg` installer. Configures `LSUIElement` in `Info.plist`. |

---

## 3. Architecture & System Behavior

### 3.1. App Lifecycle (Agent Mode)

- **Dock Icon:** The app MUST NOT have an icon in the macOS Dock.
  - **Implementation:** Set `LSUIElement: true` in `Info.plist` via `tauri.conf.json` bundle config, or use `app.set_activation_policy(ActivationPolicy::Accessory)` in Rust setup.
- **Menu Bar Icon:** The app lives exclusively in the Menu Bar (Tray).
  - Uses `TrayIconBuilder` from Tauri's tray API.
  - Icon should be a template image (monochrome, adapts to light/dark menu bar).
- **Window Management:**
  - The main configuration window opens only when "Open DockSwitcher" is clicked from the tray menu.
  - Closing the window (`Cmd+W` or red traffic light) MUST hide the window, not quit the app.
  - Implementation: Intercept `CloseRequested` event, call `window.hide()` + `api.prevent_close()`.
- **Launch at Login:**
  - Toggle in settings. Uses macOS `LoginItems` API or `SMAppService` (via Tauri plugin or Rust).

### 3.2. Data Persistence (Critical)

- Profiles MUST be saved to a local JSON file.
- **Constraint:** Data MUST survive a full system reboot (Shutdown/Restart).
- **Path:** `~/Library/Application Support/com.dockswitcher.app/config.json`
- **Write strategy:** Atomic writes (write to temp file, then rename) to prevent corruption on crash.
- **Backup:** Keep a `.config.json.bak` on every successful write.

---

## 4. Functional Requirements

### 4.1. Profile Management (Main UI)

**Sidebar (Left Pane):**
- List all available profiles (e.g., "Work", "Personal", "Dev").
- Visual indication of the currently selected profile for editing (blue highlight, `bg-blue-600 text-white`).
- Visual indicator of the currently *active* Dock profile (checkmark or dot).
- "Add Profile" (`+`) button at the bottom.
- Profiles are **reorderable via drag-and-drop**.
- Right-click context menu: Rename, Duplicate, Delete.

**Profile Details (Right Pane):**
- **Profile name** — editable inline text field at the top.
- **App list** — displays apps assigned to this profile, each row showing:
  - App icon (extracted from `.app` bundle via `sips` or `NSWorkspace`).
  - App name.
  - App path (truncated, tooltip for full path).
  - Delete button (trash icon) per row.
- **Apps are reorderable via drag-and-drop** (order = Dock position left-to-right).
- **Add Apps button** — opens a native file dialog filtered to `.app` bundles in `/Applications`.
- **"Save apps from Dock" button** — reads the current live Dock and imports those apps into the selected profile.
  - Tech: `dockutil --list` → parse output → populate profile.
- **"Apply to Dock" button** — applies this profile's apps to the live Dock.

### 4.2. The Switching Engine

**Trigger:** User selects a profile from the Tray Menu, or clicks "Apply to Dock" in the Main UI.

**Logic (sequential):**
1. Read the app paths from the target profile.
2. Execute: `dockutil --remove all --no-restart`
3. For each app in order: `dockutil --add "<path>" --no-restart`
4. Finalize: `killall Dock` (refreshes Dock UI once at the end).
5. Update `activeProfileId` in the store.
6. Update tray menu to reflect the new active profile.

**Error Handling:**
- If `dockutil` is not found at the expected path, show a user-facing error with instructions.
- If an app path in the profile no longer exists (uninstalled), skip it and warn the user after switching.
- If the switching process fails midway, log the error and notify the user.

### 4.3. Tray Menu (Menu Bar)

**Structure:**
```
─────────────────────────
  ● Work                  ← Radio-style. Dot/check indicates active.
    Personal
    Dev
─────────────────────────
  Open DockSwitcher       ← Shows configuration window
─────────────────────────
  Quit DockSwitcher       ← Terminates the process
─────────────────────────
```

- **Section 1 (Profiles):** All profiles listed as check menu items (radio behavior — only one active).
  - Clicking one immediately triggers the Switching Engine.
- **Section 2 (Actions):**
  - "Open DockSwitcher" — shows/focuses the config window.
  - Separator.
  - "Quit DockSwitcher" — calls `app.exit(0)`.
- **Dynamic updates:** The tray menu MUST rebuild whenever profiles are added, removed, renamed, or reordered.

### 4.4. Settings

- **Launch at Login** toggle.
- **Show confirmation before switching** toggle (optional, default off).

---

## 5. UI/UX Design Specifications

**Vibe:** Native macOS "System Settings" feel. Clean, minimal, no flashy gradients.

**Colors:**
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background (main) | `gray-50` to `gray-100` | `slate-900` |
| Sidebar background | `gray-100` | `slate-800` |
| Sidebar active item | `bg-blue-600 text-white` | `bg-blue-600 text-white` |
| Borders | Subtle `1px` (`gray-200` / `slate-700`) | |
| Text primary | `gray-900` | `gray-100` |
| Text secondary | `gray-500` | `gray-400` |

**Window Style:**
- Title bar: Hidden with overlay style (`TitleBarStyle::Overlay`).
- Traffic lights (red/yellow/green) positioned inline with the sidebar header area.
  - `traffic_light_position: (12.0, 18.0)` (logical pixels).
- Window size: `720 x 480` default. Resizable with min `600 x 400`.
- Window appears centered on screen when opened.

**Typography:**
- System font (`-apple-system`, `BlinkMacSystemFont`). Do NOT use custom web fonts.
- Font sizes: Follow macOS conventions (13px body, 11px caption, 16-18px headings).

---

## 6. Data Schema

```typescript
type AppEntry = {
  name: string;           // e.g., "Visual Studio Code"
  path: string;           // e.g., "/Applications/Visual Studio Code.app"
  icon?: string;          // Base64 encoded PNG of the app icon (optional, cached)
  bundleId?: string;      // e.g., "com.microsoft.VSCode" (for validation)
};

type Profile = {
  id: string;             // UUID v4
  name: string;
  apps: AppEntry[];       // Ordered — index = Dock position
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
};

type Settings = {
  launchAtLogin: boolean;
  confirmBeforeSwitch: boolean;
};

type StoreSchema = {
  profiles: Profile[];
  activeProfileId: string | null;
  settings: Settings;
  schemaVersion: number;  // For future migrations
};
```

**Rust equivalent** (in `src-tauri/src/store.rs`):

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppEntry {
    pub name: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bundle_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub apps: Vec<AppEntry>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub launch_at_login: bool,
    pub confirm_before_switch: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreSchema {
    pub profiles: Vec<Profile>,
    pub active_profile_id: Option<String>,
    pub settings: Settings,
    pub schema_version: u32,
}
```

---

## 7. IPC Commands (Tauri Commands)

All communication between the React frontend and Rust backend uses Tauri's command system.

```rust
// Profile CRUD
#[tauri::command] fn get_profiles() -> Result<Vec<Profile>, String>;
#[tauri::command] fn create_profile(name: String) -> Result<Profile, String>;
#[tauri::command] fn update_profile(profile: Profile) -> Result<(), String>;
#[tauri::command] fn delete_profile(id: String) -> Result<(), String>;
#[tauri::command] fn reorder_profiles(ids: Vec<String>) -> Result<(), String>;

// Dock operations
#[tauri::command] fn apply_profile(id: String) -> Result<(), String>;
#[tauri::command] fn get_current_dock_apps() -> Result<Vec<AppEntry>, String>;
#[tauri::command] fn save_dock_to_profile(profile_id: String) -> Result<(), String>;

// App operations
#[tauri::command] fn add_app_to_profile(profile_id: String, app_path: String) -> Result<AppEntry, String>;
#[tauri::command] fn remove_app_from_profile(profile_id: String, app_index: usize) -> Result<(), String>;
#[tauri::command] fn reorder_apps(profile_id: String, app_ids: Vec<String>) -> Result<(), String>;

// Settings
#[tauri::command] fn get_settings() -> Result<Settings, String>;
#[tauri::command] fn update_settings(settings: Settings) -> Result<(), String>;

// Utilities
#[tauri::command] fn get_app_icon(app_path: String) -> Result<String, String>; // Returns base64 PNG
#[tauri::command] fn check_dockutil() -> Result<bool, String>; // Checks if dockutil is available
```

Frontend invocation:
```typescript
import { invoke } from '@tauri-apps/api/core';

const profiles = await invoke<Profile[]>('get_profiles');
await invoke('apply_profile', { id: profileId });
```

---

## 8. Implementation Phases

### Phase 1: Project Setup
1. Initialize Tauri v2 + React + Vite + TypeScript project.
2. Install and configure Tailwind CSS v4.
3. Install and configure shadcn/ui.
4. Configure `tauri.conf.json`:
   - Set `LSUIElement` (or activation policy) to hide Dock icon.
   - Configure window: overlay titlebar, traffic light position, default size.
   - Set app identifier: `com.dockswitcher.app`.
5. Embed `dockutil` binary in `src-tauri/resources/`.
6. Add `tauri-plugin-shell` for shell command execution.

### Phase 2: Core Logic (Rust Backend)
1. Create `store.rs` — JSON read/write with atomic saves + backup.
2. Create `dock_service.rs` — wrapper around `dockutil`:
   - `list_dock_apps()` — parse `dockutil --list` output.
   - `apply_profile(apps: &[AppEntry])` — remove all, add each, restart Dock.
   - `get_dockutil_path()` — resolve embedded binary path (dev vs production).
3. Create `icon_service.rs` — extract app icons from `.app` bundles.
4. Register all Tauri commands.
5. Create tray menu builder with dynamic profile list.

### Phase 3: UI (React Frontend)
1. Build the Sidebar component (profile list with drag-and-drop reorder).
2. Build the Profile Detail view (app list with drag-and-drop reorder).
3. Build the Add App dialog (native file picker).
4. Build the Settings view.
5. Wire up all IPC calls to Tauri commands.
6. Implement responsive layout and dark mode support (follows system preference).

### Phase 4: Tray & Window Management
1. Build dynamic tray menu that updates on profile changes.
2. Implement window hide-on-close behavior.
3. Implement "Open DockSwitcher" from tray.
4. Test full lifecycle: launch → tray only → open window → close window → switch profile → quit.

### Phase 5: Polish & Distribution
1. Launch at Login implementation.
2. Error handling for missing apps, missing dockutil, permission issues.
3. App icon and .dmg installer design.
4. First-run experience (create a default "Current" profile from existing Dock).

---

## 9. Technical Notes

### dockutil Binary
- `dockutil` v3.x is a Swift binary (~1MB). Place in `src-tauri/resources/dockutil`.
- In code, resolve path:
  ```rust
  let resource_path = app.path().resource_dir()?.join("dockutil");
  ```
- In development, fall back to system `dockutil` (`/opt/homebrew/bin/dockutil` or `/usr/local/bin/dockutil`).

### Permissions
- The app may need Automation/Accessibility permissions to control the Dock on newer macOS versions.
- Gracefully handle permission errors: detect, prompt user with instructions, don't crash.

### Performance
- Profile switching should complete in under 2 seconds for a typical Dock (10-15 apps).
- Icon extraction should be cached — don't re-extract on every render.
- Tray menu rebuild should be instant (<50ms).

### Testing Strategy
- Unit tests for `store.rs` (JSON serialization/deserialization, atomic write).
- Unit tests for `dock_service.rs` (parse `dockutil --list` output).
- Manual testing for tray menu, window lifecycle, and actual Dock switching.
