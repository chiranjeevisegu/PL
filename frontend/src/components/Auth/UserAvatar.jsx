import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ClipboardList, Clock, ChevronRight, Zap } from 'lucide-react';

const COLORS = [
  ['#38003c', '#00ff87'],
  ['#1e3a5f', '#04f5ff'],
  ['#3b1f5c', '#e90052'],
  ['#1a3a2a', '#00ff87'],
  ['#3d1a00', '#e2b714'],
];

function getAvatarColors(username) {
  const idx = username.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

function getInitials(username) {
  return username.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ user, token, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const ref = useRef(null);

  const [bg, accent] = getAvatarColors(user?.username || 'A');
  const initials = getInitials(user?.username || 'PL');

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadHistory = async () => {
    setLoadingHist(true);
    try {
      const res = await fetch(`/api/auth/history?token=${token}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHist(false);
    }
  };

  const handleHistoryClick = () => {
    setShowHistory(true);
    loadHistory();
  };

  const handleLogout = () => {
    setOpen(false);
    localStorage.removeItem('pl_token');
    localStorage.removeItem('pl_user');
    onLogout();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Live badge */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Zap size={12} color="var(--pl-gold)" />
        <span style={{ color: 'var(--text-secondary)' }}>{user?.username}</span>
      </div>

      {/* Avatar circle */}
      <div
        id="user-avatar-btn"
        className="avatar-circle"
        onClick={() => setOpen(!open)}
        style={{ background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`, color: '#fff' }}
        title={`Logged in as ${user?.username}`}
      >
        {initials}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="avatar-dropdown">
          {/* Profile header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '1rem',
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {user?.username}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user?.email || 'PL Intelligence Hub'}
                </div>
              </div>
            </div>
          </div>

          {/* Activity History */}
          {!showHistory ? (
            <>
              <button
                id="avatar-history-btn"
                className="avatar-dropdown-item"
                onClick={handleHistoryClick}
              >
                <ClipboardList size={16} color="var(--pl-cyan)" />
                Activity History
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </button>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
              <button
                id="avatar-logout-btn"
                className="avatar-dropdown-item"
                onClick={handleLogout}
                style={{ color: 'var(--pl-pink)' }}
              >
                <LogOut size={16} color="var(--pl-pink)" />
                Logout
              </button>
            </>
          ) : (
            <div>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  ← 
                </button>
                <ClipboardList size={14} color="var(--pl-cyan)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Recent Activity</span>
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px 0' }}>
                {loadingHist ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Loading...
                  </div>
                ) : history.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No activity recorded yet
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <div key={idx} style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.action}
                      </div>
                      {item.detail && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.detail}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                        <Clock size={10} />
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '8px 16px' }}>
                <button
                  className="avatar-dropdown-item"
                  onClick={handleLogout}
                  style={{ color: 'var(--pl-pink)', padding: '8px 0' }}
                >
                  <LogOut size={14} color="var(--pl-pink)" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
