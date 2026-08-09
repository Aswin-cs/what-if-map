"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function InitialLoader({ children }) {
  const { status } = useSession();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    let fadeTimer, unmountTimer;

    const p1 = setTimeout(() => { setProgress(35); setStatusText("Connecting"); }, 100);
    const p2 = setTimeout(() => { setProgress(60); setStatusText("Authenticating"); }, 350);
    const p3 = setTimeout(() => { setProgress(85); setStatusText("Loading workspace"); }, 700);

    if (status === "loading") {
      setStatusText("Authenticating");
    } else {
      const p4 = setTimeout(() => { setProgress(100); setStatusText("Ready"); }, 900);
      fadeTimer = setTimeout(() => setIsFadingOut(true), 1400);
      unmountTimer = setTimeout(() => setIsMounted(false), 2200);

      return () => {
        clearTimeout(p1); clearTimeout(p2); clearTimeout(p3); clearTimeout(p4);
        clearTimeout(fadeTimer); clearTimeout(unmountTimer);
      };
    }

    return () => {
      clearTimeout(p1); clearTimeout(p2); clearTimeout(p3);
      clearTimeout(fadeTimer); clearTimeout(unmountTimer);
    };
  }, [status]);

  return (
    <>
      {children}
      {isMounted && (
        <div className={`il-overlay ${isFadingOut ? "il-out" : ""}`}>
          <div className="il-center">
            <div className="il-spinner">
              <div className="il-spinner-track" />
            </div>

            <h1 className="il-title">What-If Map</h1>
            <p className="il-sub">Decision Engine</p>

            <div className="il-bar">
              <div className="il-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <span className="il-status">{statusText}</span>
          </div>

          <style>{`
            .il-overlay {
              position: fixed; inset: 0; z-index: 9999;
              background: linear-gradient(145deg, #0c0515 0%, #110a1f 40%, #09090b 100%);
              display: flex; align-items: center; justify-content: center;
              transition: opacity 0.7s ease, filter 0.7s ease;
            }
            .il-out { opacity: 0; filter: blur(6px); pointer-events: none; }

            .il-center {
              display: flex; flex-direction: column; align-items: center;
              text-align: center;
            }

            .il-spinner {
              width: 48px; height: 48px;
              margin-bottom: 28px;
            }
            .il-spinner-track {
              width: 100%; height: 100%;
              border-radius: 50%;
              border: 2px solid rgba(139,92,246,0.12);
              border-top-color: #8b5cf6;
              animation: il-spin 0.9s linear infinite;
            }
            @keyframes il-spin { to { transform: rotate(360deg); } }

            .il-title {
              font-size: 22px; font-weight: 700;
              letter-spacing: -0.03em;
              color: #fafafa;
              margin: 0 0 4px; line-height: 1;
            }
            .il-sub {
              font-size: 11px; font-weight: 500;
              letter-spacing: 0.14em; text-transform: uppercase;
              color: rgba(139,92,246,0.45);
              margin: 0 0 28px;
            }

            .il-bar {
              width: 160px; height: 2px;
              background: rgba(139,92,246,0.1);
              border-radius: 2px;
              overflow: hidden;
              margin-bottom: 16px;
            }
            .il-bar-fill {
              height: 100%;
              background: #8b5cf6;
              border-radius: 2px;
              transition: width 0.5s cubic-bezier(0.22,1,0.36,1);
            }

            .il-status {
              font-size: 11px; font-weight: 500;
              color: rgba(139,92,246,0.4);
              letter-spacing: 0.02em;
            }

            @media (prefers-reduced-motion: reduce) {
              .il-spinner-track { animation: none !important; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
