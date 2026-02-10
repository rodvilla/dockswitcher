use crate::store::{Settings, Store};

#[tauri::command]
pub fn get_settings(state: tauri::State<'_, std::sync::Mutex<Store>>) -> Result<Settings, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.settings.clone())
}

#[tauri::command]
pub fn update_settings(
    settings: Settings,
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<(), String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    store.data.settings = settings;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
