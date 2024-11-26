use std::process::Command;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())    
        .invoke_handler(tauri::generate_handler![get_running_processes])
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