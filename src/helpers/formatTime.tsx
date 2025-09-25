export const formatTime = (time: number): string => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");

  let string =
    hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;

  return string;
};
