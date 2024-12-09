use std::process::Command;
use std::fs;
use std::time::{ UNIX_EPOCH };
use filetime::{ FileTime, set_file_mtime };

use tauri::tray::TrayIconBuilder;
use tauri::menu::MenuBuilder;
use tauri::menu::MenuItemBuilder;
use tauri::{ Manager };
use std::os::windows::process::CommandExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .setup(|app| {
            /* system tray setup */

            let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            let hide = MenuItemBuilder::new("Hide").id("hide").build(app).unwrap();
            let show = MenuItemBuilder::new("Show").id("show").build(app).unwrap();
            let menu = MenuBuilder::new(app).items(&[&quit, &hide, &show]).build().unwrap();

            let window = app.get_webview_window("main").unwrap();

            let _ = TrayIconBuilder::new()
                .tooltip("Gaming Viewer")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                // events handling here
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => app.exit(0),
                        "hide" => {
                            dbg!("menu item hide clicked");
                            let window = app.get_webview_window("main").unwrap();
                            window.hide().unwrap();
                        }
                        "show" => {
                            dbg!("menu item show clicked");
                            let window = app.get_webview_window("main").unwrap();
                            window.show().unwrap();
                        }
                        _ => {}
                    }
                })

                .build(app);

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(
            tauri::generate_handler![create_clip, get_running_processes, open_file_explorer]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
fn get_running_processes() -> Result<String, String> {
    let output = Command::new("tasklist")
        .creation_flags(CREATE_NO_WINDOW)
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
    // Retrieve original mtime
    let original_metadata = fs::metadata(&input_file).map_err(|e| e.to_string())?;
    let original_mtime = original_metadata.modified().map_err(|e| e.to_string())?;

    let output = Command::new("ffmpeg")
        .arg("-ss")
        .arg(&start_time)
        .arg("-to")
        .arg(&end_time)
        .arg("-i")
        .arg(&input_file)
        .arg("-c")
        .arg("copy")
        .arg(&output_file)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        // Convert original mtime to UNIX timestamp
        let mtime_unix = original_mtime.duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;

        // Set mtime of the new clip to match the original
        set_file_mtime(&output_file, FileTime::from_unix_time(mtime_unix, 0)).map_err(|e|
            e.to_string()
        )?;

        Ok("Clip created successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
