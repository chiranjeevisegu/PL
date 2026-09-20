import React, { useState, useEffect } from 'react';
import { X, Swords, Trophy, Minus, TrendingUp } from 'lucide-react';

export default function H2HModal({ home, away, homeId, awayId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!homeId || !awayId) return;
    setLoading(true);
    fetch(`/api/h2h/${homeId}/${awayId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load H2H data'); setLoading(false); });
  }, [homeId, awayId]);

  const getResultColor = (result) => {
    if (result === 'HOME_WIN') return 'var(--pl-neon-green)';
    if (result === 'AWAY_WIN') return 'var(--pl-pink)';
    return 'var(--pl-cyan)';
  };

  const getResultLabel = (match, side) => {
    if (match.home_score === match.away_score) return 'D';
    if ((side === 'home' && match.home_score > match.away_score) ||
        (side === 'away' && match.away_score > match.home_score)) return 'W';
    return 'L';
  };

  const getResultBg = (label) => {
    if (label === 'W') return 'rgba(0,255,135,0.15)';
    if (label === 'L') return 'rgba(233,0,82,0.15)';
    return 'rgba(4,245,255,0.1)';
  };

  const getResultCol = (label) => {
    if (label === 'W') return 'var(--pl-neon-green)';
    if (label === 'L') return 'var(--pl-pink)';
    return 'var(--pl-cyan)';
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #38003c, #e90052)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={18} color="#fff" />
            </div>
            <div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Head-to-Head
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Historical meetings</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Teams header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '16px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#047857' }}>{home}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Home</div>
          </div>
          <div style={{ padding: '8px 16px', background: 'var(--pl-purple)', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
            VS
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0369a1' }}>{away}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Away</div>
          </div>
        </div>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading H2H data...
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#be123c', background: 'rgba(233,0,82,0.08)', borderRadius: '12px' }}>
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary record bar */}
            {data.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: `${home} Wins`, val: data.summary.home_wins, color: '#047857', icon: Trophy },
                  { label: 'Draws', val: data.summary.draws, color: '#0369a1', icon: Minus },
                  { label: `${away} Wins`, val: data.summary.away_wins, color: '#be123c', icon: Trophy },
                ].map(({ label, val, color, icon: Icon }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '14px 8px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{val}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent meetings */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <TrendingUp size={15} color="var(--pl-gold)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Last {data.meetings?.length} Meetings
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.meetings?.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No previous meetings found in PL data
                  </div>
                )}
                {data.meetings?.map((m, idx) => {
                  const homeLabel = getResultLabel(m, 'home');
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '80px' }}>
                        {m.kickoff ? new Date(m.kickoff).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : `GW ${m.gw}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.home_team}</span>
                        <div className="font-mono" style={{ padding: '3px 10px', background: 'var(--pl-purple)', borderRadius: '6px', fontWeight: 800, color: '#00ff87', fontSize: '0.85rem' }}>
                          {m.home_score} â€“ {m.away_score}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.away_team}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: getResultBg(homeLabel), color: getResultCol(homeLabel) }}>
                          {homeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
