"use client";

import Link from 'next/link';
import Image from 'next/image';
import './wim-loader.css';

export default function MapLoader({ loadError, isUnauth = false, defaultStatus = 'LOADING SCENARIO' }) {
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

            {/* Typography */}
            <div className="wim-brand-wrap">
              <h1 className="wim-title">W H A T - I F &nbsp; M A P</h1>
              <p className="wim-tagline">
                {isUnauth ? "Sign in to access your scenario workspace." : "Every path begins with a question."}
              </p>
            </div>

            {/* Progress or Sign-in Action */}
            {!isUnauth ? (
              <div className="wim-progress-area">
                <div className="wim-progress-labels">
                  <span className="wim-status-text">{defaultStatus}</span>
                  <span className="wim-percent-val">...</span>
                </div>

                <div className="wim-track">
                  <div className="wim-fill-infinite" />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '32px' }}>
                <Link href="/login" className="wim-signin-btn">
                  Sign In to Continue →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
