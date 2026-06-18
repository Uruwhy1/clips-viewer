import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

let cachedPort: number | null = null;
let portChecked = false;

export async function getVideoUrl(filePath: string): Promise<string> {
  if (!portChecked) {
    portChecked = true;
    try {
      cachedPort = await invoke<number>("get_video_server_port");
      console.log("[videoServer] got port from backend:", cachedPort);
    } catch {
      cachedPort = 0;
      console.log("[videoServer] video server not available, falling back to convertFileSrc");
    }
  }

  if (cachedPort && cachedPort > 0) {
    const url = `http://127.0.0.1:${cachedPort}/serve?path=${encodeURIComponent(filePath)}`;
    console.log("[videoServer] using HTTP URL:", url);
    return url;
  }

  const fallback = convertFileSrc(filePath);
  console.log("[videoServer] using asset fallback URL:", fallback);
  return fallback;
}
