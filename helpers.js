const videoElement = document.getElementById("video");
const videoSource = document.getElementById("video-source");
const clipTitle = document.getElementById("clip-title");
const clipGame = document.getElementById("clip-game");
const clipDate = document.getElementById("clip-date");
const clipFilename = document.getElementById("clip-filename");
const clipFavourite = document.getElementById("clip-favourite");

document.addEventListener("DOMContentLoaded", () => {
  clipFavourite.addEventListener("click", (e) => {
    window.electron
      .toggleFavourite(clipFilename.textContent)
      .then((favourites) => {
        const isFavourite = favourites.includes(clipFilename.textContent);
        clipFavourite.textContent = isFavourite ? "★" : "☆";
        clipFavourite.classList.toggle("active");

        if (window.updateFavouriteStatus) {
          window.updateFavouriteStatus(clipFilename.textContent, isFavourite);
        }
      });
  });
});

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const createCollapsibleSection = (title, className = "section") => {
  const section = document.createElement("div");
  section.className = className;

  const header = document.createElement(
    className === "game-section" ? "h2" : "h3"
  );
  header.textContent = title;
  header.className = `${className}-title`;

  header.addEventListener("click", () => {
    header.classList.toggle("collapsed");
    const container = section.querySelector(".clips-container");
    container.style.display =
      container.style.display === "none" ? "flex" : "none";
  });

  section.appendChild(header);

  const clipsContainer = document.createElement("div");
  clipsContainer.className = "clips-container";
  clipsContainer.style.display = "none";
  section.appendChild(clipsContainer);

  return { section, clipsContainer };
};

export const createClipItem = (clip) => {
  const clipItem = document.createElement("div");
  const clipDate = new Date(clip.date);
  clipItem.textContent = `${clip.fileName} (${clipDate.toLocaleTimeString()})`;
  clipItem.className = `clip-item ${clip.isFavourite ? "favourite" : ""}`;

  const favouriteIcon = document.createElement("span");
  favouriteIcon.textContent = clip.isFavourite ? "★" : "☆";
  favouriteIcon.className = "favourite-icon";
  favouriteIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    window.electron.toggleFavourite(clip.filePath).then((favourites) => {
      const isFavourite = favourites.includes(clip.filePath);
      favouriteIcon.textContent = isFavourite ? "★" : "☆";
      clipItem.classList.toggle("favourite");

      if (window.updateFavouriteStatus) {
        window.updateFavouriteStatus(clip.filePath, isFavourite);
      }
    });
  });

  clipItem.appendChild(favouriteIcon);
  clipItem.addEventListener("click", () => playClip(clip));
  return clipItem;
};

export const createFavouritesSection = (clips) => {
  const favouriteClips = clips.filter((clip) => clip.isFavourite);
  if (favouriteClips.length === 0) return null;

  const { section, clipsContainer } = createCollapsibleSection(
    "Favourites",
    "favourites-section"
  );

  // have section open by default
  section.querySelector("h3").classList.add("collapsed");
  clipsContainer.style.display = "flex";

  favouriteClips.forEach((clip) =>
    clipsContainer.appendChild(createClipItem(clip))
  );
  return section;
};

export const groupClipsByGameAndDate = (clips) => {
  const gameGroups = {};

  clips.forEach((clip) => {
    if (!gameGroups[clip.game]) {
      gameGroups[clip.game] = {
        today: [],
        yesterday: [],
        earlier: {},
      };
    }

    const clipDate = new Date(clip.date);
    const dateKey = clipDate.toISOString().split("T")[0];
    const group = gameGroups[clip.game];

    if (isSameDay(new Date(), clipDate)) {
      group.today.push(clip);
    } else if (isSameDay(new Date(Date.now() - 86400000), clipDate)) {
      group.yesterday.push(clip);
    } else {
      if (!group.earlier[dateKey]) {
        group.earlier[dateKey] = [];
      }
      group.earlier[dateKey].push(clip);
    }
  });

  return gameGroups;
};

export const groupClipsByDate = (clips) => {
  const groups = {
    today: [],
    yesterday: [],
    earlier: {},
  };

  clips.forEach((clip) => {
    const clipDate = new Date(clip.date);
    const dateKey = clipDate.toISOString().split("T")[0];

    if (isSameDay(new Date(), clipDate)) {
      groups.today.push(clip);
    } else if (isSameDay(new Date(Date.now() - 86400000), clipDate)) {
      groups.yesterday.push(clip);
    } else {
      if (!groups.earlier[dateKey]) {
        groups.earlier[dateKey] = [];
      }
      groups.earlier[dateKey].push(clip);
    }
  });

  groups.today.sort((a, b) => b.date - a.date);
  groups.yesterday.sort((a, b) => b.date - a.date);

  return groups;
};

export const formatDate = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const monthName = monthNames[month - 1];
  return `${monthName} ${day}, ${year}`;
};

export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export function playClip(clip) {
  videoSource.src = clip.filePath;
  videoElement.load();
  videoElement.play();

  clipTitle.textContent = clip.fileName;
  clipGame.textContent = `${clip.game}`;
  clipDate.textContent = `${new Date(clip.date).toLocaleString()}`;
  clipFilename.textContent = `${clip.filePath}`;

  clipFavourite.textContent = clip.isFavourite ? "★" : "☆";
  if (clip.isFavourite) {
    clipFavourite.classList.add("active");
  } else {
    clipFavourite.classList.remove("active");
  }

  clipFilename.addEventListener("click", () => {
    window.electron.openFileExplorer(clip.filePath);
  });
}
