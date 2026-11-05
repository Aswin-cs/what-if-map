"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/ThemeContext";

export default function ThemeToggle({ className = "", style = {} }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  if (!mounted) {
    return <div style={{ width: "40px", height: "22px", ...style }} />;
  }

  return (
    <div style={style} className={`theme-toggle-wrapper ${className}`.trim()}>
      <button
        onClick={toggleTheme}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`theme-toggle-track ${isDark ? "dark" : "light"}`}
      >
        <span className={`theme-toggle-thumb ${isDark ? "dark" : "light"}`}>
          {isDark ? (
            <Moon size={11} color="#ffffff" strokeWidth={2.5} />
          ) : (
            <Sun size={11} color="#ffffff" strokeWidth={2.5} />
          )}
        </span>
      </button>
    </div>
  );
}
