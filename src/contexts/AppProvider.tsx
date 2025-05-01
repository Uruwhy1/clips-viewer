import { ReactNode } from "react";
import { SettingsProvider } from "./SettingsContext";
import { FavoritesProvider } from "./FavoritesContext";
import { ClipsProvider } from "./ClipsContext";
import { MediaProvider } from "./MediaContext";
import { PopupProvider } from "./PopupContext";
import { OBSProvider } from "./ObsContext";

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <ClipsProvider>
          <PopupProvider>
            <OBSProvider>
              <MediaProvider>{children}</MediaProvider>
            </OBSProvider>
          </PopupProvider>
        </ClipsProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
};
