const { ipcMain } = require("electron");
const { loadFavourites, saveFavourites } = require("../favourites");

function register() {
  ipcMain.handle("toggle-favourite", async (_event, filePath) => {
    try {
      const favourites = await loadFavourites();
      const index = favourites.indexOf(filePath);
      if (index > -1) {
        favourites.splice(index, 1);
      } else {
        favourites.push(filePath);
      }
      await saveFavourites(favourites);
      return favourites;
    } catch (error) {
      console.error("Error toggling favourite:", error);
      return [];
    }
  });

  ipcMain.handle("save-all-favourites", async (_event, favouritesArray) => {
    try {
      await saveFavourites(favouritesArray);
      return true;
    } catch (error) {
      console.error("Error saving all favourites:", error);
      return false;
    }
  });
}

module.exports = { register };
