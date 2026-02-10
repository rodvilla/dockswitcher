use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppEntry {
    pub name: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bundle_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub apps: Vec<AppEntry>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Settings {
    pub launch_at_login: bool,
    pub confirm_before_switch: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            launch_at_login: false,
            confirm_before_switch: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StoreData {
    pub profiles: Vec<Profile>,
    pub active_profile_id: Option<String>,
    pub settings: Settings,
    pub schema_version: u32,
}

impl Default for StoreData {
    fn default() -> Self {
        Self {
            profiles: Vec::new(),
            active_profile_id: None,
            settings: Settings::default(),
            schema_version: 1,
        }
    }
}

pub struct Store {
    pub data: StoreData,
    path: PathBuf,
}

impl Default for Store {
    fn default() -> Self {
        Self {
            data: StoreData::default(),
            path: Self::config_path(),
        }
    }
}

impl Store {
    fn config_path() -> PathBuf {
        let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        base.join("com.dockswitcher.app").join("config.json")
    }

    #[cfg(test)]
    pub fn with_path(path: PathBuf) -> Self {
        Self {
            data: StoreData::default(),
            path,
        }
    }

    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let path = Self::config_path();
        Self::load_from(path)
    }

    pub fn load_from(path: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        if path.exists() {
            let contents = fs::read_to_string(&path)?;
            let data: StoreData = serde_json::from_str(&contents)?;
            Ok(Self { data, path })
        } else {
            Ok(Self {
                data: StoreData::default(),
                path,
            })
        }
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }

        let json = serde_json::to_string_pretty(&self.data)?;

        let tmp_path = self.path.with_extension("json.tmp");
        fs::write(&tmp_path, &json)?;
        fs::rename(&tmp_path, &self.path)?;

        let backup_path = self.path.with_extension("json.bak");
        let _ = fs::write(&backup_path, &json);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_store_path() -> PathBuf {
        let dir = std::env::temp_dir().join(format!("dockswitcher-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        dir.join("config.json")
    }

    fn sample_profile(id: &str, name: &str) -> Profile {
        Profile {
            id: id.to_string(),
            name: name.to_string(),
            apps: vec![AppEntry {
                name: "Safari".to_string(),
                path: "/Applications/Safari.app".to_string(),
                icon: None,
                bundle_id: Some("com.apple.Safari".to_string()),
            }],
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn store_default_has_empty_profiles_and_v1_schema() {
        let data = StoreData::default();
        assert!(data.profiles.is_empty());
        assert_eq!(data.active_profile_id, None);
        assert_eq!(data.schema_version, 1);
        assert!(!data.settings.launch_at_login);
        assert!(!data.settings.confirm_before_switch);
    }

    #[test]
    fn store_save_and_load_roundtrip() {
        let path = temp_store_path();
        let mut store = Store::with_path(path.clone());

        store.data.profiles.push(sample_profile("p1", "Work"));
        store.data.active_profile_id = Some("p1".to_string());
        store.data.settings.confirm_before_switch = true;
        store.save().unwrap();

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.profiles.len(), 1);
        assert_eq!(loaded.data.profiles[0].name, "Work");
        assert_eq!(loaded.data.profiles[0].apps.len(), 1);
        assert_eq!(loaded.data.profiles[0].apps[0].name, "Safari");
        assert_eq!(loaded.data.active_profile_id, Some("p1".to_string()));
        assert!(loaded.data.settings.confirm_before_switch);

        fs::remove_dir_all(path.parent().unwrap()).ok();
    }

    #[test]
    fn store_save_creates_backup_file() {
        let path = temp_store_path();
        let store = Store::with_path(path.clone());
        store.save().unwrap();

        let backup = path.with_extension("json.bak");
        assert!(backup.exists());

        fs::remove_dir_all(path.parent().unwrap()).ok();
    }

    #[test]
    fn store_load_from_nonexistent_returns_default() {
        let path = PathBuf::from("/tmp/dockswitcher-test-nonexistent/config.json");
        let store = Store::load_from(path).unwrap();
        assert!(store.data.profiles.is_empty());
        assert_eq!(store.data.schema_version, 1);
    }

    #[test]
    fn store_save_atomic_write_uses_temp_file() {
        let path = temp_store_path();
        let store = Store::with_path(path.clone());
        store.save().unwrap();

        assert!(path.exists());
        assert!(!path.with_extension("json.tmp").exists());

        fs::remove_dir_all(path.parent().unwrap()).ok();
    }

    #[test]
    fn store_multiple_profiles_roundtrip() {
        let path = temp_store_path();
        let mut store = Store::with_path(path.clone());

        store.data.profiles.push(sample_profile("p1", "Work"));
        store.data.profiles.push(sample_profile("p2", "Personal"));
        store.data.profiles.push(sample_profile("p3", "Dev"));
        store.save().unwrap();

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.profiles.len(), 3);
        assert_eq!(loaded.data.profiles[0].name, "Work");
        assert_eq!(loaded.data.profiles[1].name, "Personal");
        assert_eq!(loaded.data.profiles[2].name, "Dev");

        fs::remove_dir_all(path.parent().unwrap()).ok();
    }

    #[test]
    fn app_entry_optional_fields_skip_when_none() {
        let entry = AppEntry {
            name: "Test".to_string(),
            path: "/Applications/Test.app".to_string(),
            icon: None,
            bundle_id: None,
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(!json.contains("icon"));
        assert!(!json.contains("bundle_id"));
    }

    #[test]
    fn app_entry_optional_fields_present_when_some() {
        let entry = AppEntry {
            name: "Test".to_string(),
            path: "/Applications/Test.app".to_string(),
            icon: Some("base64data".to_string()),
            bundle_id: Some("com.test.app".to_string()),
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("icon"));
        assert!(json.contains("bundle_id"));
    }

    #[test]
    fn store_data_deserializes_with_missing_optional_fields() {
        let json = r#"{
            "profiles": [],
            "active_profile_id": null,
            "settings": {
                "launch_at_login": false,
                "confirm_before_switch": false
            },
            "schema_version": 1
        }"#;
        let data: StoreData = serde_json::from_str(json).unwrap();
        assert!(data.profiles.is_empty());
        assert_eq!(data.schema_version, 1);
    }

    #[test]
    fn profile_with_apps_serialization_roundtrip() {
        let profile = Profile {
            id: "test-id".to_string(),
            name: "Test Profile".to_string(),
            apps: vec![
                AppEntry {
                    name: "Safari".to_string(),
                    path: "/Applications/Safari.app".to_string(),
                    icon: None,
                    bundle_id: Some("com.apple.Safari".to_string()),
                },
                AppEntry {
                    name: "Visual Studio Code".to_string(),
                    path: "/Applications/Visual Studio Code.app".to_string(),
                    icon: None,
                    bundle_id: None,
                },
            ],
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        };

        let json = serde_json::to_string_pretty(&profile).unwrap();
        let deserialized: Profile = serde_json::from_str(&json).unwrap();
        assert_eq!(profile, deserialized);
    }

    #[test]
    fn store_overwrite_preserves_data() {
        let path = temp_store_path();
        let mut store = Store::with_path(path.clone());

        store.data.profiles.push(sample_profile("p1", "First"));
        store.save().unwrap();

        store.data.profiles[0].name = "Updated".to_string();
        store.data.profiles.push(sample_profile("p2", "Second"));
        store.save().unwrap();

        let loaded = Store::load_from(path.clone()).unwrap();
        assert_eq!(loaded.data.profiles.len(), 2);
        assert_eq!(loaded.data.profiles[0].name, "Updated");
        assert_eq!(loaded.data.profiles[1].name, "Second");

        fs::remove_dir_all(path.parent().unwrap()).ok();
    }
}
