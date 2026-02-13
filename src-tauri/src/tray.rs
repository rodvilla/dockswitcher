use crate::store::Store;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    Manager, WebviewWindow,
};

pub(crate) fn show_window(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        let _ = window
            .app_handle()
            .set_activation_policy(tauri::ActivationPolicy::Regular);
    }
    window.show().unwrap_or_default();
    window.set_focus().unwrap_or_default();
}

pub(crate) fn build_tray_menu(
    app: &tauri::AppHandle,
    store: &Store,
) -> tauri::Result<Menu<tauri::Wry>> {
    let separator = PredefinedMenuItem::separator(app)?;
    let open_item = MenuItem::with_id(app, "open", "Open DockSwitcher", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit DockSwitcher", true, None::<&str>)?;

    let menu = Menu::new(app)?;

    for profile in &store.data.profiles {
        let is_active = store
            .data
            .active_profile_id
            .as_ref()
            .map(|id| id == &profile.id)
            .unwrap_or(false);

        let item = CheckMenuItem::with_id(
            app,
            &profile.id,
            &profile.name,
            true,
            is_active,
            None::<&str>,
        )?;
        menu.append(&item)?;
    }

    menu.append(&separator)?;
    menu.append(&open_item)?;
    menu.append(&separator2)?;
    menu.append(&quit_item)?;

    Ok(menu)
}
