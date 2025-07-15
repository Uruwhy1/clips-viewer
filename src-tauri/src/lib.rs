mod clips;
mod delete;
mod backup;

use filetime::{ set_file_mtime, FileTime };
use std::fs;
use dirs;
use std::time::UNIX_EPOCH;
use std::collections::HashSet;
use std::os::windows::process::CommandExt;
use tauri::menu::MenuBuilder;
use tauri::menu::MenuItemBuilder;
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

use serde::{ Serialize };
use std::process::{ Command, Stdio };
use std::io::{ BufRead, BufReader };

use tauri::Window;
use tauri::Emitter;

pub use clips::get_all_clips;
pub use backup::backup_favourite_clips;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(serde::Serialize)]
struct ProcessInfo {
    running_processes: HashSet<String>,
}

#[tauri::command]
fn get_running_processes() -> Result<ProcessInfo, String> {
    let output = Command::new("tasklist")
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Error executing tasklist: {}", e))?;

    if !output.status.success() {
        return Err("Failed to get processes".into());
    }

    let processes = String::from_utf8_lossy(&output.stdout);
    let process_set: HashSet<String> = processes
        .lines()
        .skip(3)
        .filter_map(|line| {
            let name = line
                .get(0..=24)?
                .trim()
                .to_lowercase();

            Some(name)
        })
        .collect();

    Ok(ProcessInfo {
        running_processes: process_set,
    })
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
    output_file: String,
    window: Window
) -> Result<String, String> {
    println!("Starting create_clip function"); // Log function start

    #[derive(Serialize, Clone)]
    struct ClipProgress {
        main_text: String,
        progress_text: String,
        progress: Option<u8>,
        is_complete: bool,
    }

    println!("Parsing time values"); // Log parsing step
    let start_seconds = parse_time_to_seconds(&start_time)?;
    let end_seconds = parse_time_to_seconds(&end_time)?;
    let total_duration = end_seconds - start_seconds;

    println!("Starting FFmpeg process"); // Log process creation
    let mut child = Command::new("ffmpeg")
        .creation_flags(CREATE_NO_WINDOW)
        .arg("-ss")
        .arg(&start_time)
        .arg("-to")
        .arg(&end_time)
        .arg("-i")
        .arg(&input_file)
        .arg("-c")
        .arg("copy")
        .arg("-movflags")
        .arg("+faststart")
        .arg("-progress")
        .arg("pipe:2") // Output progress info to stderr
        .arg("-nostats") // Disable the default statistics
        .arg(&output_file)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            println!("Failed to spawn FFmpeg: {}", e); // Log spawn error
            e.to_string()
        })?;

    println!("Getting stderr handle"); // Log stderr capture
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let reader = BufReader::new(stderr);

    println!("Starting to process FFmpeg output"); // Log processing start
    for line in reader.lines() {
        if let Ok(log) = line {
            println!("FFmpeg output: {}", log); // Log each line from FFmpeg

            if log.contains("out_time=") {
                if let Some(time_pos) = log.find("out_time=") {
                    let time_str = &log[time_pos + 9..].trim();
                    let processed_seconds =
                        parse_time_to_seconds(time_str).unwrap_or(start_seconds);
                    let progress = (((processed_seconds - start_seconds) / total_duration) *
                        100.0) as u8;
                    let is_complete = log.contains("progress=end");

                    println!("Progress: {}%", progress); // Log calculated progress

                    let progress_update = ClipProgress {
                        main_text: "Processing clip...".to_string(),
                        progress_text: format!(
                            "{}/{}",
                            format_time_from_seconds(processed_seconds - start_seconds),
                            format_time_from_seconds(total_duration)
                        ),
                        progress: Some(progress),
                        is_complete,
                    };

                    if let Err(e) = window.emit("clip-progress", progress_update) {
                        println!("Failed to emit progress event: {}", e); // Log emission failure
                    }
                }
            }
        }
    }

    println!("Waiting for FFmpeg process to complete"); // Log wait step
    let output = child.wait().map_err(|e| e.to_string())?;

    if output.success() {
        println!("FFmpeg process completed successfully"); // Log success
        let completion_update = ClipProgress {
            main_text: "Clip created successfully".to_string(),
            progress_text: format!(
                "{}/{}",
                format_time_from_seconds(total_duration),
                format_time_from_seconds(total_duration)
            ),
            progress: Some(100),
            is_complete: true,
        };

        if let Err(e) = window.emit("clip-progress", completion_update) {
            println!("Failed to emit completion event: {}", e); // Log final emission
        }

        Ok("Clip created successfully".to_string())
    } else {
        println!("FFmpeg process failed"); // Log failure
        Err("FFmpeg failed to process the clip".to_string())
    }
}
fn parse_time_to_seconds(time_str: &str) -> Result<f64, String> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() == 3 {
        let hours: f64 = parts[0].parse::<f64>().map_err(|e| e.to_string())?;
        let minutes: f64 = parts[1].parse::<f64>().map_err(|e| e.to_string())?;
        let seconds: f64 = parts[2].parse::<f64>().map_err(|e| e.to_string())?;
        Ok(hours * 3600.0 + minutes * 60.0 + seconds)
    } else {
        Err("Invalid time format".to_string())
    }
}

fn format_time_from_seconds(total_seconds: f64) -> String {
    let hours = (total_seconds / 3600.0).floor() as u32;
    let minutes = ((total_seconds % 3600.0) / 60.0).floor() as u32;
    let seconds = (total_seconds % 60.0).floor() as u32;
    format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            /* system tray setup */

            let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            let hide = MenuItemBuilder::new("Hide").id("hide").build(app).unwrap();
            let show = MenuItemBuilder::new("Show").id("show").build(app).unwrap();
            let reload = MenuItemBuilder::new("Reload").id("reload").build(app).unwrap();
            let menu = MenuBuilder::new(app).items(&[&quit, &hide, &show, &reload]).build().unwrap();

            let _window = app.get_webview_window("main").unwrap();

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
                        },
                        "reload" => {
                            dbg!("menu item reload clicked");
                            let window = app.get_webview_window("main").unwrap();
                            window.eval("window.location.reload()").unwrap();
                        },
                        _ => {}
                    }
                })
                .build(app);

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(
            tauri::generate_handler![
                get_all_clips,
                create_clip,
                get_running_processes,
                open_file_explorer,
                delete::calculate_total_size,
                delete::delete_older_clips,
                backup_favourite_clips
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
