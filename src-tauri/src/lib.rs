use std::path::PathBuf;
use std::{any, fs};

use serde::{Deserialize, Serialize};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_all_files_in_folder,
            greet,
            read_file,
            save_file,
            get_ai_response,
            summarize_file,
            rename_path,
            delete_file,
            delete_folder
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

#[tauri::command]
fn delete_file(path: PathBuf) -> Result<(), String> {
    fs::remove_file(path).map_err(|err| err.to_string())
}
#[tauri::command]
fn delete_folder(path: PathBuf) -> Result<(), String> {
    fs::remove_dir_all(path).map_err(|err| err.to_string())
}
#[tauri::command]
fn detect_stack(files: &[String]) -> Vec<String> {
    let mut stack = Vec::new();

    let any = |pred: &dyn Fn(&str) -> bool| files.iter().any(|f| pred(f));

    if any(&|f| f.ends_with(".ts") || f.ends_with(".tsx")) {
        stack.push("TypeScript".to_string());
    }
    if any(&|f| f.ends_with(".js") || f.ends_with(".jsx")) {
        stack.push("JavaScript".to_string());
    }
    if any(&|f| f.ends_with(".py")) {
        stack.push("Python".to_string());
    }
    if any(&|f| f.ends_with(".gd")) {
        stack.push("Godot/GDScript".to_string());
    }
    if any(&|f| f.ends_with(".cs")) {
        stack.push("C#".to_string());
    }
    if any(&|f| f.ends_with(".cpp")) {
        stack.push("C Plus Plus".to_string());
    }
    if any(&|f| f.ends_with(".java")) {
        stack.push("Java".to_string());
    }
    if any(&|f| f == "next.config.ts" || f == "next.config.js") {
        stack.push("Next.js".to_string());
    }
    if any(&|f| f.ends_with(".tsx") || f.ends_with(".jsx")) {
        stack.push("React".to_string());
    }
    if any(&|f| f.ends_with("project.godot")) {
        stack.push("Godot 4".to_string());
    }
    if any(&|f| f == "Cargo.toml") {
        stack.push("Rust".to_string());
    }
    if any(&|f| f == "bun.lock") {
        stack.push("BUN".to_string());
    }
    if any(&|f| f == "pnpm-lock.yaml") {
        stack.push("PNPM".to_string());
    }
    if any(&|f| f == "package-lock.yaml") {
        stack.push("NPM".to_string());
    }

    stack
}
// #[tauri::command]
// async fn indexProject(path: &str) {
//     let files = get_all_files_in_folder(path);
//     for file in files {}
// }
#[tauri::command]
async fn summarize_file(path: &str) -> Result<String, String> {
    let mut file_content = read_file(path);

    if file_content.len() < 30 {
        return Ok(String::from("Empty or minimal file"));
    }

    if file_content.len() > 8000 {
        file_content = file_content.chars().take(8000).collect();
        file_content.push_str("\n...(truncated)");
    }

    let url = "https://openrouter.ai/api/v1/chat/completions";
    let api_key = std::env::var("OPENROUTER_API_KEY")
        .map_err(|_| "OPENROUTER_API_KEY is not set in environment or .env file".to_string())?;

    let prompt = format!("Summarize this file in one line:\n\n{}", file_content);

    let body = serde_json::json!({
        "model": "meta-llama/llama-3.3-70b-instruct",
        "messages": [{ "role": "user", "content": prompt }],
        "max_tokens": 60
    });

    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Reqwest network error: {}", e))?;

    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("API error status {}: {}", status, text));
    }

    let data: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;

    let content = data["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("Invalid response format: {}", text))?;

    Ok(content.to_string())
}

#[tauri::command]
fn rename_path(from: &str, to: &str) -> Result<(), String> {
    std::fs::rename(from, to).map_err(|e| e.to_string())
}
#[tauri::command]
async fn get_ai_response(messages: Vec<Message>) -> Result<String, String> {
    println!("Received {} messages in Rust", messages.len());

    let url = "https://openrouter.ai/api/v1/chat/completions";
    let api_key = std::env::var("OPENROUTER_API_KEY")
        .map_err(|_| "OPENROUTER_API_KEY is not set in environment or .env file".to_string())?;

    let body = serde_json::json!({
        "model": "@preset/surfer-chat-bot",
        "messages": messages,
        "max_tokens": 1000
    });

    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Reqwest network error: {}", e))?;

    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("API error status {}: {}", status, text));
    }

    let data: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;

    let content = data["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("Invalid response format: {}", text))?;

    Ok(content.to_string())
}
