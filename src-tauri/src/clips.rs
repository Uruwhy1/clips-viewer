use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use dirs;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipInfo {
    pub game: String,
    pub name: String,
    pub file_path: String,
    pub formatted_date: String,
    pub date: i64,
    pub is_favourite: bool,
    pub thumbnail: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipsResult {
    pub favourites_set: Vec<String>,
    pub all_clips: Vec<ClipInfo>,
}

#[derive(Deserialize, Serialize)]
struct Favourites(Vec<String>);

fn format_date(timestamp: SystemTime) -> String {
    let datetime: DateTime<Utc> = timestamp.into();
    datetime.format("%d %b %Y, %H:%M").to_string()
}

fn parse_date_from_filename(filename: &str) -> Result<i64, String> {
    let parts: Vec<&str> = filename.split('_').collect();
    if parts.len() < 2 {
        return Err(format!(
            "Failed to parse date from '{}': No date part found",
            filename
        ));
    }

    let date_part = parts[parts.len() - 2];
    let time_part = parts[parts.len() - 1].split('.').next().unwrap_or("");
    let datetime_str = format!("{}_{}", date_part, time_part);

    let formats = ["%d-%m-%Y_%H-%M-%S", "%m-%d-%Y_%H-%M-%S"];
    for fmt in formats {
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(&datetime_str, fmt) {
            if let Some(local_dt) = Local.from_local_datetime(&naive_dt).single() {
                return Ok(local_dt.with_timezone(&Utc).timestamp());
            }
        }
    }

    Err(format!("Failed to parse date from '{}'", filename))
}

fn extract_title_from_filename(filename: &str) -> String {
    match filename.split('_').next() {
        Some(title) => title.to_string(),
        None => filename.to_string(),
    }
}

fn load_favourites(app_name: &str) -> Result<HashSet<String>, String> {
    let document_path: PathBuf = match dirs::document_dir() {
        Some(doc_dir) => doc_dir.join(app_name).join("favourites.json"),
        None => {
            return Err("Could not find home directory".into());
        }
    };

    if let Some(parent) = document_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    match fs::read_to_string(&document_path) {
        Ok(content) => {
            if content.is_empty() {
                return Ok(HashSet::new());
            }
            let favourites: Favourites = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse favourites: {}", e))?;
            Ok(favourites.0.into_iter().collect())
        }
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                let default_favourites = Favourites(Vec::new());
                let default_content = serde_json::to_string_pretty(&default_favourites)
                    .map_err(|e| format!("Failed to serialize default favourites: {}", e))?;

                fs::write(&document_path, default_content)
                    .map_err(|e| format!("Failed to create favourites file: {}", e))?;

                return Ok(HashSet::new());
            }
            Err(format!("Failed to read favourites file: {}", e))
        }
    }
}

fn generate_thumbnail_if_missing(app_name: &str, video_path: &str) -> Result<String, String> {
    let docs_dir = dirs::document_dir().ok_or("No documents directory found")?;
    let thumb_dir = docs_dir.join(app_name).join("thumbnails");
    fs::create_dir_all(&thumb_dir).map_err(|e| format!("Failed to create thumbnails dir: {}", e))?;

    let video_path = Path::new(video_path);
    let stem = video_path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid video filename")?;
    let thumb_path = thumb_dir.join(format!("{stem}.jpg"));

    if thumb_path.exists() {
        return Ok(thumb_path.to_string_lossy().to_string());
    }

    let status = Command::new("ffmpeg")
        .args([
            "-ss",
            "5",
            "-i",
            video_path.to_str().unwrap(),
            "-frames:v",
            "1",
            "-vf",
            "scale=320:-1",
            "-q:v",
            "3",
            thumb_path.to_str().unwrap(),
        ])
        .status()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

    if !status.success() {
        return Err(format!("ffmpeg failed for {}", video_path.display()));
    }

    Ok(thumb_path.to_string_lossy().to_string())
}

