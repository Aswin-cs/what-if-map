"use client";

import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [userPrompt,setUserPrompt] = useState(null)
  const [flowData, setFlowData] = useState(null);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <UserContext.Provider
      value={{
        nodes,
        setNodes,
        edges,
        setEdges,
        flowData,
        setFlowData,
        currentHistoryId,
        setCurrentHistoryId,
        isLoading,
        setIsLoading,
        userPrompt,
        setUserPrompt
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}