const fs = require("fs").promises;
const { FAVOURITES_PATH } = require("./config");

async function loadFavourites() {
  try {
    const data = await fs.readFile(FAVOURITES_PATH, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveFavourites(favourites) {
  await fs.writeFile(FAVOURITES_PATH, JSON.stringify(favourites));
}

module.exports = { loadFavourites, saveFavourites };
