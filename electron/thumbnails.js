const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { THUMBNAIL_CACHE_DIR } = require("./config");
const { fileKey } = require("./utils");

async function ensureDir() {
  await fs.mkdir(THUMBNAIL_CACHE_DIR, { recursive: true });
}

function thumbPath(filePath) {
  return path.join(THUMBNAIL_CACHE_DIR, `${fileKey(filePath)}.jpg`);
}

async function generate(filePath) {
  await ensureDir();
  const tPath = thumbPath(filePath);

  try {
    await fs.access(tPath);
    return tPath;
  } catch {
    return new Promise((resolve) => {
      exec(
        `ffmpeg -ss 5 -i "${filePath}" -vframes 1 -q:v 3 "${tPath}" -y 2>/dev/null || ` +
          `ffmpeg -i "${filePath}" -vframes 1 -q:v 3 "${tPath}" -y`,
        (err) => resolve(err ? "" : tPath),
      );
    });
  }
}

async function remove(filePath) {
  try {
    await fs.unlink(thumbPath(filePath));
  } catch {}
}

module.exports = { generate, remove };
