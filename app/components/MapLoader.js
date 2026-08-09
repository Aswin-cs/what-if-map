"use client";
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function MapLoader({ loadError }) {
  return (
    <div className="ml-root">
      <div className="ml-card">
        {loadError ? (
          <>
            <div className="ml-err-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="ml-title">Scenario Not Found</h2>
            <p className="ml-desc">{loadError}</p>
            <Link href="/" className="ml-btn">← Back to Home</Link>
          </>
        ) : (
          <>
            <div className="ml-spinner-wrap">
              <div className="ml-ring" />
              <div className="ml-icon">
                <Sparkles size={18} strokeWidth={1.6} />
              </div>
            </div>

            <h2 className="ml-title">Loading Scenario</h2>

            <div className="ml-desc-row">
              <span>Fetching decision tree</span>
              <span className="ml-dots">
                <span className="ml-dot" />
                <span className="ml-dot" />
                <span className="ml-dot" />
              </span>
            </div>

            <div className="ml-bar">
              <div className="ml-bar-fill" />
            </div>
          </>
        )}
      </div>

      <style>{`
        .ml-root {
          width: 100vw; height: 100vh;
          background: linear-gradient(145deg, #0c0515 0%, #110a1f 40%, #09090b 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #fafafa;
        }

        .ml-card {
          background: rgba(139,92,246,0.04);
          border: 1px solid rgba(139,92,246,0.1);
          border-radius: 20px;
          padding: 40px 44px 32px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
          max-width: 340px; width: 90%;
        }

        .ml-spinner-wrap {
          position: relative;
          width: 48px; height: 48px;
          margin-bottom: 22px;
          display: flex; align-items: center; justify-content: center;
        }
        .ml-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(139,92,246,0.12);
          border-top-color: #8b5cf6;
          animation: ml-spin 1s linear infinite;
        }
        @keyframes ml-spin { to { transform: rotate(360deg); } }

        .ml-icon { color: rgba(139,92,246,0.55); }

        .ml-err-icon {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.12);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .ml-title {
          font-size: 16px; font-weight: 700;
          letter-spacing: -0.02em;
          color: #fafafa;
          margin: 0 0 8px;
        }

        .ml-desc {
          font-size: 13px;
          color: rgba(139,92,246,0.35);
          margin: 0 0 20px;
          line-height: 1.5;
        }
        .ml-desc-row {
          display: flex; align-items: center; gap: 3px;
          font-size: 13px; color: rgba(139,92,246,0.4);
          margin-bottom: 22px;
        }
        .ml-dots {
          display: inline-flex; gap: 3px; align-items: center;
        }
        .ml-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(139,92,246,0.5);
          animation: ml-bounce 1.2s ease-in-out infinite;
        }
        .ml-dot:nth-child(2) { animation-delay: 0.15s; }
        .ml-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes ml-bounce {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }

        .ml-bar {
          width: 100%; height: 2px;
          background: rgba(139,92,246,0.08);
          border-radius: 2px;
          overflow: hidden;
        }
        .ml-bar-fill {
          width: 100%; height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(139,92,246,0.45) 50%,
            transparent 100%
          );
          animation: ml-shimmer 1.8s ease-in-out infinite;
        }
        @keyframes ml-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .ml-btn {
          padding: 9px 24px;
          background: #8b5cf6;
          color: #fff;
          border-radius: 9999px;
          font-size: 13px; font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .ml-btn:hover { opacity: 0.85; }

        @media (prefers-reduced-motion: reduce) {
          .ml-ring, .ml-dot, .ml-bar-fill { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
