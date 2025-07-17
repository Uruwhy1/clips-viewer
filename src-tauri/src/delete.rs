use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

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
pub async fn delete_older_clips(
    clips: Vec<ClipInfo>,
    threshold_gb: f64,
    deletion_enabled: bool,
) -> Result<CleanupResult, String> {
    tokio::task::spawn_blocking(move || {
        if !deletion_enabled || clips.is_empty() {
            return Ok(CleanupResult {
                deleted_count: 0,
                freed_space_gb: 0.0,
                total_size_gb: 0.0,
                deleted_paths: Vec::new(),
            });
        }

        // Calculate initial total size
        let mut total_size: u64 = 0;
        for clip in clips.iter() {
            let path = Path::new(&clip.file_path);
            if path.exists() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total_size += metadata.len();
                }
            }
        }
        let mut current_size_gb = total_size as f64 / (1024.0 * 1024.0 * 1024.0);

        if current_size_gb < threshold_gb {
            return Ok(CleanupResult {
                deleted_count: 0,
                freed_space_gb: 0.0,
                total_size_gb: current_size_gb,
                deleted_paths: Vec::new(),
            });
        }

        // Sort clips
        let mut sorted_clips = clips.clone();
        sorted_clips.sort_by_key(|clip| clip.date);
        let non_favorites: Vec<_> = sorted_clips
            .into_iter()
            .filter(|c| !c.is_favourite)
            .collect();

        let mut deleted_count = 0;
        let mut deleted_paths = Vec::new();
        let mut freed_space = 0.0;

        for clip in non_favorites {
            if current_size_gb < threshold_gb {
                break;
            }

            let path = Path::new(&clip.file_path);
            if path.exists() {
                if let Ok(metadata) = fs::metadata(&path) {
                    let file_size = metadata.len() as f64 / (1024.0 * 1024.0 * 1024.0);
                    if fs::remove_file(&path).is_ok() {
                        current_size_gb -= file_size;
                        freed_space += file_size;
                        deleted_count += 1;
                        deleted_paths.push(clip.file_path);
                    }
                }
            }
        }

        Ok(CleanupResult {
            deleted_count,
            freed_space_gb: freed_space,
            total_size_gb: current_size_gb,
            deleted_paths,
        })
    })
    .await
    .map_err(|e| format!("Spawn failed: {e}"))?
}