fn process_file_entry(
    app_name: &str,
    path: &Path,
    file_name: &str,
) -> Result<(String, String, i64, String, String), String> {
    let file_path_str = path.to_string_lossy().to_string();
    let name = extract_title_from_filename(file_name);

    let (unix_timestamp, formatted_date) = match parse_date_from_filename(file_name) {
        Ok(utc_timestamp) => {
            let local_dt = Local
                .timestamp_opt(utc_timestamp, 0)
                .single()
                .ok_or("Invalid timestamp")?;
            (
                utc_timestamp,
                local_dt.format("%d %b %Y, %H:%M").to_string(),
            )
        }
        Err(_) => {
            let metadata = fs::metadata(path)
                .map_err(|e| format!("Error getting metadata for {}: {}", path.display(), e))?;
            let mtime = metadata
                .modified()
                .map_err(|e| format!("Error getting modification time: {}", e))?;
            let unix_ts = mtime
                .duration_since(UNIX_EPOCH)
                .map_err(|_| "Error calculating timestamp".to_string())?
                .as_secs() as i64;
            (unix_ts, format_date(mtime))
        }
    };

    let thumbnail_path = generate_thumbnail_if_missing(app_name, &file_path_str)?;

    Ok((file_path_str, name, unix_timestamp, formatted_date, thumbnail_path))
}

fn process_directory(
    app_name: &str,
    dir_path: &Path,
    game: Option<String>,
    favourites_set: &HashSet<String>,
    all_clips: &mut Vec<ClipInfo>,
) -> Result<(), String> {
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Error reading directory {}: {}", dir_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            let current_game = game.clone().unwrap_or_else(|| file_name.clone());
            process_directory(app_name, &path, Some(current_game), favourites_set, all_clips)?;
        } else if let Some(current_game) = &game {
            let (file_path_str, name, unix_timestamp, formatted_date, thumbnail_path) =
                process_file_entry(app_name, &path, &file_name)?;

            all_clips.push(ClipInfo {
                game: current_game.clone(),
                name,
                file_path: file_path_str.clone(),
                formatted_date,
                date: unix_timestamp,
                is_favourite: favourites_set.contains(&file_path_str),
                thumbnail: thumbnail_path,
            });
        }
    }

    Ok(())
}

fn process_directory_newer(
    app_name: &str,
    dir_path: &Path,
    game: Option<String>,
    since_timestamp: i64,
    all_clips: &mut Vec<ClipInfo>,
) -> Result<(), String> {
    if game.is_some() {
        let dir_metadata = fs::metadata(dir_path).map_err(|e| {
            format!(
                "Error getting directory metadata for {}: {}",
                dir_path.display(),
                e
            )
        })?;

        let dir_modified = dir_metadata
            .modified()
            .map_err(|e| format!("Error getting directory modification time: {}", e))?;

        let dir_timestamp = dir_modified
            .duration_since(UNIX_EPOCH)
            .map_err(|_| "Error calculating directory timestamp".to_string())?
            .as_secs() as i64;

        if dir_timestamp <= since_timestamp {
            return Ok(());
        }
    }

    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Error reading directory {}: {}", dir_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            let current_game = game.clone().unwrap_or_else(|| file_name.clone());
            process_directory_newer(app_name, &path, Some(current_game), since_timestamp, all_clips)?;
        } else if let Some(current_game) = &game {
            let (file_path_str, name, unix_timestamp, formatted_date, thumbnail_path) =
                process_file_entry(app_name, &path, &file_name)?;

            if unix_timestamp > since_timestamp {
                all_clips.push(ClipInfo {
                    game: current_game.clone(),
                    name,
                    file_path: file_path_str,
                    formatted_date,
                    date: unix_timestamp,
                    is_favourite: false,
                    thumbnail: thumbnail_path,
                });
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_all_clips(
    app_handle: tauri::AppHandle,
    dir_path: String,
) -> Result<ClipsResult, String> {
    let app_name = app_handle
        .config()
        .product_name
        .as_ref()
        .ok_or("App product_name is not set")?
        .as_str();

    let favourites_set = load_favourites(&app_name)?;

    let mut all_clips = Vec::new();
    process_directory(&app_name, Path::new(&dir_path), None, &favourites_set, &mut all_clips)?;

    all_clips.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(ClipsResult {
        favourites_set: favourites_set.into_iter().collect(),
        all_clips,
    })
}

#[tauri::command]
pub fn get_new_clips_since(
    app_handle: tauri::AppHandle,
    dir: String,
    since_timestamp: i64,
) -> Result<Vec<ClipInfo>, String> {
    let app_name = app_handle
        .config()
        .product_name
        .as_ref()
        .ok_or("App product_name is not set")?
        .as_str();

    let mut all_clips = Vec::new();
    process_directory_newer(&app_name, Path::new(&dir), None, since_timestamp, &mut all_clips)?;

    all_clips.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(all_clips)
}
