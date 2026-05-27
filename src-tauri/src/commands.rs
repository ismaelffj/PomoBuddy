use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

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
