use tiny_http::{Header, Response, Server, StatusCode};
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

pub fn start() -> u16 {
    let server = Server::http("127.0.0.1:0").expect("Failed to start video server");
    let port = server.server_addr().to_ip().unwrap().port();
    eprintln!("[video_server] started on 127.0.0.1:{}", port);

    std::thread::spawn(move || {
        for request in server.incoming_requests() {
            let url = request.url().to_string();
            eprintln!("[video_server] request: {} {}", request.method(), url);

            let path_value = url
                .split('?')
                .nth(1)
                .and_then(|query| {
                    query.split('&').find_map(|param| {
                        let mut parts = param.splitn(2, '=');
                        if parts.next()? == "path" {
                            parts.next()
                        } else {
                            None
                        }
                    })
                })
                .map(url_decode);

            let has_range = request
                .headers()
                .iter()
                .any(|h| h.field.as_str().to_ascii_lowercase() == "range");

            if has_range {
                eprintln!("[video_server] request has Range header");
            }

            match path_value {
                Some(ref file_path) => {
                    eprintln!("[video_server] resolved path: {}", file_path);
                    serve_file(request, file_path);
                }
                None => {
                    eprintln!("[video_server] no path in query, returning 404");
                    let resp = Response::from_string("Not Found").with_status_code(404);
                    let _ = request.respond(resp);
                }
            }
        }
    });

    port
}

fn serve_file(request: tiny_http::Request, file_path: &str) {
    let path = Path::new(file_path);
    if !path.exists() || !path.is_file() {
        eprintln!("[video_server] file not found: {}", file_path);
        let resp = Response::from_string("Not Found").with_status_code(404);
        let _ = request.respond(resp);
        return;
    }

    let file_size = match fs::metadata(path) {
        Ok(m) => m.len(),
        Err(e) => {
            eprintln!("[video_server] metadata error: {}", e);
            let resp = Response::from_string("Error").with_status_code(500);
            let _ = request.respond(resp);
            return;
        }
    };

    let mime_type = get_mime_type(path);
    eprintln!("[video_server] file_size={} mime={}", file_size, mime_type);

    let cors = Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap();
    let accept_ranges = Header::from_bytes("Accept-Ranges", "bytes").unwrap();
    let content_type = Header::from_bytes("Content-Type", mime_type.as_bytes()).unwrap();

    let range = request
        .headers()
        .iter()
        .find(|h| h.field.as_str().to_ascii_lowercase() == "range")
        .and_then(|h| parse_range(h.value.as_str(), file_size));

    if let Some((start, end)) = range {
        let content_len = end - start + 1;
        let content_range_str = format!("bytes {}-{}/{}", start, end, file_size);
        eprintln!(
            "[video_server] serving range {}-{} (len={})",
            start, end, content_len
        );
        let content_range =
            Header::from_bytes("Content-Range", content_range_str.as_bytes()).unwrap();

        match fs::File::open(path) {
            Ok(mut file) => {
                if let Err(e) = file.seek(SeekFrom::Start(start)) {
                    eprintln!("[video_server] seek error: {}", e);
                    let resp = Response::from_string("Range Not Satisfiable").with_status_code(416);
                    let _ = request.respond(resp);
                    return;
                }
                let limited = file.take(content_len);
                let resp = Response::new(
                    StatusCode(206),
                    vec![cors, accept_ranges, content_range, content_type],
                    limited,
                    Some(content_len as usize),
                    None,
                )
                .with_chunked_threshold(usize::MAX);
                eprintln!("[video_server] responded 206 Partial Content, Content-Length={}", content_len);
                let _ = request.respond(resp);
            }
            Err(e) => {
                eprintln!("[video_server] file open error: {}", e);
                let resp = Response::from_string("Error").with_status_code(500);
                let _ = request.respond(resp);
            }
        }
    } else {
        eprintln!("[video_server] serving full file (no range)");
        match fs::File::open(path) {
            Ok(file) => {
                let resp = Response::new(
                    StatusCode(200),
                    vec![cors, accept_ranges, content_type],
                    file,
                    Some(file_size as usize),
                    None,
                )
                .with_chunked_threshold(usize::MAX);
                eprintln!("[video_server] responded 200 OK, Content-Length={}", file_size);
                let _ = request.respond(resp);
            }
            Err(e) => {
                eprintln!("[video_server] file open error: {}", e);
                let resp = Response::from_string("Error").with_status_code(500);
                let _ = request.respond(resp);
            }
        }
    }
}

fn parse_range(header: &str, file_size: u64) -> Option<(u64, u64)> {
    let header = header.trim();
    if !header.starts_with("bytes=") {
        return None;
    }
    let range = &header[6..];
    if let Some((start_str, end_str)) = range.split_once('-') {
        let start: u64 = start_str.parse().ok()?;
        let end: u64 = if end_str.is_empty() {
            file_size - 1
        } else {
            end_str.parse::<u64>().ok()?.min(file_size - 1)
        };
        if start > end || start >= file_size {
            return None;
        }
        Some((start, end))
    } else {
        None
    }
}

fn get_mime_type(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
    {
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "avi" => "video/x-msvideo",
        "mkv" => "video/x-matroska",
        "mov" => "video/quicktime",
        "flv" => "video/x-flv",
        "wmv" => "video/x-ms-wmv",
        "m4v" => "video/mp4",
        "3gp" => "video/3gpp",
        "ogv" => "video/ogg",
        _ => "application/octet-stream",
    }
}

fn url_decode(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut bytes = s.bytes();
    while let Some(b) = bytes.next() {
        if b == b'%' {
            let hi = bytes
                .next()
                .and_then(|c| (c as char).to_digit(16))
                .unwrap_or(0) as u8;
            let lo = bytes
                .next()
                .and_then(|c| (c as char).to_digit(16))
                .unwrap_or(0) as u8;
            result.push((hi * 16 + lo) as char);
        } else {
            result.push(b as char);
        }
    }
    result
}
