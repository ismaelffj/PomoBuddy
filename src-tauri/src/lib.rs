mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::write_settings_atomic,
            commands::append_history_line,
            commands::read_history_file,
            commands::get_scene_roots,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                // In dev, bundle.resources hasn't been staged, so the
                // SceneLoader points at <repo>/scenes via
                // CARGO_MANIFEST_DIR/../scenes (see commands::get_scene_roots).
                // That path is outside the default FS and asset-protocol
                // scopes, so reads from it fail silently. Whitelist it.
                use std::path::PathBuf;
                use tauri::Manager;
                use tauri_plugin_fs::FsExt;

                let source_scenes = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("..")
                    .join("scenes");

                if let Ok(canonical) = source_scenes.canonicalize() {
                    log::info!("dev: whitelisting source scenes dir {canonical:?}");
                    let _ = app.fs_scope().allow_directory(&canonical, true);
                    let _ = app.asset_protocol_scope().allow_directory(&canonical, true);
                } else {
                    log::warn!("dev: source scenes dir not found at {source_scenes:?}");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
