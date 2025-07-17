use serde::{ Serialize, Deserialize };
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use dirs;
use std::time::{ SystemTime, UNIX_EPOCH };
use chrono::{ DateTime, Utc, NaiveDateTime, TimeZone };
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipInfo {
    pub game: String,
    pub name: String,
    pub file_path: String,
    pub formatted_date: String,
    pub date: i64,
    pub is_favourite: bool,
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

fn format_date_from_timestamp(timestamp: i64) -> String {
    let datetime = Utc.from_utc_datetime(
        &NaiveDateTime::from_timestamp(timestamp, 0)
    );
    datetime.format("%d %b %Y, %H:%M").to_string()
}

fn parse_date_from_filename(filename: &str) -> Result<i64, String> {
    // separate TITLE from DATE_TIME
    let parts: Vec<&str> = filename.split('_').collect();
    if parts.len() < 2 {
        return Err(format!("Failed to parse date from '{}': No date part found", filename));
    }

    let date_part = parts[parts.len() - 2];
    let time_part = parts[parts.len() - 1].split('.').next().unwrap_or("");

    let time_parts: Vec<&str> = time_part.split('-').collect();

    if time_parts.len() >= 3 {
        if time_parts.len() == 3 {
            let datetime_str = format!("{}_{}", date_part, time_part);

            match NaiveDateTime::parse_from_str(&datetime_str, "%d-%m-%Y_%H-%M-%S") {
                Ok(dt) => {
                    return Ok(dt.and_utc().timestamp());
                }
                Err(_) => {}
            }
        } else if time_parts.len() >= 4 {
            let datetime_str = format!(
                "{}_{}-{}-{}",
                date_part,
                time_parts[0],
                time_parts[1],
                time_parts[2]
            );

            match NaiveDateTime::parse_from_str(&datetime_str, "%d-%m-%Y_%H-%M-%S") {
                Ok(dt) => {
                    return Ok(dt.and_utc().timestamp());
                }
                Err(_) => {}
            }
        }
    }

    if time_parts.len() >= 3 {
        if time_parts.len() == 3 {
            let datetime_str = format!("{}_{}", date_part, time_part);

            match NaiveDateTime::parse_from_str(&datetime_str, "%m-%d-%Y_%H-%M-%S") {
                Ok(dt) => {
                    return Ok(dt.and_utc().timestamp());
                }
                Err(_) => {}
            }
        } else if time_parts.len() >= 4 {
            let datetime_str = format!(
                "{}_{}-{}-{}",
                date_part,
                time_parts[0],
                time_parts[1],
                time_parts[2]
            );

            match NaiveDateTime::parse_from_str(&datetime_str, "%m-%d-%Y_%H-%M-%S") {
                Ok(dt) => {
                    return Ok(dt.and_utc().timestamp());
                }
                Err(_) => {}
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
        Some(doc_dir) => { doc_dir.join(app_name).join("favourites.json") }
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
            let favourites: Favourites = serde_json
                ::from_str(&content)
                .map_err(|e| format!("Failed to parse favourites: {}", e))?;
            Ok(favourites.0.into_iter().collect())
        }
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                let default_favourites = Favourites(Vec::new());
                let default_content = serde_json
                    ::to_string_pretty(&default_favourites)
                    .map_err(|e| format!("Failed to serialize default favourites: {}", e))?;

                fs
                    ::write(&document_path, default_content)
                    .map_err(|e| format!("Failed to create favourites file: {}", e))?;

                return Ok(HashSet::new());
            }
            Err(format!("Failed to read favourites file: {}", e))
        }
    }
}

fn process_directory(
    dir_path: &Path,
    game: Option<String>,
    favourites_set: &HashSet<String>,
    all_clips: &mut Vec<ClipInfo>
) -> Result<(), String> {
    let entries = fs
        ::read_dir(dir_path)
        .map_err(|e| format!("Error reading directory {}: {}", dir_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            let current_game = game.clone().unwrap_or_else(|| file_name.clone());
            process_directory(&path, Some(current_game), favourites_set, all_clips)?;
        } else if let Some(current_game) = &game {
            let file_path_str = path.to_string_lossy().to_string();

            let name = extract_title_from_filename(&file_name);

            let (unix_timestamp, formatted_date) = match parse_date_from_filename(&file_name) {
                Ok(timestamp) => (timestamp, format_date_from_timestamp(timestamp)),
                Err(_) => {
                    // fallback to file modification time if date parsing fails
                    let metadata = fs
                        ::metadata(&path)
                        .map_err(|e|
                            format!("Error getting metadata for {}: {}", path.display(), e)
                        )?;

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

            all_clips.push(ClipInfo {
                game: current_game.clone(),
                name,
                file_path: file_path_str.clone(),
                formatted_date,
                date: unix_timestamp,
                is_favourite: favourites_set.contains(&file_path_str),
            });
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_all_clips(
    app_handle: tauri::AppHandle,
    dir_path: String
) -> Result<ClipsResult, String> {
    let app_name = app_handle
        .config()
        .product_name.as_ref()
        .ok_or("App product_name is not set")?
        .as_str();

    let favourites_set = load_favourites(&app_name)?;

    let mut all_clips = Vec::new();
    process_directory(Path::new(&dir_path), None, &favourites_set, &mut all_clips)?;

    all_clips.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(ClipsResult {
        favourites_set: favourites_set.into_iter().collect(),
        all_clips,
    })
}
