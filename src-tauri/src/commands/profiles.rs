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
        default_apps: Vec::new(),
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
    let profile_id = profile.id.clone();
    let profile_exists = store.data.profiles.iter().any(|p| p.id == profile.id);
    if !profile_exists {
        return Err(format!("Profile not found: {}", profile_id));
    }
    if let Some(p) = store.data.profiles.iter_mut().find(|p| p.id == profile.id) {
        p.name = profile.name;
        p.apps = profile.apps;
        p.default_apps = profile.default_apps;
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
    let profile_exists = store.data.profiles.iter().any(|p| p.id == id);
    if !profile_exists {
        return Err(format!("Profile not found: {}", id));
    }
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
    let existing_ids: std::collections::HashSet<_> =
        store.data.profiles.iter().map(|p| p.id.clone()).collect();
    let provided_ids: std::collections::HashSet<_> = ids.iter().cloned().collect();

    if ids.len() != store.data.profiles.len() {
        return Err(format!(
            "Expected {} IDs, got {}",
            store.data.profiles.len(),
            ids.len()
        ));
    }

    if existing_ids != provided_ids {
        let missing: Vec<_> = existing_ids.difference(&provided_ids).collect();
        let extra: Vec<_> = provided_ids.difference(&existing_ids).collect();
        let mut errors = Vec::new();
        if !missing.is_empty() {
            errors.push(format!("Missing IDs: {:?}", missing));
        }
        if !extra.is_empty() {
            errors.push(format!("Invalid IDs: {:?}", extra));
        }
        return Err(errors.join("; "));
    }

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::{AppEntry, DefaultApp, Store};
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

    fn sample_app_entry(name: &str, path: &str) -> AppEntry {
        AppEntry {
            name: name.to_string(),
            path: path.to_string(),
            icon: None,
            bundle_id: None,
        }
    }

    #[test]
    fn get_profiles_returns_empty_on_fresh_store() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let profiles = get_profiles(state).unwrap();
        assert!(profiles.is_empty());

        cleanup(&path);
    }

    #[test]
    fn create_profile_persists_and_returns_profile() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let profile = create_profile("Work".to_string(), state.clone()).unwrap();
        let profiles = get_profiles(state).unwrap();

        assert_eq!(profiles.len(), 1);
        assert_eq!(profiles[0].id, profile.id);
        assert_eq!(profiles[0].name, "Work");

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.profiles.len(), 1);

        cleanup(&path);
    }

    #[test]
    fn update_profile_updates_fields() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let mut profile = create_profile("Work".to_string(), state.clone()).unwrap();
        profile.name = "Updated".to_string();
        profile.apps = vec![sample_app_entry("Safari", "/Applications/Safari.app")];
        profile.default_apps = vec![DefaultApp {
            bundle_id: "com.apple.mail".to_string(),
            role: "email".to_string(),
        }];

        update_profile(profile.clone(), state.clone()).unwrap();

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.profiles.len(), 1);
        assert_eq!(loaded.data.profiles[0].name, "Updated");
        assert_eq!(loaded.data.profiles[0].apps.len(), 1);
        assert_eq!(loaded.data.profiles[0].default_apps.len(), 1);

        cleanup(&path);
    }

    #[test]
    fn update_profile_missing_returns_error() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let profile = Profile {
            id: "missing".to_string(),
            name: "Missing".to_string(),
            apps: Vec::new(),
            default_apps: Vec::new(),
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        };

        let error = update_profile(profile, state).unwrap_err();
        assert!(error.contains("Profile not found"));

        cleanup(&path);
    }

    #[test]
    fn delete_profile_removes_and_clears_active() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let profile = create_profile("Work".to_string(), state.clone()).unwrap();
        create_profile("Personal".to_string(), state.clone()).unwrap();

        {
            let mut store = state.lock().unwrap();
            store.data.active_profile_id = Some(profile.id.clone());
            store.save().unwrap();
        }

        delete_profile(profile.id.clone(), state.clone()).unwrap();

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.profiles.len(), 1);
        assert_eq!(loaded.data.active_profile_id, None);

        cleanup(&path);
    }

    #[test]
    fn delete_profile_missing_returns_error() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let error = delete_profile("missing".to_string(), state).unwrap_err();
        assert!(error.contains("Profile not found"));

        cleanup(&path);
    }

    #[test]
    fn reorder_profiles_reorders_in_order() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let p1 = create_profile("One".to_string(), state.clone()).unwrap();
        let p2 = create_profile("Two".to_string(), state.clone()).unwrap();
        let p3 = create_profile("Three".to_string(), state.clone()).unwrap();

        reorder_profiles(
            vec![p3.id.clone(), p1.id.clone(), p2.id.clone()],
            state.clone(),
        )
        .unwrap();

        let profiles = get_profiles(state).unwrap();
        let ids: Vec<String> = profiles.into_iter().map(|p| p.id).collect();
        assert_eq!(ids, vec![p3.id, p1.id, p2.id]);

        cleanup(&path);
    }

    #[test]
    fn reorder_profiles_missing_ids_returns_error() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let p1 = create_profile("One".to_string(), state.clone()).unwrap();
        let _p2 = create_profile("Two".to_string(), state.clone()).unwrap();

        let error = reorder_profiles(vec![p1.id.clone()], state).unwrap_err();
        assert!(error.contains("Expected") || error.contains("Missing IDs"));

        cleanup(&path);
    }

    #[test]
    fn reorder_profiles_extra_ids_returns_error() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let p1 = create_profile("One".to_string(), state.clone()).unwrap();
        let p2 = create_profile("Two".to_string(), state.clone()).unwrap();

        let error = reorder_profiles(
            vec![p1.id.clone(), p2.id.clone(), "extra".to_string()],
            state,
        )
        .unwrap_err();
        assert!(error.contains("Expected") || error.contains("Invalid IDs"));

        cleanup(&path);
    }

    #[test]
    fn reorder_profiles_duplicate_ids_returns_error() {
        let path = temp_store_path();
        let app = test_app_with_store(path.clone());
        let state = app.state::<Mutex<Store>>();

        let p1 = create_profile("One".to_string(), state.clone()).unwrap();
        let p2 = create_profile("Two".to_string(), state.clone()).unwrap();

        let error = reorder_profiles(
            vec![p1.id.clone(), p1.id.clone(), p2.id.clone()],
            state,
        )
        .unwrap_err();
        assert!(error.contains("Expected"));

        cleanup(&path);
    }
}
