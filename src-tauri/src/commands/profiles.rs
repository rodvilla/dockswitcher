use crate::store::{Profile, Store};

#[tauri::command]
pub fn get_profiles(
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<Vec<Profile>, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.profiles.clone())
}

#[tauri::command]
pub fn get_active_profile_id(
    state: tauri::State<'_, std::sync::Mutex<Store>>,
) -> Result<Option<String>, String> {
    let store = state.lock().map_err(|e| e.to_string())?;
    Ok(store.data.active_profile_id.clone())
}

#[tauri::command]
pub fn create_profile(
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
pub fn update_profile(
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
pub fn delete_profile(
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
pub fn reorder_profiles(
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
