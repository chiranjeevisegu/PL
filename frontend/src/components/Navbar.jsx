import React from 'react';
import { Trophy, Users, BarChart3, Radio, Shield, Clock, Flame } from 'lucide-react';
import UserAvatar from './Auth/UserAvatar';

export default function Navbar({ activeTab, setActiveTab, overview, user, token, onLogout }) {
  const tabs = [
    { id: 'home',    label: 'Home',    icon: Flame },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'charts',  label: 'Analytics', icon: BarChart3 },
    { id: 'pllive',  label: 'PL Live', icon: Radio },
    { id: 'squad',   label: 'Pitch Builder', icon: Shield },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 9, 14, 0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 24px',
    }}>
      {/* Single-row, 3-column layout: Brand | Tabs (center) | Avatar (right) */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        height: '62px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: '16px',
      }}>

        {/* ── LEFT: Brand ───────────────────────────────── */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setActiveTab('home')}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '11px',
            background: 'linear-gradient(135deg, #38003c 0%, #00ff87 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,255,135,0.25)',
            flexShrink: 0,
          }}>
            <Trophy size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                PREMIER<span style={{ color: 'var(--pl-neon-green)' }}>LEAGUE</span>
              </span>
              <span className="badge-neon" style={{ padding: '1px 7px', fontSize: '0.6rem' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--pl-neon-green)', display: 'inline-block' }} className="animate-pulse-glow" />
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Intelligence · News · Squad Builder
            </div>
          </div>
        </div>

        {/* ── CENTER: Navigation Tabs ───────────────────── */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          background: 'rgba(14, 19, 31, 0.85)',
          padding: '5px',
          borderRadius: '13px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? 'var(--pl-purple)' : 'transparent',
                  color: isActive ? '#00ff87' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 10px rgba(56,0,60,0.6)' : 'none',
                  fontFamily: 'var(--font-main)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={15} color={isActive ? '#00ff87' : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── RIGHT: GW pill + User Avatar ─────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* GW info pill */}
          {overview && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.78rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '5px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <Clock size={13} color="var(--pl-cyan)" />
                <span>{overview.gw_name || 'GW'}</span>
              </div>
              {overview.avg_score > 0 && (
                <div style={{ color: 'var(--pl-neon-green)', fontWeight: 700 }}>
                  {overview.avg_score} pts avg
                </div>
              )}
            </div>
          )}

          {/* User Avatar — always pinned right */}
          {user && (
            <UserAvatar user={user} token={token} onLogout={onLogout} />
          )}
        </div>

      </div>
    </header>
  );
}
