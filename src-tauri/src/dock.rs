use crate::store::AppEntry;
use tauri::Manager;

pub(crate) fn percent_decode(input: &str) -> String {
    let mut result = Vec::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&input[i + 1..i + 3], 16) {
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
                    path: clean_path.clone(),
                    icon: crate::icon::extract_app_icon(&clean_path),
                    bundle_id,
                });
            }
        }
    }
    apps
}

pub(crate) fn find_dockutil_path() -> Option<String> {
    let candidates = ["/opt/homebrew/bin/dockutil", "/usr/local/bin/dockutil"];
    for path in &candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}

pub(crate) fn get_dockutil_path(app: &tauri::AppHandle) -> Result<String, String> {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled_path = resource_dir.join("resources").join("dockutil");
        if bundled_path.exists() {
            return Ok(bundled_path.to_string_lossy().to_string());
        }
    }

    find_dockutil_path()
        .ok_or_else(|| "dockutil not found. Install it with: brew install dockutil".to_string())
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
        assert_eq!(
            apps[0].path,
            "/Applications/Visual Studio Code - Insiders.app"
        );
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
        let output =
            "NoSlash\tfile:///Applications/NoSlash.app\tpersistentApps\tplist\tcom.noslash";
        let apps = parse_dockutil_output(output);
        assert_eq!(apps.len(), 1);
        assert_eq!(apps[0].path, "/Applications/NoSlash.app");
    }

    #[test]
    fn percent_decode_basic() {
        assert_eq!(
            percent_decode("/Applications/Test%20App.app"),
            "/Applications/Test App.app"
        );
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
        assert_eq!(
            percent_decode("/Applications/Safari.app"),
            "/Applications/Safari.app"
        );
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
