// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_all_files_in_folder,
            greet,
            read_file,
            save_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize)]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn get_all_files_in_folder(path: &str) -> Vec<FileNode> {
    let mut files = Vec::new();
    for entry in std::fs::read_dir(path).into_iter().flatten().flatten() {
        let p = entry.path();
        files.push(FileNode {
            name: entry.file_name().to_string_lossy().into_owned(),
            path: p.to_string_lossy().into_owned(),
            is_dir: p.is_dir(),
        });
    }
    files
}

#[tauri::command]
fn read_file(path: &str) -> String {
    std::fs::read_to_string(path).unwrap_or_default()
}

#[tauri::command]
fn save_file(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}
