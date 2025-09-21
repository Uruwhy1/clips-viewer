export type PopupButton = {
  text: string;
  func: () => void;
  protect: boolean;
};

export type PersistentNotificationInfo = {
  mainText: string;
  progressText?: string[];
  progress: number | null;
  isComplete?: boolean;
  buttons?: PopupButton[];
};

export type PopupData = {
  text: string;
  type: "success" | "failure";
  buttons?: PopupButton[];
};
