mod terminal;
use std::path::PathBuf;
use std::{any, fs};
use terminal::TerminalState;

use serde::{Deserialize, Serialize};
use tokio::time::error::Error;
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
        .manage(TerminalState::default())
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
            delete_folder,
            create_file,
            git_status,
            git_commit,
            get_git_history,
            terminal::spawn_terminal,
            terminal::write_to_terminal,
            terminal::resize_terminal,
            terminal::close_terminal
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
fn create_file(path: PathBuf, content: String) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }

    fs::write(path, content).map_err(|err| err.to_string())?;

    Ok(())
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
async fn get_ai_response(messages: Vec<Message>, index: Option<String>) -> Result<String, String> {
    let index_file = index.unwrap_or_else(|| {
        "No index was made. Ask the user to press the index button.".to_string()
    });

    println!("Received {} messages in Rust", messages.len());

    let url = "https://openrouter.ai/api/v1/chat/completions";
    let api_key = std::env::var("OPENROUTER_API_KEY")
        .map_err(|_| "OPENROUTER_API_KEY is not set in environment or .env file".to_string())?;

    let system_prompt = format!(
        "You are Surfer AI, a coding assistant built into the Surfer IDE. \
         Your north star: your editor should understand what you're building, \
         not just what you're typing. Be concise, helpful, and context-aware. \
         Respond in markdown format and include code snippets when relevant.\n\n\
         The following is an index of all the meaningful files in the project and what each does:\n\n{}",
        index_file
    );

    let mut full_messages = vec![serde_json::json!({
        "role": "system",
        "content": system_prompt
    })];
    for m in &messages {
        full_messages.push(serde_json::json!({
            "role": m.role,
            "content": m.content
        }));
    }

    let body = serde_json::json!({
        "model": "meta-llama/llama-3.3-70b-instruct",
        "messages": full_messages,
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

#[derive(Serialize)]
struct GitChange {
    path: String,
    file: String,
    status: String,
}

#[derive(Serialize)]
struct GitStatus {
    is_clean: bool,
    current_branch: String,
    ahead: i32,
    behind: i32,
    changes: Vec<GitChange>,
}

#[tauri::command]
fn git_status(path: &str) -> Result<GitStatus, String> {
    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(path)
        .arg("status")
        .arg("--porcelain=v1")
        .arg("-b")
        .output()
        .map_err(|e| format!("failed to run git: {}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git error: {}", err));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut lines = stdout.lines();

    let mut current_branch = String::new();
    let mut ahead = 0;
    let mut behind = 0;

    if let Some(header) = lines.next() {
        let header = header.trim_start_matches("## ");
        current_branch = header
            .split("...")
            .next()
            .unwrap_or("")
            .split_whitespace()
            .next()
            .unwrap_or("")
            .to_string();

        if let Some(start) = header.find('[') {
            let bracket = &header[start + 1..header.find(']').unwrap_or(header.len())];
            for part in bracket.split(',') {
                let part = part.trim();
                if let Some(n) = part.strip_prefix("ahead ") {
                    ahead = n.trim().parse().unwrap_or(0);
                } else if let Some(n) = part.strip_prefix("behind ") {
                    behind = n.trim().parse().unwrap_or(0);
                }
            }
        }
    }

    let mut changes = Vec::new();
    for line in lines {
        if line.len() < 3 {
            continue;
        }
        let status = line[..2].trim().to_string();
        let path_part = line[3..].to_string();
        let file = path_part
            .split('/')
            .last()
            .unwrap_or(&path_part)
            .to_string();
        changes.push(GitChange {
            path: path_part,
            file,
            status,
        });
    }

    Ok(GitStatus {
        is_clean: changes.is_empty(),
        current_branch,
        ahead,
        behind,
        changes,
    })
}
#[tauri::command]
fn git_commit(path: &str, message: &str) -> Result<String, String> {
    let add = std::process::Command::new("git")
        .arg("-C")
        .arg(path)
        .arg("add")
        .arg("-A")
        .output()
        .map_err(|e| format!("failed to run git add: {}", e))?;
    if !add.status.success() {
        return Err(format!(
            "git add failed: {}",
            String::from_utf8_lossy(&add.stderr)
        ));
    }

    let commit = std::process::Command::new("git")
        .arg("-C")
        .arg(path)
        .arg("commit")
        .arg("-m")
        .arg(message)
        .output()
        .map_err(|e| format!("failed to run git commit: {}", e))?;
    if !commit.status.success() {
        let stdout = String::from_utf8_lossy(&commit.stdout);
        let stderr = String::from_utf8_lossy(&commit.stderr);
        return Err(format!("git commit failed: {}{}", stdout, stderr));
    }

    let push = std::process::Command::new("git")
        .arg("-C")
        .arg(path)
        .arg("push")
        .output()
        .map_err(|e| format!("failed to run git push: {}", e))?;
    if !push.status.success() {
        let stderr = String::from_utf8_lossy(&push.stderr);
        return Err(format!("Committed locally, but push failed: {}", stderr));
    }

    let commit_out = String::from_utf8_lossy(&commit.stdout);
    let push_out = String::from_utf8_lossy(&push.stderr); // git push writes status to stderr
    Ok(format!("{}\n{}", commit_out.trim(), push_out.trim()))
}

#[derive(serde::Serialize)]
struct Commit {
    hash: String,
    author: String,
    date: String,
    message: String,
}
#[tauri::command]
fn get_git_history(path: &str) -> Result<Vec<Commit>, String> {
    let format_str = "%H%x1f%an%x1f%ad%x1f%s";

    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(path)
        .arg("log")
        .arg(format!("--format={}", format_str))
        .output()
        .map_err(|e| format!("failed to run git log: {}", e))?;

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git log failed: {}{}", stdout, stderr));
    }

    let raw_history = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse git output as UTF-8: {}", e))?;

    let mut commits = Vec::new();

    for line in raw_history.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split('\x1f').collect();

        if parts.len() == 4 {
            commits.push(Commit {
                hash: parts[0].to_string(),
                author: parts[1].to_string(),
                date: parts[2].to_string(),
                message: parts[3].to_string(),
            });
        }
    }

    Ok(commits)
}
