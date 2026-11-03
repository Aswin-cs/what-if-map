"use client";

import Link from 'next/link';

export default function MapLoader({ loadError }) {
  return (
    <div className="wim-loader-overlay" role="status" aria-live="polite">
      <div className="wim-center-glow" />

      <div className="wim-center-content">
        {loadError ? (
          <div className="wim-error-box">
            <div className="wim-orbit-container" style={{ width: '120px', height: '120px' }}>
              <div className="wim-orbit-circle" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }} />
              <span style={{ fontSize: '32px', color: '#f87171' }}>✕</span>
            </div>

            <div className="wim-brand-wrap" style={{ marginTop: '24px' }}>
              <h2 className="wim-title" style={{ fontSize: '15px', color: '#f87171', letterSpacing: '0.2em' }}>
                SCENARIO NOT FOUND
              </h2>
              <p className="wim-tagline" style={{ maxWidth: '280px', lineHeight: 1.5 }}>
                {loadError || "The requested decision pathway could not be retrieved."}
              </p>
            </div>

            <Link href="/" className="wim-error-btn">
              Return to Studio
            </Link>
          </div>
        ) : (
          <>
            {/* Logo in Orbit Ring */}
            <div className="wim-orbit-container">
              <div className="wim-orbit-circle" />
              <div className="wim-top-arc" />
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
                <span className="wim-status-text">LOADING SCENARIO</span>
                <span className="wim-percent-val">...</span>
              </div>

              <div className="wim-track">
                <div className="wim-fill-infinite" />
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .wim-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100vw;
          height: 100vh;
          background-color: #090314;
          background-image: radial-gradient(circle at 50% 36%, #2d1254 0%, #170832 50%, #090314 90%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
          color: #ffffff;
          overflow: hidden;
          user-select: none;
        }

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
        }

        .wim-center-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

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
          overflow: hidden;
        }

        .wim-fill-infinite {
          position: absolute;
          inset: 0;
          width: 50%;
          background: linear-gradient(90deg, transparent 0%, #c084fc 50%, #ffffff 100%);
          border-radius: 999px;
          animation: wim-slide 1.5s ease-in-out infinite;
        }

        @keyframes wim-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }

        .wim-error-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .wim-error-btn {
          margin-top: 24px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          padding: 8px 20px;
          border-radius: 10px;
          background: rgba(168, 85, 247, 0.2);
          border: 1px solid rgba(168, 85, 247, 0.4);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .wim-error-btn:hover {
          background: rgba(168, 85, 247, 0.35);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
