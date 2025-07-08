import { ReactNode } from "react";
import { SettingsProvider } from "./SettingsContext";
import { FavoritesProvider } from "./FavoritesContext";
import { ClipsProvider } from "./ClipsContext";
import { MediaProvider } from "./MediaContext";
import { PopupProvider } from "./PopupContext";
import { RecordingProvider } from "./RecordingContext";

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <ClipsProvider>
          <PopupProvider>
            <RecordingProvider>
              <MediaProvider>{children}</MediaProvider>
            </RecordingProvider>
          </PopupProvider>
        </ClipsProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
};
