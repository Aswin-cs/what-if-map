"use client";

import Link from 'next/link';
import { Brain, Download, Share2, Sparkles, User, Layers } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function MapNavbar({ scenarioPrompt, session, onExport, onShare }) {
  const user = session?.user;
  const userInitials = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <nav style={{
      position: 'absolute', top: '16px', left: '24px', right: '24px', zIndex: 50,
      padding: '0 20px', height: '54px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      borderRadius: '16px',
      border: '1px solid var(--nav-border)',
      boxShadow: 'var(--nav-shadow)',
      fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* Left: Brand + Navigation + Scenario Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Brand Icon */}
        <Link href="/" title="Home" style={{
          display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none'
        }}>
          <div className="nav-brand-icon">
            <img src="/logo.svg" alt="What If Logo" className="nav-brand-logo-img" />
          </div>
          <span style={{
            fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em'
          }}>
            What If
          </span>
        </Link>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--nav-border)' }} />

        {/* Central Nav Links */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid var(--nav-border)',
          borderRadius: '9999px', padding: '3px 4px'
        }}>
          <Link href="/" style={{
            fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)',
            padding: '4px 12px', borderRadius: '9999px', textDecoration: 'none'
          }}>
            Explore
          </Link>
          <Link href="/hi" style={{
            fontSize: '12px', fontWeight: '600', color: 'var(--accent-purple)',
            background: 'rgba(139, 92, 246, 0.18)', padding: '4px 12px',
            borderRadius: '9999px', textDecoration: 'none'
          }}>
            Map
          </Link>
          <Link href="/profile" style={{
            fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)',
            padding: '4px 12px', borderRadius: '9999px', textDecoration: 'none'
          }}>
            Profile
          </Link>
        </div>

        {/* Current Scenario Prompt Pill */}
        {scenarioPrompt && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '4px 14px', borderRadius: '9999px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            color: 'var(--accent-purple)', fontSize: '12px', fontWeight: '600',
            maxWidth: '320px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
          }}>
            <Sparkles size={12} color="#8b5cf6" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scenarioPrompt}
            </span>
          </div>
        )}
      </div>

      {/* Right: Theme Toggle, Actions & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ThemeToggle />

        <button onClick={onExport} className="map-nav-btn">
          <Download size={13} color="#8b5cf6" />
          <span>Export</span>
        </button>

        <button onClick={onShare} className="map-nav-btn">
          <Share2 size={13} color="#8b5cf6" />
          <span>Share</span>
        </button>

        <Link href="/profile" title="View Profile" style={{ textDecoration: 'none' }}>
          {user?.image ? (
            <img src={user.image} alt="Profile" style={{
              width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
              cursor: 'pointer'
            }} />
          ) : (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: '1.5px solid rgba(139, 92, 246, 0.5)',
              display: 'flex', alignItems: 'center', justify: 'center',
              color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
            }}>
              {userInitials}
            </div>
          )}
        </Link>
      </div>

      <style>{`
        .map-nav-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.22);
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .map-nav-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </nav>
  );
}

