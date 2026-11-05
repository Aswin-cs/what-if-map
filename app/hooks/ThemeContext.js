"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

function getThemeSnapshot() {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("whatif_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  } catch {
    return "dark";
  }
}

function subscribeTheme(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const emptySubscribe = () => () => {};

export function ThemeProvider({ children }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "dark");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    try {
      localStorage.setItem("whatif_theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
