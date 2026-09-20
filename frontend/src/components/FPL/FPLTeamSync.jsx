import React, { useState } from 'react';
import { Link2, Loader2, User2, Trophy, TrendingUp, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const POS_META = {
  GKP: { col: '#F59E0B', label: 'GK' },
  DEF: { col: '#3B82F6', label: 'DEF' },
  MID: { col: '#10B981', label: 'MID' },
  FWD: { col: '#F43F5E', label: 'FWD' },
};

export default function FPLTeamSync({ onTeamLoaded }) {
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamData, setTeamData] = useState(null);

  const handleSync = async () => {
    const id = teamId.trim();
    if (!id || isNaN(parseInt(id))) {
      setError('Please enter a valid FPL Team ID (number)');
      return;
    }
    setLoading(true);
    setError('');
    setTeamData(null);
    try {
      const res = await fetch(`/api/fpl-team/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Team not found');
      }
      const data = await res.json();
      setTeamData(data);
      if (onTeamLoaded && data.picks) {
        onTeamLoaded(data.picks);
      }
    } catch (e) {
      setError(e.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSync();
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #38003c, #04f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(4,245,255,0.25)' }}>
          <Link2 size={18} color="#fff" />
        </div>
        <div>
          <div className="font-display" style={{ fontWeight: 800, fontSize: '1rem' }}>FPL Team Sync</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enter your team ID to load real squad</div>
        </div>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          id="fpl-team-id-input"
          className="fpl-sync-input"
          placeholder="Enter FPL Team ID (e.g. 1234567)"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          onKeyDown={handleKey}
          type="number"
          min="1"
        />
        <button
          id="fpl-sync-btn"
          onClick={handleSync}
          disabled={loading}
          className="btn-primary"
          style={{ whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={16} />}
          {loading ? 'Syncing...' : 'Sync Team'}
        </button>
      </div>

      {/* How to find ID */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px', padding: '10px 14px', background: 'rgba(4,245,255,0.05)', border: '1px solid rgba(4,245,255,0.1)', borderRadius: '10px' }}>
        ðŸ’¡ Find your Team ID: Go to <strong style={{ color: '#0369a1' }}>fantasy.premierleague.com</strong> â†’ My Team â†’ the number in your profile URL (e.g. /entry/<strong>1234567</strong>/)
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(233,0,82,0.1)', border: '1px solid rgba(233,0,82,0.3)', borderRadius: '10px', color: '#be123c', fontSize: '0.85rem', marginBottom: '16px' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Team data display */}
      {teamData && (
        <div className="animate-fade-in">
          {/* Team info */}
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(0,255,135,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckCircle2 size={18} color="var(--pl-neon-green)" />
              <span style={{ fontWeight: 700, color: '#047857' }}>Team Loaded Successfully!</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { icon: User2, label: 'Manager', val: teamData.player_name, color: '#0369a1' },
                { icon: Shield, label: 'Team Name', val: teamData.name, color: '#047857' },
                { icon: Trophy, label: 'Total Points', val: teamData.summary_overall_points, color: '#b45309' },
                { icon: TrendingUp, label: 'Overall Rank', val: teamData.summary_overall_rank ? `#${teamData.summary_overall_rank?.toLocaleString()}` : 'â€”', color: '#be123c' },
              ].map(({ icon: Icon, label, val, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={13} color={color} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color }}>{val || 'â€”'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Players list */}
          {teamData.picks && teamData.picks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Your Squad ({teamData.picks.length} players)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                {teamData.picks.map((pick, idx) => {
                  const pos = POS_META[pick.position] || { col: '#aaa', label: '?' };
                  return (
                    <div key={idx} style={{ padding: '10px 12px', background: pick.is_captain ? 'rgba(226,183,20,0.1)' : 'rgba(0,0,0,0.2)', borderRadius: '10px', border: `1px solid ${pick.is_captain ? 'rgba(226,183,20,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: `${pos.col}22`, color: pos.col, borderRadius: '4px', fontWeight: 700 }}>{pos.label}</span>
                        {pick.is_captain && <span style={{ fontSize: '0.65rem', color: '#b45309' }}>Â©</span>}
                        {pick.is_vice_captain && <span style={{ fontSize: '0.65rem', color: '#0369a1' }}>VC</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>{pick.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {pick.team} Â· Â£{pick.price?.toFixed(1)}m
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
