import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Zap, RefreshCw, Star, Info } from 'lucide-react';

function ScoreBar({ label, value, max = 10, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '62px', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min((value / max) * 100, 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
      <div className="font-mono" style={{ fontSize: '0.7rem', color, width: '28px', textAlign: 'right' }}>{value.toFixed(1)}</div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 8) return '#00ff87';
  if (score >= 6) return '#e2b714';
  if (score >= 4) return '#04f5ff';
  return '#e90052';
}

export default function CaptainAdvisorCard({ players }) {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [refreshed, setRefreshed] = useState(false);

  const compute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/captain-advisor');
      const data = await res.json();
      setPicks(data.picks || []);
    } catch {
      // Fallback: compute from provided players
      if (players && players.length > 0) {
        const scored = players
          .filter((p) => p.minutes > 0)
          .map((p) => {
            const form = Math.min((p.form || 0) * 1.2, 10);
            const ict = Math.min(((p.ict_index || 0) / 15), 10);
            const pts = Math.min(((p.total_points || 0) / 20), 10);
            const own = Math.min(((p.selected_by_percent || 0) / 10), 10);
            const score = (form * 0.35 + ict * 0.30 + pts * 0.20 + own * 0.15);
            return {
              name: p.name,
              team: p.team_name,
              position: p.position,
              price: p.price,
              form: p.form || 0,
              ict: p.ict_index || 0,
              ownership: p.selected_by_percent || 0,
              total_points: p.total_points || 0,
              score: Math.min(score, 10),
              form_score: form,
              ict_score: ict,
              pts_score: pts,
              own_score: own,
              reasoning: `${p.name} scores ${score.toFixed(1)}/10 â€” ${form >= 7 ? 'excellent form' : 'decent form'}, ${ict >= 6 ? 'high threat' : 'moderate ICT'}, and ${own >= 5 ? 'popular pick' : 'low differential'}. ${p.ep_next ? `Expected ~${p.ep_next} pts next GW.` : ''}`,
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setPicks(scored);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { compute(); }, [players]);

  const handleRefresh = () => {
    setRefreshed(true);
    compute();
    setTimeout(() => setRefreshed(false), 1500);
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #e2b714, #ff6b35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(226,183,20,0.3)' }}>
            <Crown size={18} color="#fff" />
          </div>
          <div>
            <div className="font-display" style={{ fontWeight: 800, fontSize: '1.05rem' }}>
              AI Captain Advisor
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Form Â· Fixtures Â· ICT Â· Ownership
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontFamily: 'var(--font-main)' }}
        >
          <RefreshCw size={13} style={{ animation: refreshed ? 'spin 1s linear' : 'none' }} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing captain picks...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {picks.map((p, idx) => {
            const scoreColor = getScoreColor(p.score);
            const isExpanded = expanded === idx;
            return (
              <div
                key={idx}
                onClick={() => setExpanded(isExpanded ? null : idx)}
                style={{
                  padding: '14px 16px',
                  background: idx === 0 ? 'rgba(226,183,20,0.07)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  border: `1px solid ${idx === 0 ? 'rgba(226,183,20,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Rank */}
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: idx === 0 ? 'var(--pl-gold)' : 'var(--text-muted)', width: '22px', flexShrink: 0 }}>
                    {idx === 0 ? <Crown size={20} color="var(--pl-gold)" /> : `${idx + 1}`}
                  </div>

                  {/* Score badge */}
                  <div className="captain-score" style={{ background: `${scoreColor}20`, border: `1px solid ${scoreColor}40`, color: scoreColor }}>
                    {p.score.toFixed(1)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px', color: 'var(--text-muted)' }}>
                        {p.position}
                      </span>
                      {idx === 0 && <Star size={13} color="var(--pl-gold)" fill="var(--pl-gold)" />}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.team} Â· Â£{p.price?.toFixed(1)}m Â· {p.ownership}% owned
                    </div>
                  </div>

                  {/* Form chip */}
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: p.form >= 6 ? 'var(--pl-neon-green)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Form {p.form}
                  </div>
                </div>

                {/* Expanded breakdown */}
                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <ScoreBar label="Form" value={p.form_score} color="var(--pl-neon-green)" />
                    <ScoreBar label="ICT Index" value={p.ict_score} color="var(--pl-cyan)" />
                    <ScoreBar label="Total Pts" value={p.pts_score} color="var(--pl-gold)" />
                    <ScoreBar label="Ownership" value={p.own_score} color="#a78bfa" />
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <Info size={12} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#0369a1' }} />
                      {p.reasoning}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Click any pick to see detailed breakdown Â· Scores based on Form (35%), ICT (30%), Points (20%), Ownership (15%)
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
