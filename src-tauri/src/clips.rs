use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use dirs;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Window};

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
    pub video_duration: f64,
    pub new_clip: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipsResult {
    pub favourites_set: Vec<String>,
    pub all_clips: Vec<ClipInfo>,
}

#[derive(Deserialize, Serialize)]
struct Favourites(Vec<String>);

#[derive(Deserialize, Serialize)]
struct VideoDurationCache {
    duration: f64,
    file_size: u64,
    modified_time: i64,
}

#[derive(Serialize, Clone)]
struct ClipLoadProgress {
    main_text: String,
    progress_text: String,
    progress: u8,
    is_complete: bool,
}

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
    fs::create_dir_all(&thumb_dir)
        .map_err(|e| format!("Failed to create thumbnails dir: {}", e))?;

    let video_path = Path::new(video_path);
    let stem = video_path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid video filename")?;
    let thumb_path = thumb_dir.join(format!("{stem}.jpg"));

    if thumb_path.exists() {
        return Ok(thumb_path.to_string_lossy().to_string());
    }

    let duration = get_cached_video_duration(app_name, video_path.to_str().unwrap())?;
    let half_duration = duration / 2.0;

    let seek_time = half_duration;

    let seek_time_str = format!("{:.3}", seek_time);

    let status = Command::new("ffmpeg")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW (Windows-specific flag)
        .args([
            "-loglevel",
            "error",
            "-ss",
            &seek_time_str,
            "-i",
            video_path.to_str().unwrap(),
            "-frames:v",
            "1",
            "-vf",
            "scale=640:-1",
            "-c:v",
            "libwebp", 
            "-lossless",
            "0",
            "-compression_level",
            "6", 
            "-q:v",
            "75", 
            "-y",
            thumb_path.to_str().unwrap(), 
        ])
        .stdout(Stdio::null())
        .status()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

    if !status.success() {
        return Err(format!("ffmpeg failed for {}", video_path.display()));
    }

    Ok(thumb_path.to_string_lossy().to_string())
}

fn get_cached_video_duration(app_name: &str, video_path: &str) -> Result<f64, String> {
    let docs_dir = dirs::document_dir().ok_or("No documents directory found")?;
    let video_data_dir = docs_dir.join(app_name).join("video_data");
    fs::create_dir_all(&video_data_dir)
        .map_err(|e| format!("Failed to create video_data dir: {}", e))?;

    let video_path_obj = Path::new(video_path);
    let stem = video_path_obj
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid video filename")?;
    let cache_path = video_data_dir.join(format!("{stem}.json"));

    let video_metadata =
        fs::metadata(video_path).map_err(|e| format!("Failed to get video metadata: {}", e))?;
    let video_size = video_metadata.len();
    let video_modified = video_metadata
        .modified()
        .map_err(|e| format!("Failed to get video modification time: {}", e))?
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "Error calculating video timestamp".to_string())?
        .as_secs() as i64;

    if cache_path.exists() {
        if let Ok(cache_content) = fs::read_to_string(&cache_path) {
            if let Ok(cached_data) = serde_json::from_str::<VideoDurationCache>(&cache_content) {
                // Validate cache by checking file size and modification time
                if cached_data.file_size == video_size
                    && cached_data.modified_time == video_modified
                {
                    return Ok(cached_data.duration);
                }
            }
        }
    }

    let duration = get_video_duration(video_path)?;

    let cache_data = VideoDurationCache {
        duration,
        file_size: video_size,
        modified_time: video_modified,
    };

    let cache_content = serde_json::to_string_pretty(&cache_data)
        .map_err(|e| format!("Failed to serialize cache data: {}", e))?;

    fs::write(&cache_path, cache_content)
        .map_err(|e| format!("Failed to write cache file: {}", e))?;

    Ok(duration)
}

fn get_video_duration(path: &str) -> Result<f64, String> {
    let output = Command::new("ffprobe")
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let duration_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    duration_str.parse::<f64>().map_err(|e| e.to_string())
}

fn process_file_entry(
    app_name: &str,
    path: &Path,
    file_name: &str,
) -> Result<(String, String, i64, String, String, f64), String> {
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
    let video_duration = get_cached_video_duration(app_name, &file_path_str)?;

    Ok((
        file_path_str,
        name,
        unix_timestamp,
        formatted_date,
        thumbnail_path,
        video_duration,
    ))
}

