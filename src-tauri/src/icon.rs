use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use icns::{IconFamily, IconType};

pub(crate) fn extract_app_icon(app_path: &str) -> Option<String> {
    let info_plist_path = std::path::Path::new(app_path)
        .join("Contents")
        .join("Info.plist");
    let info_plist_file = std::fs::File::open(&info_plist_path).ok()?;
    let info_plist = plist::Value::from_reader(info_plist_file).ok()?;

    let icon_name = info_plist
        .as_dictionary()
        .and_then(|dict| dict.get("CFBundleIconFile"))
        .and_then(|value| value.as_string())
        .map(|value| value.to_string());

    let resources_dir = std::path::Path::new(app_path)
        .join("Contents")
        .join("Resources");

    let icon_path = if let Some(name) = icon_name {
        let file_name = if name.ends_with(".icns") {
            name
        } else {
            format!("{}.icns", name)
        };
        let candidate = resources_dir.join(&file_name);
        if candidate.exists() {
            Some(candidate)
        } else {
            None
        }
    } else {
        None
    };

    let fallback_path = resources_dir.join("AppIcon.icns");
    let icns_path = if let Some(path) = icon_path {
        path
    } else if fallback_path.exists() {
        fallback_path
    } else {
        return None;
    };

    let icon_family = IconFamily::read(std::fs::File::open(icns_path).ok()?).ok()?;

    let preferred_types = [
        IconType::RGBA32_128x128,
        IconType::RGBA32_64x64,
        IconType::RGBA32_256x256,
        IconType::RGBA32_32x32,
    ];

    for icon_type in preferred_types {
        if let Ok(icon) = icon_family.get_icon_with_type(icon_type) {
            let mut png_bytes = Vec::new();
            if icon.write_png(&mut png_bytes).is_ok() {
                return Some(STANDARD.encode(png_bytes));
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::extract_app_icon;
    use base64::engine::general_purpose::STANDARD;
    use base64::Engine;

    fn find_test_app() -> Option<&'static str> {
        let candidates = [
            "/Applications/Safari.app",
            "/System/Applications/Calculator.app",
            "/System/Applications/Safari.app",
        ];
        candidates
            .iter()
            .copied()
            .find(|path| std::path::Path::new(path).exists())
    }

    #[test]
    fn extract_app_icon_returns_some_for_known_app() {
        let app_path = match find_test_app() {
            Some(path) => path,
            None => return,
        };

        let icon = extract_app_icon(app_path);
        assert!(icon.is_some());
    }

    #[test]
    fn extract_app_icon_returns_none_for_missing_app() {
        let icon = extract_app_icon("/Applications/DefinitelyMissing.app");
        assert!(icon.is_none());
    }

    #[test]
    fn extract_app_icon_returns_valid_png_base64() {
        let app_path = match find_test_app() {
            Some(path) => path,
            None => return,
        };

        let icon = extract_app_icon(app_path).expect("expected icon data");
        let decoded = STANDARD.decode(icon).expect("expected valid base64");
        assert!(decoded.starts_with(b"\x89PNG"));
    }
}
