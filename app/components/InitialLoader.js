"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import "./wim-loader.css";

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
    if (!ctx) return;
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleCount = 36;
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

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

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

    if (status !== "loading") {
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
          <canvas ref={canvasRef} className="wim-constellation-canvas" />
          <div className="wim-center-glow" />

          <div className="wim-center-content">
            <div className="wim-orbit-container">
              <div className="wim-orbit-circle" />
              <div className="wim-top-arc" />
              <div className="wim-logo-wrap">
                <Image
                  src="/what-if-map-logo-animated.svg"
                  alt="What-If Map Emblem"
                  width={175}
                  height={175}
                  className="wim-logo-img"
                  priority
                />
              </div>
            </div>

            <div className="wim-brand-wrap">
              <h1 className="wim-title">W H A T - I F &nbsp; M A P</h1>
              <p className="wim-tagline">Every path begins with a question.</p>
            </div>

            <div className="wim-progress-area">
              <div className="wim-progress-labels">
                <span className="wim-status-text">{statusText}</span>
                <span className="wim-percent-val">{Math.round(progress)}%</span>
              </div>

              <div className="wim-track">
                <div className="wim-fill" style={{ width: `${progress}%` }} />
                <div className="wim-thumb" style={{ left: `${progress}%` }}>
                  <div className="wim-thumb-core" />
                  <div className="wim-thumb-beam" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
