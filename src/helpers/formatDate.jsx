export const formatDate = (dateKey) => {
  dateKey = dateKey.toString();
  const parts = dateKey.split(" ");
  const monthIndex = parts[1];
  const day = parseInt(parts[2]);
  const year = parts[3];

  return `${monthIndex} ${day}, ${year}`;
};
