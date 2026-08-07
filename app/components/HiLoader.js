"use client";
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import DotGrid from './DotGrid';

/**
 * Full-screen loader used by /hi/page.js (fresh AI map).
 * Shows a spinning conic-gradient ring + BrainCircuit icon + animated progress bar.
 * Pass isUnauth=true to show redirect messaging instead.
 */
export default function HiLoader({ isUnauth = false }) {
  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#09090b', color: '#f4f4f5',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot Grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <DotGrid dotSize={3} gap={15} baseColor="#2F293A" activeColor="#ff2727ff"
          proximity={120} shockRadius={250} shockStrength={5} resistance={750} returnDuration={1.5} />
      </div>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.05) 50%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Glass Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(18,18,24,0.75)', backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px',
        padding: '40px 48px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.2)',
        maxWidth: '420px', width: '90%',
      }}>
        {/* Spinning ring + icon */}
        <div style={{ position: 'relative', width: '76px', height: '76px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', padding: '3px',
            background: 'conic-gradient(from 0deg, #8b5cf6, #3b82f6, #ec4899, #8b5cf6)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor', maskComposite: 'exclude',
            animation: 'hi-spin 1.4s linear infinite',
            filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.6))',
          }} />
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2))',
            border: '1px solid rgba(139,92,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}>
            <BrainCircuit size={28} color="#c4b5fd" style={{ filter: 'drop-shadow(0 0 8px #8b5cf6)' }} />
          </div>
        </div>

        {/* Heading */}
        <h2 style={{
          fontSize: '20px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg,#ffffff 0%,#c4b5fd 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {isUnauth ? 'Redirecting to Sign In...' : 'Loading Scenario Map...'}
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
          {isUnauth
            ? 'Please sign in to access your cognitive decision studio'
            : 'Synthesizing AI scenario paths & neural decision vectors...'}
        </p>

        {/* Animated progress bar */}
        <div style={{
          width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '4px', marginTop: '24px', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%',
            background: 'linear-gradient(90deg,#8b5cf6,#3b82f6,#ec4899)',
            borderRadius: '4px', animation: 'hi-bar 1.5s ease-in-out infinite alternate',
            boxShadow: '0 0 10px #8b5cf6',
          }} />
        </div>

        {isUnauth && (
          <Link href="/login" style={{
            marginTop: '20px', padding: '10px 24px', background: '#7c3aed',
            color: '#fff', borderRadius: '9999px', fontSize: '14px',
            fontWeight: '600', textDecoration: 'none',
          }}>
            Sign In
          </Link>
        )}
      </div>

      <style>{`
        @keyframes hi-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes hi-bar  { 0%{left:0%;width:30%} 100%{left:70%;width:30%} }
      `}</style>
    </div>
  );
}
