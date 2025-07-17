use chrono::Local;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tauri::Window;

#[derive(Deserialize, Serialize)]
struct Favourites(Vec<String>);

#[derive(Serialize, Clone)]
struct BackupProgress {
    status: String,
    current: usize,
    total: usize,
    success_count: usize,
    failed_count: usize,
    current_file: String,
}

#[tauri::command]
pub async fn backup_favourite_clips(window: Window, backup_dir: String) -> Result<String, String> {
    // Step 1: Load the favourites list
    let favourites_set = match load_favourites() {
        Ok(set) => set,
        Err(e) => {
            let error_msg = format!("Failed to load favourites: {}", e);
            return Err(error_msg);
        }
    };

    if favourites_set.is_empty() {
        return Err("No favourite clips found to backup".to_string());
    }

    let total_clips = favourites_set.len();

    // Send initial progress
    if let Err(e) = window.emit(
        "backup-progress",
        BackupProgress {
            status: "Starting backup...".to_string(),
            current: 0,
            total: total_clips,
            success_count: 0,
            failed_count: 0,
            current_file: "".to_string(),
        },
    ) {
        println!("WARNING: Failed to emit initial progress event: {}", e);
    }

    // Validate the provided path
    let backup_dir = Path::new(&backup_dir);
    if !backup_dir.exists() || !backup_dir.is_dir() {
        let error_msg = format!("Invalid backup directory path: {}", backup_dir.display());
        return Err(error_msg);
    }

    // Step 2: Create a timestamped backup folder
    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let backup_folder = backup_dir.join(format!("GameClips_Backup_{}", timestamp));
    println!("Creating backup folder at: {}", backup_folder.display());

    match fs::create_dir_all(&backup_folder) {
        Ok(_) => println!("Successfully created backup folder"),
        Err(e) => {
            let error_msg = format!("Failed to create backup folder: {}", e);
            println!("ERROR: {}", error_msg);
            return Err(error_msg);
        }
    }

    // Send progress update
    if let Err(e) = window.emit(
        "backup-progress",
        BackupProgress {
            status: "Created backup folder".to_string(),
            current: 0,
            total: total_clips,
            success_count: 0,
            failed_count: 0,
            current_file: "".to_string(),
        },
    ) {
        println!("WARNING: Failed to emit progress event: {}", e);
    }

    // Step 3: Copy all favourite clips to backup folder
    let mut success_count = 0;
    let mut failed_paths = Vec::new();
    let mut current = 0;

    println!("Starting to copy {} files", favourites_set.len());
    for clip_path in &favourites_set {
        current += 1;
        let short_path = Path::new(&clip_path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| clip_path.clone());

        // Send progress update for current file
        if let Err(e) = window.emit(
            "backup-progress",
            BackupProgress {
                status: "Copying files...".to_string(),
                current,
                total: total_clips,
                success_count,
                failed_count: failed_paths.len(),
                current_file: short_path.clone(),
            },
        ) {
            println!("WARNING: Failed to emit progress event: {}", e);
        }

        let path = Path::new(&clip_path);
        if !path.exists() {
            println!("ERROR: File not found: {}", clip_path);
            failed_paths.push(clip_path.clone());
            continue;
        }

        let file_name = match path.file_name() {
            Some(name) => name.to_string_lossy().to_string(),
            None => {
                println!("ERROR: Invalid file path (no filename): {}", clip_path);
                failed_paths.push(clip_path.clone());
                continue;
            }
        };

        // Include the game name in the backup folder structure
        let game_name = match path.parent().and_then(|p| p.file_name()) {
            Some(name) => name.to_string_lossy().to_string(),
            None => {
                println!("WARNING: Could not determine game name for: {}", clip_path);
                "Unknown_Game".to_string()
            }
        };

        let game_backup_dir = backup_folder.join(&game_name);
        if let Err(e) = fs::create_dir_all(&game_backup_dir) {
            println!(
                "ERROR: Failed to create game directory {}: {}",
                game_name, e
            );
            failed_paths.push(format!("{} (Error: {})", clip_path, e));
            continue;
        }

        let dest_path = game_backup_dir.join(&file_name);
        println!("Copying {} to {}", path.display(), dest_path.display());

        match fs::copy(path, &dest_path) {
            Ok(_bytes) => {
                success_count += 1;
            }
            Err(e) => {
                println!("ERROR: Failed to copy file {}: {}", clip_path, e);
                failed_paths.push(format!("{} (Error: {})", clip_path, e));
            }
        }

        // Update progress after each file
        if current % 5 == 0 || current == total_clips {
            if let Err(e) = window.emit(
                "backup-progress",
                BackupProgress {
                    status: "Copying files...".to_string(),
                    current,
                    total: total_clips,
                    success_count,
                    failed_count: failed_paths.len(),
                    current_file: short_path,
                },
            ) {
                println!("WARNING: Failed to emit batch progress event: {}", e);
            }
        }
    }

    // Step 4: Create a backup log file
    println!("Creating backup log file");
    if let Err(e) = window.emit(
        "backup-progress",
        BackupProgress {
            status: "Creating backup log...".to_string(),
            current: total_clips,
            total: total_clips,
            success_count,
            failed_count: failed_paths.len(),
            current_file: "backup_log.txt".to_string(),
        },
    ) {
        println!("WARNING: Failed to emit log progress event: {}", e);
    }

    let log_content = format!(
        "Backup completed on {}\n\
        Total favourite clips: {}\n\
        Successfully backed up: {}\n\
        Failed: {}\n\n\
        Failed clips:\n{}",
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        total_clips,
        success_count,
        failed_paths.len(),
        if failed_paths.is_empty() {
            "None".to_string()
        } else {
            failed_paths.join("\n")
        }
    );

    let log_path = backup_folder.join("backup_log.txt");
    match fs::write(&log_path, &log_content) {
        Ok(_) => println!("Successfully wrote backup log to {}", log_path.display()),
        Err(e) => {
            let error_msg = format!("Failed to write backup log: {}", e);
            println!("ERROR: {}", error_msg);
            return Err(error_msg);
        }
    }

    // Final progress update
    if let Err(e) = window.emit(
        "backup-progress",
        BackupProgress {
            status: "Backup complete".to_string(),
            current: total_clips,
            total: total_clips,
            success_count,
            failed_count: failed_paths.len(),
            current_file: "".to_string(),
        },
    ) {
        println!("WARNING: Failed to emit final progress event: {}", e);
    }

    // Step 5: Return success message
    let success_msg = format!(
        "Backup completed successfully!\n\
        Location: {}\n\
        Total clips: {}\n\
        Successfully backed up: {}\n\
        Failed: {}",
        backup_folder.display(),
        total_clips,
        success_count,
        failed_paths.len()
    );

    Ok(success_msg)
}

