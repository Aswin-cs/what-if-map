"use client";

import React from "react";
import styled from "styled-components";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/ThemeContext";

export default function ThemeToggle({ className = "", style = {} }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  if (!mounted) {
    return <div style={{ width: "40px", height: "22px", ...style }} />;
  }

  return (
    <StyledToggleWrapper style={style} className={className}>
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
    </StyledToggleWrapper>
  );
}

const StyledToggleWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  user-select: none;
  vertical-align: middle;

  .theme-toggle-track {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 9999px;
    cursor: pointer;
    border: none;
    padding: 0;
    outline: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
  }

  .theme-toggle-track.light {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(245, 158, 11, 0.15);
  }

  .theme-toggle-track.dark {
    background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    border: 1px solid rgba(139, 92, 246, 0.4);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(139, 92, 246, 0.2);
  }

  .theme-toggle-track:hover {
    transform: scale(1.04);
  }

  .theme-toggle-thumb {
    position: absolute;
    top: 1px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, box-shadow 0.3s ease;
  }

  .theme-toggle-thumb.light {
    transform: translateX(2px);
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 2px 6px rgba(217, 119, 6, 0.45);
  }

  .theme-toggle-thumb.dark {
    transform: translateX(18px);
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    box-shadow: 0 2px 6px rgba(109, 40, 217, 0.55);
  }
`;
