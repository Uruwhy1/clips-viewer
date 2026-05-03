import {
  createContext,
  useState,
  useContext,
  ReactNode,
} from "react";

interface MediaContextType {
  coverCache: Map<string, string>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

interface MediaProviderProps {
  children: ReactNode;
}

export const MediaProvider = ({ children }: MediaProviderProps) => {
  const [coverCache] = useState<Map<string, string>>(new Map());

  const contextValue = {
    coverCache,
  };

  return (
    <MediaContext.Provider value={contextValue}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};

export default MediaContext;