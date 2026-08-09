"use client";
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function HiLoader({ isUnauth = false }) {
  return (
    <div className="hl-root">
      <div className="hl-card">
        <div className="hl-spinner-wrap">
          <div className="hl-ring" />
          <div className="hl-icon">
            <BrainCircuit size={20} strokeWidth={1.6} />
          </div>
        </div>

        <h2 className="hl-title">
          {isUnauth ? 'Redirecting to Sign In' : 'Building Scenario Map'}
        </h2>

        <div className="hl-desc">
          <span>
            {isUnauth
              ? 'Please sign in to access your studio'
              : 'Analyzing decision pathways'}
          </span>
          {!isUnauth && (
            <span className="hl-dots">
              <span className="hl-dot" />
              <span className="hl-dot" />
              <span className="hl-dot" />
            </span>
          )}
        </div>

        <div className="hl-bar">
          <div className="hl-bar-fill" />
        </div>

        {isUnauth && (
          <Link href="/login" className="hl-btn">Sign In →</Link>
        )}
      </div>

      <style>{`
        .hl-root {
          width: 100vw; height: 100vh;
          background: linear-gradient(145deg, #0c0515 0%, #110a1f 40%, #09090b 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #fafafa;
        }

        .hl-card {
          background: rgba(139,92,246,0.04);
          border: 1px solid rgba(139,92,246,0.1);
          border-radius: 20px;
          padding: 44px 48px 36px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
          max-width: 360px; width: 90%;
        }

        .hl-spinner-wrap {
          position: relative;
          width: 52px; height: 52px;
          margin-bottom: 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .hl-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(139,92,246,0.12);
          border-top-color: #8b5cf6;
          animation: hl-spin 1s linear infinite;
        }
        @keyframes hl-spin { to { transform: rotate(360deg); } }

        .hl-icon { color: rgba(139,92,246,0.6); }

        .hl-title {
          font-size: 17px; font-weight: 700;
          letter-spacing: -0.02em;
          color: #fafafa;
          margin: 0 0 8px;
        }

        .hl-desc {
          display: flex; align-items: center; gap: 3px;
          font-size: 13px; color: rgba(139,92,246,0.4);
          margin-bottom: 24px;
        }
        .hl-dots {
          display: inline-flex; gap: 3px; align-items: center;
        }
        .hl-dot {
          display: inline-block;
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(139,92,246,0.5);
          animation: hl-bounce 1.2s ease-in-out infinite;
        }
        .hl-dot:nth-child(2) { animation-delay: 0.15s; }
        .hl-dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes hl-bounce {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }

        .hl-bar {
          width: 100%; height: 2px;
          background: rgba(139,92,246,0.08);
          border-radius: 2px;
          overflow: hidden;
        }
        .hl-bar-fill {
          width: 100%; height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(139,92,246,0.45) 50%,
            transparent 100%
          );
          animation: hl-shimmer 1.8s ease-in-out infinite;
        }
        @keyframes hl-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .hl-btn {
          margin-top: 20px;
          padding: 9px 24px;
          background: #8b5cf6;
          color: #fff;
          border-radius: 9999px;
          font-size: 13px; font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .hl-btn:hover { opacity: 0.85; }

        @media (prefers-reduced-motion: reduce) {
          .hl-ring, .hl-dot, .hl-bar-fill { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