fn load_favourites() -> Result<HashSet<String>, String> {
    println!("Loading favourites list");
    let document_path: PathBuf = match dirs::document_dir() {
        Some(path) => path.join("Tauri").join("favourites.json"),
        None => {
            println!("ERROR: Could not find home directory");
            return Err("Could not find home directory".into());
        }
    };

    // Create directory if it doesn't exist
    if let Some(parent) = document_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            println!(
                "ERROR: Failed to create directory {}: {}",
                parent.display(),
                e
            );
            return Err(format!("Failed to create directory: {}", e));
        }
    }

    match fs::read_to_string(&document_path) {
        Ok(content) => {
            if content.is_empty() {
                println!("Favourites file exists but is empty");
                return Ok(HashSet::new());
            }

            match serde_json::from_str::<Favourites>(&content) {
                Ok(favourites) => {
                    let set: HashSet<String> = favourites.0.into_iter().collect();
                    println!("Successfully loaded {} favourites", set.len());
                    Ok(set)
                }
                Err(e) => {
                    println!("ERROR: Failed to parse favourites JSON: {}", e);
                    Err(format!("Failed to parse favourites: {}", e))
                }
            }
        }
        Err(e) => {
            if e.kind() == io::ErrorKind::NotFound {
                println!("Favourites file not found, returning empty set");
                Ok(HashSet::new())
            } else {
                println!("ERROR: Failed to read favourites file: {}", e);
                Err(format!("Failed to read favourites file: {}", e))
            }
        }
    }
}
