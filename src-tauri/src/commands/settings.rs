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
