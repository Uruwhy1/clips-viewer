function fileKey(filePath) {
  return Buffer.from(filePath).toString("base64url");
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDateFromFilename(filename) {
  const match = filename.match(
    /_([\d]{2}-[\d]{2}-[\d]{4})_([\d]{2}-[\d]{2}-[\d]{2})/,
  );
  if (!match) {
    const dateOnly = filename.match(/_([\d]{2}-[\d]{2}-[\d]{4})\.mp4$/);
    if (!dateOnly) return null;
    const parts = dateOnly[1].split("-");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return Math.floor(date.getTime() / 1000);
  }

  const dateParts = match[1].split("-");
  const timeParts = match[2].split("-");

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = parseInt(timeParts[2], 10);

  const date = new Date(year, month - 1, day, hour, minute, second);
  if (isNaN(date.getTime())) return null;

  return Math.floor(date.getTime() / 1000);
}

function parseTimeToSeconds(timeStr) {
  const parts = timeStr.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

module.exports = {
  fileKey,
  formatDate,
  parseDateFromFilename,
  parseTimeToSeconds,
};