fn count_files_in_directory(dir_path: &Path) -> Result<usize, String> {
    let mut file_count = 0;

    fn count_recursive(dir: &Path, count: &mut usize) -> Result<(), String> {
        let entries = fs::read_dir(dir)
            .map_err(|e| format!("Error reading directory {}: {}", dir.display(), e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
            let path = entry.path();

            if path.is_dir() {
                count_recursive(&path, count)?;
            } else {
                *count += 1;
            }
        }
        Ok(())
    }

    count_recursive(dir_path, &mut file_count)?;
    Ok(file_count)
}

fn process_directory(
    app_name: &str,
    dir_path: &Path,
    game: Option<String>,
    favourites_set: &HashSet<String>,
    all_clips: &mut Vec<ClipInfo>,
    window: Option<&Window>,
    total_files: usize,
    processed_files: &mut usize,
) -> Result<(), String> {
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Error reading directory {}: {}", dir_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            let current_game = game.clone().unwrap_or_else(|| file_name.clone());
            process_directory(
                app_name,
                &path,
                Some(current_game),
                favourites_set,
                all_clips,
                window,
                total_files,
                processed_files,
            )?;
        } else if let Some(current_game) = &game {
            *processed_files += 1;

            if let Some(w) = window {
                let progress = if total_files > 0 {
                    ((*processed_files as f32 / total_files as f32) * 100.0) as u8
                } else {
                    0
                };

                let progress_update = ClipLoadProgress {
                    main_text: "Loading clips...".to_string(),
                    progress_text: format!(
                        "Processing {} ({}/{})",
                        current_game, processed_files, total_files
                    ),
                    progress,
                    is_complete: *processed_files >= total_files,
                };

                let _ = w.emit("clip-loading-progress", progress_update);
            }

            let (
                file_path_str,
                name,
                unix_timestamp,
                formatted_date,
                thumbnail_path,
                video_duration,
            ) = process_file_entry(app_name, &path, &file_name)?;

            all_clips.push(ClipInfo {
                game: current_game.clone(),
                name,
                file_path: file_path_str.clone(),
                formatted_date,
                date: unix_timestamp,
                is_favourite: favourites_set.contains(&file_path_str),
                thumbnail: thumbnail_path,
                video_duration,
                new_clip: false,
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
            process_directory_newer(
                app_name,
                &path,
                Some(current_game),
                since_timestamp,
                all_clips,
            )?;
        } else if let Some(current_game) = &game {
            let (
                file_path_str,
                name,
                unix_timestamp,
                formatted_date,
                thumbnail_path,
                video_duration,
            ) = process_file_entry(app_name, &path, &file_name)?;

            if unix_timestamp > since_timestamp {
                all_clips.push(ClipInfo {
                    game: current_game.clone(),
                    name,
                    file_path: file_path_str,
                    formatted_date,
                    date: unix_timestamp,
                    is_favourite: false,
                    thumbnail: thumbnail_path,
                    video_duration,
                    new_clip: true,
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
    window: Window,
) -> Result<ClipsResult, String> {
    let app_name = app_handle
        .config()
        .product_name
        .as_ref()
        .ok_or("App product_name is not set")?
        .as_str();

    let initial_progress = ClipLoadProgress {
        main_text: "Initializing clip loading...".to_string(),
        progress_text: "Scanning directories...".to_string(),
        progress: 0,
        is_complete: false,
    };
    let _ = window.emit("clip-loading-progress", initial_progress);

    let total_files = count_files_in_directory(Path::new(&dir_path))?;

    let favourites_set = load_favourites(&app_name)?;
    let mut all_clips = Vec::new();
    let mut processed_files = 0;

    process_directory(
        &app_name,
        Path::new(&dir_path),
        None,
        &favourites_set,
        &mut all_clips,
        Some(&window),
        total_files,
        &mut processed_files,
    )?;

    all_clips.sort_by(|a, b| b.date.cmp(&a.date));

    let completion_progress = ClipLoadProgress {
        main_text: format!("Loaded {} clips successfully!", all_clips.len()),
        progress_text: format!("Completed ({}/{})", processed_files, total_files),
        progress: 100,
        is_complete: true,
    };
    let _ = window.emit("clip-loading-progress", completion_progress);

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
    process_directory_newer(
        &app_name,
        Path::new(&dir),
        None,
        since_timestamp,
        &mut all_clips,
    )?;

    all_clips.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(all_clips)
}
