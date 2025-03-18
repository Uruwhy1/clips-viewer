use std::fs;
use std::path::Path;
use serde::{ Deserialize, Serialize };
use tauri::command;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClipInfo {
    file_path: String,
    is_favourite: bool,
    date: i64, // Unix timestamp
    #[serde(default)] // This makes size optional with a default of 0
    size: u64, // File size in bytes
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    deleted_count: usize,
    freed_space_gb: f64,
    total_size_gb: f64,
    deleted_paths: Vec<String>,
}

// Calculate total size of all clips
#[tauri::command]
pub fn calculate_total_size(clips: Vec<ClipInfo>) -> Result<f64, String> {
    let mut total_size: u64 = 0;

    for clip in clips.iter() {
        let path = Path::new(&clip.file_path);
        if path.exists() {
            match fs::metadata(&path) {
                Ok(metadata) => {
                    total_size += metadata.len();
                }
                Err(e) => {
                    eprintln!("Error getting metadata for {}: {}", clip.file_path, e);
                }
            }
        }
    }

    // Convert bytes to GB (1GB = 1024^3 bytes)
    let size_gb = (total_size as f64) / (1024.0 * 1024.0 * 1024.0);
    Ok(size_gb)
}

// Delete older clips to meet storage threshold
#[tauri::command]
pub fn delete_older_clips(
    clips: Vec<ClipInfo>,
    threshold_gb: f64,
    deletion_enabled: bool
) -> Result<CleanupResult, String> {
    if !deletion_enabled || clips.is_empty() {
        return Ok(CleanupResult {
            deleted_count: 0,
            freed_space_gb: 0.0,
            total_size_gb: 0.0,
            deleted_paths: Vec::new(),
        });
    }

    // Calculate initial total size
    let total_size_gb = calculate_total_size(clips.clone())?;

    // If we're under threshold, nothing to do
    if total_size_gb < threshold_gb {
        return Ok(CleanupResult {
            deleted_count: 0,
            freed_space_gb: 0.0,
            total_size_gb,
            deleted_paths: Vec::new(),
        });
    }

    // Sort clips by date (oldest first)
    let mut sorted_clips = clips.clone();
    sorted_clips.sort_by_key(|clip| clip.date);

    // Filter out favorites
    let non_favorite_clips: Vec<ClipInfo> = sorted_clips
        .into_iter()
        .filter(|clip| !clip.is_favourite)
        .collect();

    let mut current_size_gb = total_size_gb;
    let mut deleted_count = 0;
    let mut deleted_paths = Vec::new();
    let mut freed_space_gb = 0.0;

    // Start deleting oldest clips
    for clip in non_favorite_clips {
        // Stop if we're under threshold
        if current_size_gb < threshold_gb {
            break;
        }

        let path = Path::new(&clip.file_path);
        if path.exists() {
            let file_size_bytes = match fs::metadata(&path) {
                Ok(metadata) => metadata.len(),
                Err(_) => {
                    continue;
                } // Skip if metadata can't be read
            };

            let file_size_gb = (file_size_bytes as f64) / (1024.0 * 1024.0 * 1024.0);

            // Delete the file
            match fs::remove_file(&path) {
                Ok(_) => {
                    deleted_count += 1;
                    deleted_paths.push(clip.file_path);
                    current_size_gb -= file_size_gb;
                    freed_space_gb += file_size_gb;
                }
                Err(e) => {
                    eprintln!("Error deleting file {}: {}", clip.file_path, e);
                }
            }
        }
    }

    Ok(CleanupResult {
        deleted_count,
        freed_space_gb,
        total_size_gb: current_size_gb,
        deleted_paths,
    })
}
