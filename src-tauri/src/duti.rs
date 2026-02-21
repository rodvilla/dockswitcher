use tauri::Manager;

pub(crate) fn find_duti_path() -> Option<String> {
    let candidates = ["/opt/homebrew/bin/duti", "/usr/local/bin/duti"];
    for path in &candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}

pub(crate) fn get_duti_path(app: &tauri::AppHandle) -> Result<String, String> {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled_path = resource_dir.join("resources").join("duti");
        if bundled_path.exists() {
            return Ok(bundled_path.to_string_lossy().to_string());
        }
    }

    find_duti_path().ok_or_else(|| "duti not found. Install it with: brew install duti".to_string())
}

pub(crate) fn url_schemes_for_role(role: &str) -> Vec<&'static str> {
    match role {
        "browser" => vec!["http", "https"],
        "email" => vec!["mailto"],
        "ftp" => vec!["ftp"],
        "calendar" => vec!["webcal"],
        _ => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn url_schemes_for_browser() {
        let schemes = url_schemes_for_role("browser");
        assert_eq!(schemes, vec!["http", "https"]);
    }

    #[test]
    fn url_schemes_for_email() {
        let schemes = url_schemes_for_role("email");
        assert_eq!(schemes, vec!["mailto"]);
    }

    #[test]
    fn url_schemes_for_ftp() {
        let schemes = url_schemes_for_role("ftp");
        assert_eq!(schemes, vec!["ftp"]);
    }

    #[test]
    fn url_schemes_for_calendar() {
        let schemes = url_schemes_for_role("calendar");
        assert_eq!(schemes, vec!["webcal"]);
    }

    #[test]
    fn url_schemes_for_unknown_role_returns_empty() {
        let schemes = url_schemes_for_role("video_player");
        assert!(schemes.is_empty());
    }

    #[test]
    fn find_duti_path_returns_option() {
        let result = find_duti_path();
        if let Some(path) = &result {
            assert!(std::path::Path::new(path).exists());
        }
    }
}
