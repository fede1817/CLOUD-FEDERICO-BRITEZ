// FileContext.js
import React, { createContext, useState, useContext } from "react";

const FileContext = createContext();

export const useFileContext = () => useContext(FileContext);

export const FileProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <FileContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </FileContext.Provider>
  );
};
