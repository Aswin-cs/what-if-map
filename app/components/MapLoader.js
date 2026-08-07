"use client";
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import DotGrid from './DotGrid';

export default function MapLoader({ loadError }) {
  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#09090b',
      color: '#f4f4f5', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot Grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <DotGrid dotSize={3} gap={15} baseColor="#2F293A" activeColor="#ff2727ff"
          proximity={120} shockRadius={250} shockStrength={5} resistance={750} returnDuration={1.5} />
      </div>

      {/* Glass Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(18, 18, 24, 0.75)', backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '24px',
        padding: '40px 48px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', maxWidth: '420px', width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          animation: loadError ? 'none' : 'map-loader-pulse 2s ease-in-out infinite',
        }}>
          <Sparkles size={28} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px', color: '#fff' }}>
          {loadError ? 'Scenario Not Found' : 'Loading Scenario Map...'}
        </h2>

        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          {loadError || 'Fetching your scenario data...'}
        </p>

        {loadError && (
          <Link href="/" style={{
            marginTop: '20px', padding: '10px 24px', background: '#7c3aed',
            color: '#fff', borderRadius: '9999px', fontSize: '14px',
            fontWeight: '600', textDecoration: 'none',
          }}>
            ← Back to Home
          </Link>
        )}
      </div>

      <style>{`
        @keyframes map-loader-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
