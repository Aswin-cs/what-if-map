"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function InitialLoader({ children }) {
  const { status } = useSession();
  const [loadingStep, setLoadingStep] = useState("Initializing session...");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    let fadeTimer;
    let unmountTimer;

    if (status === "loading") {
      setLoadingStep("Authenticating session & user workspace...");
    } else {
      setLoadingStep("Session loaded. Preparing workspace...");
      
      // Delay fade out slightly for smooth UI transition (min splash display)
      fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 500);

      // Unmount loader overlay after transition finishes (400ms fade CSS)
      unmountTimer = setTimeout(() => {
        setIsMounted(false);
      }, 900);
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [status]);

  return (
    <>
      {children}
      {isMounted && (
        <div className={`loader-overlay ${isFadingOut ? "fade-out" : ""}`}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "28px",
              animation: "float-subtle 3s ease-in-out infinite",
            }}
          >
            {/* Pulsing Brand Logo Icon */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse-ring 2s infinite ease-in-out",
                  boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>

              {/* Glowing Outer Spinner Ring */}
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "-10px",
                  right: "-10px",
                  bottom: "-10px",
                  borderRadius: "50%",
                  border: "2px solid transparent",
                  borderTopColor: "#3b82f6",
                  borderRightColor: "#8b5cf6",
                  animation: "spin-glow 1.5s linear infinite",
                }}
              />
            </div>

            {/* Brand Title & Tagline */}
            <div style={{ textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  letterSpacing: "-0.03em",
                  color: "#f4f4f5",
                  margin: "0 0 6px 0",
                  fontFamily: "inherit",
                }}
              >
                What-If Map
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#a1a1aa",
                  margin: 0,
                  fontWeight: "400",
                  letterSpacing: "0.01em",
                }}
              >
                Decision Tree & Scenario Analysis Platform
              </p>
            </div>

            {/* Shimmering Progress Bar */}
            <div
              style={{
                width: "220px",
                height: "4px",
                backgroundColor: "#18181b",
                borderRadius: "999px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid #27272a",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent 0%, #3b82f6 50%, #8b5cf6 100%)",
                  animation: "shimmer-bar 1.5s infinite ease-in-out",
                }}
              />
            </div>

            {/* Status Message */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  boxShadow: "0 0 8px #3b82f6",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "#71717a",
                  fontWeight: "500",
                  fontFamily: "monospace",
                }}
              >
                {loadingStep}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
