import {
  createCollapsibleSection,
  createClipItem,
  groupClipsByGameAndDate,
  groupClipsByDate,
  formatDate,
} from "./helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
  const clipsList = document.getElementById("clips-list");
  const viewByGameButton = document.getElementById("view-by-game");
  const viewByRecentButton = document.getElementById("view-by-recent");

  let allClips = [];
  let currentView = "byGame";

  try {
    allClips = await window.electron.getAllClips();
    displayClipsByGame(allClips);

    viewByGameButton.addEventListener("click", () => {
      currentView = "byGame";
      displayClipsByGame(allClips);
    });

    viewByRecentButton.addEventListener("click", () => {
      currentView = "byRecent";
      displayClipsByRecent(allClips);
    });
  } catch (error) {
    console.error("Error loading clips:", error);
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
