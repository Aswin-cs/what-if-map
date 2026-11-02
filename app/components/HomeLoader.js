"use client";
import { Share2 } from 'lucide-react';

export default function HomeLoader({ loaderGone, loaderFading, currentStep, loadingSteps }) {
  if (loaderGone) return null;

  return (
    <div className={`loader-overlay ${loaderFading ? "fade-out" : ""}`}>
      <div className="loader-content">
        {/* Animated Logo Orb */}
        <div className="loader-orb-wrapper">
          <div className="loader-orb" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <img src="/what-if-map-logo-animated.svg" alt="What-If Map Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <div className="loader-ring" />
          <div className="loader-ring-secondary" />
        </div>

        {/* Brand */}
        <div className="loader-brand">
          <h1 className="loader-title">What-If Map</h1>
          <p className="loader-tagline">Decision Tree & Scenario Analysis Platform</p>
        </div>

        {/* Progress Bar */}
        <div className="loader-progress-track">
          <div
            className="loader-progress-fill"
            style={{
              width: `${((currentStep + 1) / loadingSteps.length) * 100}%`,
            }}
          />
        </div>

        {/* Step Label */}
        <div className="loader-step">
          <div className="loader-step-dot" />
          <span className="loader-step-text">{loadingSteps[currentStep]}</span>
        </div>
      </div>
    </div>
  );
}
