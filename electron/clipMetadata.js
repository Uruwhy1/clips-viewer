const fs = require("fs").promises;
const path = require("path");
const { CLIP_META_DIR } = require("./config");
const { fileKey } = require("./utils");

async function ensureDir() {
  await fs.mkdir(CLIP_META_DIR, { recursive: true });
}

function metaPath(filePath) {
  return path.join(CLIP_META_DIR, `${fileKey(filePath)}.json`);
}

async function load(filePath) {
  try {
    const data = await fs.readFile(metaPath(filePath), "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function save(filePath, meta) {
  await ensureDir();
  await fs.writeFile(metaPath(filePath), JSON.stringify(meta, null, 2));
}

async function remove(filePath) {
  try {
    await fs.unlink(metaPath(filePath));
  } catch {}
}

async function rename(oldPath, newPath) {
  try {
    await fs.rename(metaPath(oldPath), metaPath(newPath));
  } catch {}
}

module.exports = { load, save, remove, rename };
