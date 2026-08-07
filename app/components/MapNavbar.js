"use client";
import Link from 'next/link';
import { Menu, Download } from 'lucide-react';

export default function MapNavbar({ scenarioPrompt, session, onExport, onShare }) {
  return (
    <nav style={{
      position: 'absolute', top: '16px', left: '24px', right: '24px', zIndex: 50,
      padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(12, 12, 15, 0.85)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
    }}>
      {/* Left: Home + Prompt title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/" title="Return Home" style={{
          width: '38px', height: '38px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#e4e4e7', textDecoration: 'none',
        }}>
          <Menu size={18} />
        </Link>
        <span style={{
          fontSize: '15px', fontWeight: '700', color: '#ffffff',
          letterSpacing: '-0.01em', maxWidth: '400px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {scenarioPrompt || 'Scenario Map'}
        </span>
      </div>

      {/* Right: Export, Share, Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onExport} style={{
          display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px',
          borderRadius: '20px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)', color: '#f4f4f5',
          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>
          <Download size={14} /><span>Export</span>
        </button>

        <button onClick={onShare} style={{
          display: 'flex', alignItems: 'center', padding: '8px 18px',
          borderRadius: '20px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)', color: '#f4f4f5',
          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>
          Share
        </button>

        {session?.user?.image ? (
          <img src={session.user.image} alt="Profile" style={{
            width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover',
            border: '2px solid rgba(139,92,246,0.6)', marginLeft: '4px',
          }} />
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '14px', marginLeft: '4px',
          }}>
            {(session?.user?.name || session?.user?.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>
    </nav>
  );
}
