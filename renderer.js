import {
  createCollapsibleSection,
  createClipItem,
  groupClipsByGameAndDate,
  groupClipsByDate,
  formatDate,
  createFavouritesSection,
  playClip,
} from "./helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
  const clipsList = document.getElementById("clips-list");
  const viewByGameButton = document.getElementById("view-by-game");
  const viewByRecentButton = document.getElementById("view-by-recent");
  const viewFavouritesButton = document.getElementById("view-favourites");

  let allClips = [];
  let currentView = "byGame";

  try {
    allClips = await window.electron.getAllClips();
    allClips = allClips.sort((a, b) => b.date - a.date);
    playClip(allClips[0]);

    function updateFavouriteStatus(filePath, isFavourite) {
      const clipToUpdate = allClips.find((clip) => clip.filePath === filePath);
      if (clipToUpdate) {
        clipToUpdate.isFavourite = isFavourite;

        if (currentView === "favourites") {
          displayCurrentView();
        }
      }
    }
    function displayCurrentView() {
      switch (currentView) {
        case "byGame":
          displayClipsByGame(allClips);
          break;
        case "byRecent":
          displayClipsByRecent(allClips);
          break;
        case "favourites":
          displayFavourites(allClips);
          break;
      }
    }

    window.updateFavouriteStatus = updateFavouriteStatus;
    displayCurrentView();

    viewByGameButton.addEventListener("click", () => {
      currentView = "byGame";
      displayCurrentView();
    });

    viewByRecentButton.addEventListener("click", () => {
      currentView = "byRecent";
      displayCurrentView();
    });

    viewFavouritesButton.addEventListener("click", () => {
      currentView = "favourites";
      displayCurrentView();
    });
  } catch (error) {
    console.error("Error loading clips:", error);
  }

  function displayFavourites(clips) {
    clipsList.innerHTML = "";
    const favouritesSection = createFavouritesSection(clips);
    if (favouritesSection) {
      clipsList.appendChild(favouritesSection);
    } else {
      clipsList.innerHTML = "<p>No favourite clips yet.</p>";
    }
  }

  function displayClipsByGame(clips) {
    clipsList.innerHTML = "";
    const gameGroups = groupClipsByGameAndDate(clips);

    Object.entries(gameGroups).forEach(([game, dateGroups]) => {
      const { section: gameSection, clipsContainer: gameContainer } =
        createCollapsibleSection(game, "game-section");

      if (dateGroups.today.length > 0) {
        const { section: todaySection, clipsContainer } =
          createCollapsibleSection("Today", "date-section");
        dateGroups.today.forEach((clip) =>
          clipsContainer.appendChild(createClipItem(clip))
        );
        gameContainer.appendChild(todaySection);
      }

      if (dateGroups.yesterday.length > 0) {
        const { section: yesterdaySection, clipsContainer } =
          createCollapsibleSection("Yesterday", "date-section");
        dateGroups.yesterday.forEach((clip) =>
          clipsContainer.appendChild(createClipItem(clip))
        );
        gameContainer.appendChild(yesterdaySection);
      }

      Object.entries(dateGroups.earlier)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .forEach(([dateKey, clips]) => {
          const { section: dateSection, clipsContainer } =
            createCollapsibleSection(formatDate(dateKey), "date-section");
          clips.forEach((clip) =>
            clipsContainer.appendChild(createClipItem(clip))
          );
          gameContainer.appendChild(dateSection);
        });

      clipsList.appendChild(gameSection);
    });
  }

  function displayClipsByRecent(clips) {
    clipsList.innerHTML = "";
    const dateGroups = groupClipsByDate(clips);

    if (dateGroups.today.length > 0) {
      const { section, clipsContainer } = createCollapsibleSection(
        "Today",
        "date-section"
      );
      dateGroups.today.forEach((clip) =>
        clipsContainer.appendChild(createClipItem(clip))
      );
      clipsList.appendChild(section);
    }

    if (dateGroups.yesterday.length > 0) {
      const { section, clipsContainer } = createCollapsibleSection(
        "Yesterday",
        "date-section"
      );
      dateGroups.yesterday.forEach((clip) =>
        clipsContainer.appendChild(createClipItem(clip))
      );
      clipsList.appendChild(section);
    }

    Object.entries(dateGroups.earlier)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .forEach(([dateKey, clips]) => {
        const { section, clipsContainer } = createCollapsibleSection(
          formatDate(dateKey),
          "date-section"
        );
        clips.forEach((clip) =>
          clipsContainer.appendChild(createClipItem(clip))
        );
        clipsList.appendChild(section);
      });
  }
});
