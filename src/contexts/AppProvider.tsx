import { ReactNode } from "react";
import { SettingsProvider } from "./SettingsContext";
import { ClipsProvider } from "./ClipsContext";
import { PopupProvider } from "./PopupContext";
import { RecordingProvider } from "./RecordingContext";

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <PopupProvider>
      <SettingsProvider>
        <ClipsProvider>
          <RecordingProvider>
            {children}
          </RecordingProvider>
        </ClipsProvider>
      </SettingsProvider>
    </PopupProvider>
  );
};
