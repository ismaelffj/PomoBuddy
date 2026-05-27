use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

#[derive(serde::Serialize)]
pub struct SceneInfo {
    pub id: String,
    #[serde(rename = "baseDir")]
    pub base_dir: String,
    #[serde(rename = "manifestJson")]
    pub manifest_json: String,
}

#[tauri::command]
pub fn load_scenes(app: tauri::AppHandle) -> Result<Vec<SceneInfo>, String> {
    // Bundled scenes:
    //   - debug: CARGO_MANIFEST_DIR/../scenes (the source repo)
    //   - release: resource_dir/_up_/scenes (Tauri prepends _up_ for
    //     paths that walk above the project root in bundle.resources)
    let bundled: PathBuf = if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("scenes")
    } else {
        app.path()
            .resource_dir()
            .map_err(|e| format!("resource_dir failed: {e}"))?
            .join("_up_")
            .join("scenes")
    };

    let user = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir failed: {e}"))?
        .join("scenes");

    let mut scenes = Vec::new();
    for root in [&bundled, &user] {
        if !root.is_dir() {
            continue;
        }
        let entries = match fs::read_dir(root) {
            Ok(e) => e,
            Err(err) => {
                log::warn!("read_dir {root:?} failed: {err}");
                continue;
            }
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let manifest_path = path.join("scene.json");
            let manifest_json = match fs::read_to_string(&manifest_path) {
                Ok(j) => j,
                Err(_) => continue,
            };
            let id = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default()
                .to_string();
            let base_dir = match path.canonicalize() {
                Ok(p) => p.to_string_lossy().to_string(),
                Err(_) => path.to_string_lossy().to_string(),
            };
            scenes.push(SceneInfo {
                id,
                base_dir,
                manifest_json,
            });
        }
    }
    log::info!("load_scenes: found {} scene(s)", scenes.len());
    Ok(scenes)
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("appDataDir failed: {e}"))
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("settings.json"))
}

fn history_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("history.jsonl"))
}

fn ensure_parent(p: &PathBuf) -> Result<(), String> {
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("create_dir_all: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn write_settings_atomic(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let dest = settings_path(&app)?;
    ensure_parent(&dest)?;
    let tmp = dest.with_extension("json.tmp");
    {
        let mut f = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp)
            .map_err(|e| format!("open tmp: {e}"))?;
        f.write_all(json.as_bytes())
            .map_err(|e| format!("write: {e}"))?;
        f.sync_all().map_err(|e| format!("fsync: {e}"))?;
    }
    fs::rename(&tmp, &dest).map_err(|e| format!("rename: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn append_history_line(app: tauri::AppHandle, line: String) -> Result<(), String> {
    let dest = history_path(&app)?;
    ensure_parent(&dest)?;
    let mut f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&dest)
        .map_err(|e| format!("open append: {e}"))?;
    let mut line = line;
    if !line.ends_with('\n') {
        line.push('\n');
    }
    f.write_all(line.as_bytes())
        .map_err(|e| format!("write: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn read_history_file(app: tauri::AppHandle) -> Result<String, String> {
    let p = history_path(&app)?;
    if !p.exists() {
        return Ok(String::new());
    }
    let mut buf = String::new();
    OpenOptions::new()
        .read(true)
        .open(&p)
        .and_then(|mut f| f.read_to_string(&mut buf))
        .map_err(|e| format!("read history: {e}"))?;
    Ok(buf)
}
