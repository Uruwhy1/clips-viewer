export type Clip = {
  name: string;
  filePath: string;
  game: string;
  date: number;
  formattedDate: string;
  isFavourite: boolean;
  thumbnail: string;
  videoDuration: number;
  newClip?: boolean;
};
