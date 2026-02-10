mod commands;
mod dock;
mod icon;
mod store;
mod tray;

use crate::store::Store;
use crate::tray::{build_tray_menu, show_window};
use tauri::{tray::TrayIconBuilder, Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let store = Store::load().unwrap_or_default();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(std::sync::Mutex::new(store))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            let store = app.state::<std::sync::Mutex<Store>>();
            let store_guard = store.lock().unwrap();
            let menu = build_tray_menu(app.handle(), &store_guard)?;
            drop(store_guard);

            let _tray = TrayIconBuilder::with_id("main-tray")
                .tooltip("DockSwitcher")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            show_window(&window);
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    profile_id => {
                        let state = app.state::<std::sync::Mutex<Store>>();
                        let profile_exists = {
                            let store = state.lock().unwrap();
                            store.data.profiles.iter().any(|p| p.id == profile_id)
                        };
                        if profile_exists {
                            let app_clone = app.clone();
                            let id = profile_id.to_string();
                            tauri::async_runtime::spawn(async move {
                                let state = app_clone.state::<std::sync::Mutex<Store>>();
                                if let Err(e) =
                                    commands::dock::apply_profile(id, app_clone.clone(), state)
                                {
                                    eprintln!("Failed to apply profile: {}", e);
                                }
                            });
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap_or_default();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::profiles::get_profiles,
            commands::profiles::get_active_profile_id,
            commands::profiles::create_profile,
            commands::profiles::update_profile,
            commands::profiles::delete_profile,
            commands::profiles::reorder_profiles,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::dock::apply_profile,
            commands::dock::get_current_dock_apps,
            commands::dock::save_dock_to_profile,
            commands::dock::add_app_to_profile,
            commands::dock::remove_app_from_profile,
            commands::dock::check_dockutil,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DockSwitcher");
}
