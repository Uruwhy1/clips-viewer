use serde::{ Serialize, Deserialize };
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use dirs;
use std::time::{ SystemTime, UNIX_EPOCH };
use chrono::{ DateTime, Utc };
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

fn load_favourites() -> Result<HashSet<String>, String> {
    let document_path: PathBuf = match dirs::document_dir() {
        Some(path) => path.join("Tauri").join("favourites.json"),
        None => {
            return Err("Could not find home directory".into());
        }
    };

    // Create directory if it doesn't exist
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
        Err(e) => { Err(format!("Failed to read favourites file: {}", e)) }
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
            let metadata = fs
                ::metadata(&path)
                .map_err(|e| format!("Error getting metadata for {}: {}", path.display(), e))?;

            let mtime = metadata
                .modified()
                .map_err(|e| format!("Error getting modification time: {}", e))?;

            // Extract name - using simple truncation (see comment below)
            let name = file_name
                .chars()
                .take_while(|c| (c.is_alphanumeric() || c.is_whitespace() || *c == '\''))
                .collect::<String>();
            // **Note:** Filename extraction is simplified to truncate at the first invalid character
            // for alphanumeric, whitespace, or apostrophe. Consider if more robust extraction is needed.

            let file_path_str = path.to_string_lossy().to_string();

            let unix_timestamp = mtime
                .duration_since(UNIX_EPOCH)
                .map_err(|_| "Error calculating timestamp".to_string())?
                .as_secs() as i64;

            all_clips.push(ClipInfo {
                game: current_game.clone(),
                name: if name.is_empty() {
                    file_name
                } else {
                    name
                },
                file_path: file_path_str.clone(),
                formatted_date: format_date(mtime),
                date: unix_timestamp,
                is_favourite: favourites_set.contains(&file_path_str),
            });
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_all_clips(dir_path: String) -> Result<ClipsResult, String> {
    let favourites_set = load_favourites()?;
    let mut all_clips = Vec::new();
    process_directory(Path::new(&dir_path), None, &favourites_set, &mut all_clips)?;

    all_clips.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(ClipsResult {
        favourites_set: favourites_set.into_iter().collect(),
        all_clips,
    })
}
