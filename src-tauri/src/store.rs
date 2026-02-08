use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

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

impl Default for Settings {
    fn default() -> Self {
        Self {
            launch_at_login: false,
            confirm_before_switch: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let path = Self::config_path();
        if path.exists() {
            let contents = fs::read_to_string(&path)?;
            let data: StoreData = serde_json::from_str(&contents)?;
            Ok(Self { data, path })
        } else {
            Ok(Self::default())
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
