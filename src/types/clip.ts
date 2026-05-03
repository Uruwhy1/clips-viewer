export type Clip = {
  name: string;
  filePath: string;
  mediaPath: string;
  game: string;
  date: number;
  formattedDate: string;
  isFavourite: boolean;
  thumbnail: string;
  videoDuration: number;
  newClip?: boolean;
};
