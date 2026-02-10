mod store;

use store::{AppEntry, Profile, Settings, Store};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager, WebviewWindow, WindowEvent,
};

fn show_window(window: &WebviewWindow) {
    window.show().unwrap_or_default();
    window.set_focus().unwrap_or_default();
}

fn build_tray_menu(app: &tauri::AppHandle, store: &Store) -> tauri::Result<Menu<tauri::Wry>> {
    let separator = PredefinedMenuItem::separator(app)?;
    let open_item = MenuItem::with_id(app, "open", "Open DockSwitcher", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit DockSwitcher", true, None::<&str>)?;

    let menu = Menu::new(app)?;

    for profile in &store.data.profiles {
        let is_active = store
            .data
            .active_profile_id
            .as_ref()
            .map(|id| id == &profile.id)
            .unwrap_or(false);

        let item = CheckMenuItem::with_id(app, &profile.id, &profile.name, true, is_active, None::<&str>)?;
        menu.append(&item)?;
    }

    menu.append(&separator)?;
    menu.append(&open_item)?;
    menu.append(&separator2)?;
    menu.append(&quit_item)?;

    Ok(menu)
}

#[tauri::command]
fn get_profiles(state: tauri::State<'_, std::sync::Mutex<Store>>) -> Result<Vec<Profile>, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.profiles.clone())
}

#[tauri::command]
fn get_active_profile_id(state: tauri::State<'_, std::sync::Mutex<Store>>) -> Result<Option<String>, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.active_profile_id.clone())
}

#[tauri::command]
fn create_profile(
    name: String,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<Profile, String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    let profile = Profile {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        apps: Vec::new(),
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    store.data.profiles.push(profile.clone());
    store.save().map_err(|e| e.to_string())?;
    Ok(profile)
}

#[tauri::command]
fn update_profile(
    profile: Profile,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    if let Some(p) = store.data.profiles.iter_mut().find(|p| p.id == profile.id) {
        p.name = profile.name;
        p.apps = profile.apps;
        p.updated_at = chrono::Utc::now().to_rfc3339();
    }
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_profile(
    id: String,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    store.data.profiles.retain(|p| p.id != id);
    if store.data.active_profile_id.as_ref() == Some(&id) {
        store.data.active_profile_id = None;
    }
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn reorder_profiles(
    ids: Vec<String>,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    let mut reordered = Vec::new();
    for id in &ids {
        if let Some(p) = store.data.profiles.iter().find(|p| &p.id == id) {
            reordered.push(p.clone());
        }
    }
    store.data.profiles = reordered;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_settings(state: tauri::State<'_, std::sync::Mutex<Store>>) -> Result<Settings, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.settings.clone())
}

#[tauri::command]
fn update_settings(
    settings: Settings,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    store.data.settings = settings;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

pub(crate) fn percent_decode(input: &str) -> String {
    let mut result = Vec::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(
                &input[i + 1..i + 3],
                16,
            ) {
                result.push(byte);
                i += 3;
                continue;
            }
        }
        result.push(bytes[i]);
        i += 1;
    }
    String::from_utf8(result).unwrap_or_else(|_| input.to_string())
}

/// Parse the output of `dockutil --list` into a list of AppEntry structs.
///
/// Each line has tab-separated fields:
/// `Name\tfile:///path/to/App.app/\tpersistentApps\tplist_path\tbundle_id`
pub(crate) fn parse_dockutil_output(output: &str) -> Vec<AppEntry> {
    let mut apps = Vec::new();
    for line in output.lines() {
        let fields: Vec<&str> = line.split('\t').collect();
        if fields.len() >= 2 {
            let name = fields[0].trim().to_string();
            let raw_path = fields[1].trim_start_matches("file://");
            let path = percent_decode(raw_path);
            if path.ends_with(".app/") || path.ends_with(".app") {
                let clean_path = path.trim_end_matches('/').to_string();
                let bundle_id = if fields.len() >= 5 {
                    Some(fields[4].to_string())
                } else {
                    None
                };
                apps.push(AppEntry {
                    name,
                    path: clean_path,
                    icon: None,
                    bundle_id,
                });
            }
        }
    }
    apps
}

fn find_dockutil_path() -> Option<String> {
    let candidates = [
        "/opt/homebrew/bin/dockutil",
        "/usr/local/bin/dockutil",
    ];
    for path in &candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}

fn get_dockutil_path(app: &tauri::AppHandle) -> Result<String, String> {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled_path = resource_dir.join("resources").join("dockutil");
        if bundled_path.exists() {
            return Ok(bundled_path.to_string_lossy().to_string());
        }
    }

    find_dockutil_path().ok_or_else(|| {
        "dockutil not found. Install it with: brew install dockutil".to_string()
    })
}

#[tauri::command]
fn check_dockutil(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(get_dockutil_path(&app).is_ok())
}

#[tauri::command]
fn get_current_dock_apps(app: tauri::AppHandle) -> Result<Vec<AppEntry>, String> {
    let dockutil = get_dockutil_path(&app)?;
    let output = std::process::Command::new(&dockutil)
        .arg("--list")
        .output()
        .map_err(|e| format!("Failed to run dockutil: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "dockutil --list failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_dockutil_output(&stdout))
}

#[tauri::command]
fn apply_profile(
    id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let dockutil = get_dockutil_path(&app)?;

    let profile = {
        let store = state.lock().map_err(|e| e.to_string())?;
        store
            .data
            .profiles
            .iter()
            .find(|p| p.id == id)
            .cloned()
            .ok_or_else(|| "Profile not found".to_string())?
    };

    let remove_output = std::process::Command::new(&dockutil)
        .args(["--remove", "all", "--no-restart"])
        .output()
        .map_err(|e| format!("Failed to remove dock items: {}", e))?;

    if !remove_output.status.success() {
        return Err(format!(
            "dockutil --remove failed: {}",
            String::from_utf8_lossy(&remove_output.stderr)
        ));
    }

    let mut warnings = Vec::new();
    for entry in &profile.apps {
        if !std::path::Path::new(&entry.path).exists() {
            warnings.push(format!("{} not found at {}", entry.name, entry.path));
            continue;
        }
        let add_output = std::process::Command::new(&dockutil)
            .args(["--add", &entry.path, "--no-restart"])
            .output()
            .map_err(|e| format!("Failed to add {}: {}", entry.name, e))?;

        if !add_output.status.success() {
            warnings.push(format!(
                "Failed to add {}: {}",
                entry.name,
                String::from_utf8_lossy(&add_output.stderr)
            ));
        }
    }

    std::process::Command::new("killall")
        .arg("Dock")
        .output()
        .map_err(|e| format!("Failed to restart Dock: {}", e))?;

    {
        let mut store = state.lock().map_err(|e| e.to_string())?;
        store.data.active_profile_id = Some(id);
        store.save().map_err(|e| e.to_string())?;
    }

    if let Some(tray) = app.tray_by_id("main-tray") {
        let store = state.lock().map_err(|e| e.to_string())?;
        if let Ok(menu) = build_tray_menu(&app, &store) {
            let _ = tray.set_menu(Some(menu));
        }
    }

    if !warnings.is_empty() {
        eprintln!("Warnings during profile apply: {:?}", warnings);
    }

    Ok(())
}

#[tauri::command]
fn add_app_to_profile(
    profile_id: String,
    app_path: String,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<AppEntry, String> {
    let name = std::path::Path::new(&app_path)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let entry = AppEntry {
        name,
        path: app_path,
        icon: None,
        bundle_id: None,
    };

    let mut store = state.lock().map_err(|e| e.to_string())?;
    if let Some(profile) = store.data.profiles.iter_mut().find(|p| p.id == profile_id) {
        profile.apps.push(entry.clone());
        profile.updated_at = chrono::Utc::now().to_rfc3339();
    } else {
        return Err("Profile not found".to_string());
    }
    store.save().map_err(|e| e.to_string())?;
    Ok(entry)
}

#[tauri::command]
fn remove_app_from_profile(
    profile_id: String,
    app_index: usize,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    if let Some(profile) = store.data.profiles.iter_mut().find(|p| p.id == profile_id) {
        if app_index < profile.apps.len() {
            profile.apps.remove(app_index);
            profile.updated_at = chrono::Utc::now().to_rfc3339();
        }
    }
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn save_dock_to_profile(
    profile_id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<Vec<AppEntry>, String> {
    let apps = get_current_dock_apps(app)?;
    let mut store = state.lock().map_err(|e| e.to_string())?;
    if let Some(profile) = store.data.profiles.iter_mut().find(|p| p.id == profile_id) {
        profile.apps = apps.clone();
        profile.updated_at = chrono::Utc::now().to_rfc3339();
    } else {
        return Err("Profile not found".to_string());
    }
    store.save().map_err(|e| e.to_string())?;
    Ok(apps)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let store = Store::load().unwrap_or_default();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(std::sync::Mutex::new(store))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            let store = app.state::<std::sync::Mutex<Store>>();
            let store_guard = store.lock().unwrap();
            let menu = build_tray_menu(app.handle(), &store_guard)?;
            drop(store_guard);

            let _tray = TrayIconBuilder::with_id("main-tray")
                .tooltip("DockSwitcher")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                show_window(&window);
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        profile_id => {
                            let state = app.state::<std::sync::Mutex<Store>>();
                            let profile_exists = {
                                let store = state.lock().unwrap();
                                store.data.profiles.iter().any(|p| p.id == profile_id)
                            };
                            if profile_exists {
                                let app_clone = app.clone();
                                let id = profile_id.to_string();
                                tauri::async_runtime::spawn(async move {
                                    let state = app_clone.state::<std::sync::Mutex<Store>>();
                                    if let Err(e) = apply_profile(id, app_clone.clone(), state) {
                                        eprintln!("Failed to apply profile: {}", e);
                                    }
                                });
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap_or_default();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_profiles,
            get_active_profile_id,
            create_profile,
            update_profile,
            delete_profile,
            reorder_profiles,
            get_settings,
            update_settings,
            apply_profile,
            get_current_dock_apps,
            save_dock_to_profile,
            add_app_to_profile,
            remove_app_from_profile,
            check_dockutil,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DockSwitcher");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_dockutil_standard_output() {
        let output = "Zen\tfile:///Applications/Zen.app/\tpersistentApps\t/Users/test/Library/Preferences/com.apple.dock.plist\tapp.zen-browser.zen\n\
                       Safari\tfile:///Applications/Safari.app/\tpersistentApps\t/Users/test/Library/Preferences/com.apple.dock.plist\tcom.apple.Safari";
        let apps = parse_dockutil_output(output);
        assert_eq!(apps.len(), 2);

        assert_eq!(apps[0].name, "Zen");
        assert_eq!(apps[0].path, "/Applications/Zen.app");
        assert_eq!(apps[0].bundle_id, Some("app.zen-browser.zen".to_string()));

        assert_eq!(apps[1].name, "Safari");
        assert_eq!(apps[1].path, "/Applications/Safari.app");
        assert_eq!(apps[1].bundle_id, Some("com.apple.Safari".to_string()));
    }

    #[test]
    fn parse_dockutil_url_encoded_paths() {
        let output = "Visual Studio Code - Insiders\tfile:///Applications/Visual%20Studio%20Code%20-%20Insiders.app/\tpersistentApps\t/Users/test/Library/Preferences/com.apple.dock.plist\tcom.microsoft.VSCodeInsiders";
        let apps = parse_dockutil_output(output);
        assert_eq!(apps.len(), 1);
        assert_eq!(apps[0].name, "Visual Studio Code - Insiders");
        assert_eq!(apps[0].path, "/Applications/Visual Studio Code - Insiders.app");
    }

    #[test]
    fn parse_dockutil_empty_output() {
        let apps = parse_dockutil_output("");
        assert!(apps.is_empty());
    }

    #[test]
    fn parse_dockutil_skips_non_app_entries() {
        let output = "Downloads\tfile:///Users/test/Downloads/\tpersistentOthers\t/Users/test/Library/Preferences/com.apple.dock.plist\t";
        let apps = parse_dockutil_output(output);
        assert!(apps.is_empty());
    }

    #[test]
    fn parse_dockutil_minimal_two_field_line() {
        let output = "TestApp\tfile:///Applications/TestApp.app/";
        let apps = parse_dockutil_output(output);
        assert_eq!(apps.len(), 1);
        assert_eq!(apps[0].name, "TestApp");
        assert_eq!(apps[0].path, "/Applications/TestApp.app");
        assert_eq!(apps[0].bundle_id, None);
    }

    #[test]
    fn parse_dockutil_ignores_malformed_lines() {
        let output = "no-tabs-here\n\
                       Valid\tfile:///Applications/Valid.app/\tpersistentApps\tplist\tcom.valid";
        let apps = parse_dockutil_output(output);
        assert_eq!(apps.len(), 1);
        assert_eq!(apps[0].name, "Valid");
    }

    #[test]
    fn parse_dockutil_path_without_trailing_slash() {
        let output = "NoSlash\tfile:///Applications/NoSlash.app\tpersistentApps\tplist\tcom.noslash";
        let apps = parse_dockutil_output(output);
        assert_eq!(apps.len(), 1);
        assert_eq!(apps[0].path, "/Applications/NoSlash.app");
    }

    #[test]
    fn percent_decode_basic() {
        assert_eq!(percent_decode("/Applications/Test%20App.app"), "/Applications/Test App.app");
    }

    #[test]
    fn percent_decode_multiple_encoded_chars() {
        assert_eq!(
            percent_decode("/Applications/My%20App%20%28Beta%29.app"),
            "/Applications/My App (Beta).app"
        );
    }

    #[test]
    fn percent_decode_no_encoding() {
        assert_eq!(percent_decode("/Applications/Safari.app"), "/Applications/Safari.app");
    }

    #[test]
    fn percent_decode_incomplete_sequence() {
        assert_eq!(percent_decode("test%2"), "test%2");
        assert_eq!(percent_decode("test%"), "test%");
    }

    #[test]
    fn percent_decode_invalid_hex() {
        assert_eq!(percent_decode("test%ZZ"), "test%ZZ");
    }
}
