use std::process::Command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(
            tauri::generate_handler![create_clip, get_running_processes, open_file_explorer]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_running_processes() -> Result<String, String> {
    let output = Command::new("tasklist")
        .output()
        .map_err(|e| format!("Error executing tasklist: {}", e))?;

    if !output.status.success() {
        return Err("Failed to get processes".into());
    }

    let processes = String::from_utf8_lossy(&output.stdout);
    Ok(processes.to_string())
}

#[tauri::command]
fn open_file_explorer(path: String) -> Result<(), String> {
    Command::new("explorer")
        .arg("/select,")
        .arg(path)
        .spawn()
        .map_err(|e| format!("Failed to open file explorer: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn create_clip(
    input_file: String,
    start_time: String,
    end_time: String,
    output_file: String
) -> Result<String, String> {
    let output = Command::new("ffmpeg")
        .arg("-i")
        .arg(input_file)
        .arg("-ss")
        .arg(start_time)
        .arg("-to")
        .arg(end_time)
        .arg("-c")
        .arg("copy")
        .arg(output_file)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Clip created successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
