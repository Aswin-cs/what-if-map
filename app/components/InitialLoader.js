"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

export default function InitialLoader({ children }) {
  const { status } = useSession();
  const [progress, setProgress] = useState(18);
  const [statusText, setStatusText] = useState("INITIALIZING ENGINE");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const canvasRef = useRef(null);

  // Background Constellation Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes
    const particleCount = 38;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update positions
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      // Draw faint connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particle dots
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha})`;
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Smooth Progress Animation
  useEffect(() => {
    let fadeTimer, unmountTimer;

    const t1 = setTimeout(() => {
      setProgress(42);
      setStatusText("MAPPING POSSIBILITIES");
    }, 180);

    const t2 = setTimeout(() => {
      setProgress(76);
      setStatusText("TRACING PATHWAYS");
    }, 600);

    if (status === "loading") {
      // Waiting for session auth
    } else {
      const t3 = setTimeout(() => {
        setProgress(100);
        setStatusText("READY");
      }, 1050);

      fadeTimer = setTimeout(() => setIsFadingOut(true), 1550);
      unmountTimer = setTimeout(() => setIsMounted(false), 2250);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [status]);

  return (
    <>
      {children}
      {isMounted && (
        <div
          className={`wim-loader-overlay ${isFadingOut ? "wim-loader-exit" : ""}`}
          role="status"
          aria-live="polite"
        >
          {/* Dynamic Interactive Constellation Canvas */}
          <canvas ref={canvasRef} className="wim-constellation-canvas" />

          {/* Central Ambient Radial Glow */}
          <div className="wim-center-glow" />

          {/* Core Content */}
          <div className="wim-center-content">
            {/* Logo in Orbit Ring */}
            <div className="wim-orbit-container">
              {/* Outer Orbit Circle */}
              <div className="wim-orbit-circle" />

              {/* Glowing Top Specular Arc */}
              <div className="wim-top-arc" />

              {/* Central What-If Emblem */}
              <div className="wim-logo-wrap">
                <img
                  src="/what-if-map-logo-animated.svg"
                  alt="What-If Map Emblem"
                  className="wim-logo-img"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="wim-brand-wrap">
              <h1 className="wim-title">W H A T - I F &nbsp; M A P</h1>
              <p className="wim-tagline">Every path begins with a question.</p>
            </div>

            {/* Progress Area */}
            <div className="wim-progress-area">
              <div className="wim-progress-labels">
                <span className="wim-status-text">{statusText}</span>
                <span className="wim-percent-val">{Math.round(progress)}%</span>
              </div>

              <div className="wim-track">
                {/* Fill bar */}
                <div
                  className="wim-fill"
                  style={{ width: `${progress}%` }}
                />

                {/* Glowing Slider Thumb / Photon Bead */}
                <div
                  className="wim-thumb"
                  style={{ left: `${progress}%` }}
                >
                  <div className="wim-thumb-core" />
                  <div className="wim-thumb-beam" />
                </div>
              </div>
            </div>
          </div>

          <style>{`
            .wim-loader-overlay {
              position: fixed;
              inset: 0;
              z-index: 99999;
              background-color: #090314;
              background-image: radial-gradient(circle at 50% 36%, #2d1254 0%, #170832 50%, #090314 90%);
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'Sora', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
              color: #ffffff;
              overflow: hidden;
              user-select: none;
              transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                          filter 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                          transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .wim-loader-exit {
              opacity: 0;
              filter: blur(14px);
              transform: scale(1.02);
              pointer-events: none;
            }

            /* Constellation Canvas */
            .wim-constellation-canvas {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              opacity: 0.85;
            }

            /* Center Ambient Purple Glow */
            .wim-center-glow {
              position: absolute;
              top: 34%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 480px;
              height: 480px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(139, 92, 246, 0.32) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%);
              filter: blur(50px);
              pointer-events: none;
              animation: wim-glow-pulse 4s ease-in-out infinite alternate;
            }

            @keyframes wim-glow-pulse {
              0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.7; }
              100% { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
            }

            /* Center Layout */
            .wim-center-content {
              position: relative;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              animation: wim-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes wim-fade-up {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }

            /* ─── Orbit Ring & Logo ─── */
            .wim-orbit-container {
              position: relative;
              width: 210px;
              height: 210px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .wim-orbit-circle {
              position: absolute;
              inset: 0;
              border-radius: 50%;
              border: 1px solid rgba(168, 85, 247, 0.28);
              box-shadow: 0 0 25px rgba(139, 92, 246, 0.15);
            }

            /* Glowing Top Specular Arc */
            .wim-top-arc {
              position: absolute;
              top: -1.5px;
              left: 50%;
              transform: translateX(-50%);
              width: 68px;
              height: 3px;
              background: #ffffff;
              border-radius: 999px;
              box-shadow: 0 0 10px #ffffff, 0 0 20px rgba(192, 132, 252, 0.9);
            }

            .wim-logo-wrap {
              position: relative;
              width: 175px;
              height: 175px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .wim-logo-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: drop-shadow(0 0 22px rgba(168, 85, 247, 0.55));
            }

            /* ─── Typography ─── */
            .wim-brand-wrap {
              margin-top: 36px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            .wim-title {
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 0.38em;
              color: #ffffff;
              margin: 0;
              line-height: 1.2;
              text-shadow: 0 2px 14px rgba(255, 255, 255, 0.25);
            }

            .wim-tagline {
              font-size: 13px;
              font-weight: 400;
              color: rgba(226, 232, 240, 0.65);
              letter-spacing: 0.02em;
              margin: 10px 0 0 0;
            }

            /* ─── Progress Area ─── */
            .wim-progress-area {
              margin-top: 36px;
              width: 270px;
              display: flex;
              flex-direction: column;
            }

            .wim-progress-labels {
              display: flex;
              align-items: baseline;
              justify-content: space-between;
              margin-bottom: 9px;
            }

            .wim-status-text {
              font-size: 9.5px;
              font-weight: 700;
              letter-spacing: 0.16em;
              color: rgba(168, 85, 247, 0.7);
              text-transform: uppercase;
            }

            .wim-percent-val {
              font-size: 12px;
              font-weight: 700;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              color: #ffffff;
            }

            .wim-track {
              position: relative;
              width: 100%;
              height: 2px;
              background: rgba(255, 255, 255, 0.09);
              border-radius: 999px;
            }

            .wim-fill {
              height: 100%;
              background: linear-gradient(90deg, rgba(168, 85, 247, 0.3) 0%, rgba(216, 180, 254, 0.95) 100%);
              border-radius: 999px;
              transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Glowing Thumb / Photon Bead */
            .wim-thumb {
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              display: flex;
              align-items: center;
              justify-content: center;
              pointer-events: none;
              transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .wim-thumb-core {
              width: 7.5px;
              height: 7.5px;
              border-radius: 50%;
              background: #ffffff;
              box-shadow: 0 0 10px #ffffff,
                          0 0 20px rgba(192, 132, 252, 0.9),
                          0 0 30px rgba(168, 85, 247, 0.6);
            }

            .wim-thumb-beam {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -20%);
              width: 1.5px;
              height: 18px;
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
              filter: blur(1.5px);
              pointer-events: none;
            }

            @media (prefers-reduced-motion: reduce) {
              .wim-center-glow { animation: none !important; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
