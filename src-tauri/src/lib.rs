// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;
use walkdir::WalkDir;

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
        .invoke_handler(tauri::generate_handler![get_all_files_in_folder, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
#[tauri::command]
fn get_all_files_in_folder(path: &str) -> Vec<String> {
    println!("walking: {:?}", path);
    let mut files = Vec::new();
    for entry in WalkDir::new(path) {
        match entry {
            Ok(e) => files.push(e.path().to_string_lossy().into_owned()),
            Err(err) => println!("walk error: {}", err),
        }
    }
    println!("found {} entries", files.len());
    files
}
