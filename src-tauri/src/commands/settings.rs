use crate::store::{Settings, Store};
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
pub fn get_settings(state: tauri::State<'_, std::sync::Mutex<Store>>) -> Result<Settings, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.settings.clone())
}

#[tauri::command]
pub fn update_settings(
    settings: Settings,
    app: tauri::AppHandle,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let previous_launch_at_login = {
        let store = state.lock().map_err(|e| e.to_string())?;
        store.data.settings.launch_at_login
    };

    if settings.launch_at_login != previous_launch_at_login {
        let autostart = app.autolaunch();
        if settings.launch_at_login {
            autostart.enable().map_err(|e| e.to_string())?;
        } else {
            autostart.disable().map_err(|e| e.to_string())?;
        }
    }

    let mut store = state.lock().map_err(|e| e.to_string())?;
    store.data.settings = settings;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::Store;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::Mutex;
    use tauri::test::{mock_builder, mock_context, noop_assets, MockRuntime};
    use tauri::Manager;

    fn temp_store_path() -> PathBuf {
        let dir = std::env::temp_dir().join(format!("dockswitcher-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        dir.join("config.json")
    }

    fn cleanup(path: &PathBuf) {
        if let Some(parent) = path.parent() {
            fs::remove_dir_all(parent).ok();
        }
    }

    fn test_app_with_store(path: PathBuf) -> tauri::App<MockRuntime> {
        mock_builder()
            .manage(Mutex::new(Store::with_path(path)))
            .build(mock_context(noop_assets()))
            .unwrap()
    }

    #[test]
    fn get_settings_returns_default() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let settings = get_settings(state).unwrap();
        assert!(!settings.launch_at_login);
        assert!(!settings.confirm_before_switch);

        cleanup(&path);
    }

    #[test]
    fn update_settings_persists_changes_when_launch_flag_same() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let settings = Settings {
            launch_at_login: false,
            confirm_before_switch: true,
        };

        {
            let mut store = state.lock().unwrap();
            store.data.settings = settings.clone();
            store.save().unwrap();
        }

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.settings, settings);

        let fetched = get_settings(state).unwrap();
        assert_eq!(fetched, settings);

        cleanup(&path);
    }
}
