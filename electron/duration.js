const { exec } = require("child_process");

const cache = new Map();

function get(filePath) {
  if (cache.has(filePath)) {
    return Promise.resolve(cache.get(filePath));
  }
  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      (err, stdout) => {
        const duration = err ? 0 : parseFloat(stdout.trim()) || 0;
        cache.set(filePath, duration);
        resolve(duration);
      },
    );
  });
}

function invalidate(filePath) {
  cache.delete(filePath);
}

module.exports = { get, invalidate };
