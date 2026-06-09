const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { getMainWindow } = require("./window");
const meta = require("./clipMetadata");
const thumbs = require("./thumbnails");
const dur = require("./duration");
const { loadFavourites } = require("./favourites");
const { formatDate, parseDateFromFilename, parseTimeToSeconds } = require("./utils");

async function getAllWithMetadata(gamesDir) {
  if (!gamesDir) return [];
  const allClips = [];
  const favourites = await loadFavourites();
  const favSet = new Set(favourites);

  let gameCount = 0;
  try {
    const items = await fs.readdir(gamesDir);
    for (const item of items) {
      try {
        if ((await fs.stat(path.join(gamesDir, item))).isDirectory()) gameCount++;
      } catch {}
    }
  } catch {}

  let processedGames = 0;

  try {
    const items = await fs.readdir(gamesDir);
    for (const item of items) {
      const fullPath = path.join(gamesDir, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          processedGames++;

          let gameItemsCount = 0;
          try {
            const gameItems = await fs.readdir(fullPath);
            for (const f of gameItems) {
              if (f.endsWith(".mp4") || f.endsWith(".mkv")) gameItemsCount++;
            }
          } catch {}

          getMainWindow()?.webContents.send("clip-loading-progress", {
            current: processedGames,
            total: gameCount,
            game: item,
            itemsTotal: gameItemsCount,
            itemsProcessed: 0,
          });

          const clips = await fromDirectory(fullPath, item, favSet, 0, gameItemsCount);
          allClips.push(...clips);
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }

  return allClips.sort((a, b) => b.date - a.date);
}

async function fromDirectory(dirPath, game, favSet, processedCount, totalItems) {
  const clipFiles = [];
  let itemsProcessed = processedCount;

  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const name = item.match(/[\sA-Za-z0-9]+/)?.[0] || item;
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          const subClips = await fromDirectory(fullPath, game, favSet);
          clipFiles.push(...subClips);
        } else if (stat.isFile() && (item.endsWith(".mp4") || item.endsWith(".mkv"))) {
          itemsProcessed++;

          getMainWindow()?.webContents.send("clip-loading-progress", {
            current: 1,
            total: 1,
            game,
            itemsTotal: totalItems,
            itemsProcessed,
          });

          const fileDate = Math.floor(stat.mtime.getTime() / 1000);
          const parsedDate = parseDateFromFilename(item);
          const effectiveDate = parsedDate || fileDate;

          const clipMeta = await meta.load(fullPath);
          let duration;
          if (clipMeta?.date === effectiveDate) {
            duration = clipMeta.duration;
          } else {
            duration = await dur.get(fullPath);
            await meta.save(fullPath, { date: effectiveDate, duration });
          }

          const thumbnail = await thumbs.generate(fullPath);

          clipFiles.push({
            game,
            name,
            filePath: fullPath,
            mediaPath: `clips://${encodeURIComponent(fullPath)}`,
            date: effectiveDate,
            formattedDate: formatDate(effectiveDate),
            isFavourite: favSet.has(fullPath),
            thumbnail: `clips://${encodeURIComponent(thumbnail)}`,
            videoDuration: duration,
          });
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return clipFiles;
}

async function deleteClipFile(filePath) {
  try {
    await fs.unlink(filePath);
    await meta.remove(filePath);
    await thumbs.remove(filePath);
    dur.invalidate(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting clip:", error);
    return false;
  }
}

async function getSizes(filePaths) {
  const sizes = {};
  for (const fp of filePaths) {
    try {
      const stat = await fs.stat(fp);
      sizes[fp] = stat.size;
    } catch {
      sizes[fp] = 0;
    }
  }
  return sizes;
}

async function createClip(inputFile, startTime, endTime, outputFile) {
  try {
    const startSeconds = parseTimeToSeconds(startTime);
    const endSeconds = parseTimeToSeconds(endTime);

    const command = `ffmpeg -ss ${startTime} -to ${endTime} -i "${inputFile}" -c copy -movflags +faststart "${outputFile}" -y`;

    await new Promise((resolve, reject) => {
      const child = exec(command, { windowsHide: true }, (error) => {
        if (error) reject(error);
        else resolve();
      });

      const progressInterval = setInterval(() => {
        try {
          const progressData = { totalDuration: endSeconds - startSeconds, startSeconds };
          getMainWindow()?.webContents.send("clip-progress", progressData);
        } catch {}
      }, 500);

      child.on("close", () => clearInterval(progressInterval));
    });

    await thumbs.generate(outputFile);
    const duration = await dur.get(outputFile);
    const stats = await fs.stat(outputFile);
    const formattedDate = formatDate(Math.floor(stats.mtimeMs / 1000));

    return { success: true, path: outputFile, duration, formattedDate };
  } catch (error) {
    console.error("Error creating clip:", error);
    return { success: false, error: error.message };
  }
}

async function renameClipFile(oldPath, newName) {
  try {
    const dir = path.dirname(oldPath);
    const oldFileName = path.basename(oldPath);
    const ext = path.extname(oldPath);

    const dateMatch = oldFileName.match(/^(.+?)_([\d-]+_[\d-]+(?:\.?\d*)?)\.mp4$/);
    const dateTimePart = dateMatch?.[2] || "";
    const newFileName = dateTimePart
      ? `${newName}_${dateTimePart}${ext}`
      : `${newName}${ext}`;
    const newPath = path.join(dir, newFileName);

    await fs.rename(oldPath, newPath);
    await meta.rename(oldPath, newPath);
    dur.invalidate(oldPath);
    await thumbs.remove(oldPath);

    return { newPath, newName };
  } catch (error) {
    console.error("Error renaming clip:", error);
    return null;
  }
}

async function scanForNewClips(gameDir, gameName, sinceTimestamp) {
  if (!gameDir) return [];
  const newClips = [];
  const sinceMs = sinceTimestamp || 0;
  const favourites = await loadFavourites();
  const favSet = new Set(favourites);

  try {
    const items = await fs.readdir(gameDir);
    for (const item of items) {
      const fullPath = path.join(gameDir, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile() && (item.endsWith(".mp4") || item.endsWith(".mkv"))) {
          const fileAgeMs = stat.mtimeMs - sinceMs;
          if (fileAgeMs > 5000) {
            const name = item.match(/[\sA-Za-z0-9]+/)?.[0] || item;
            const parsedDate = parseDateFromFilename(item);
            const effectiveDate = parsedDate || Math.floor(stat.mtime.getTime() / 1000);
            const thumbnail = await thumbs.generate(fullPath);

            let duration;
            const clipMeta = await meta.load(fullPath);
            if (clipMeta?.date === effectiveDate) {
              duration = clipMeta.duration;
            } else {
              duration = await dur.get(fullPath);
              await meta.save(fullPath, { date: effectiveDate, duration });
            }

            newClips.push({
              game: gameName,
              name,
              filePath: fullPath,
              mediaPath: `clips://${encodeURIComponent(fullPath)}`,
              date: effectiveDate,
              formattedDate: formatDate(effectiveDate),
              isFavourite: favSet.has(fullPath),
              thumbnail: `clips://${encodeURIComponent(thumbnail)}`,
              videoDuration: duration,
              newClip: true,
            });
          }
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${gameDir}:`, error);
  }

  return newClips;
}

module.exports = {
  getAllWithMetadata,
  deleteClipFile,
  getSizes,
  createClip,
  renameClipFile,
  scanForNewClips,
};
