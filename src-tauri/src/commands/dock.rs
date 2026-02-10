use crate::dock::{get_dockutil_path, parse_dockutil_output};
use crate::store::{AppEntry, Store};
use crate::tray::build_tray_menu;

#[tauri::command]
pub fn check_dockutil(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(get_dockutil_path(&app).is_ok())
}

#[tauri::command]
pub fn get_current_dock_apps(app: tauri::AppHandle) -> Result<Vec<AppEntry>, String> {
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
pub fn apply_profile(
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
pub fn add_app_to_profile(
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
        path: app_path.clone(),
        icon: crate::icon::extract_app_icon(&app_path),
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
pub fn remove_app_from_profile(
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
pub fn save_dock_to_profile(
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
