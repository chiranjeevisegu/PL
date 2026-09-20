import React, { useState, useMemo } from 'react';
import { Shield, Trash2, CheckCircle, Sparkles, Plus, AlertTriangle, Users, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import FPLTeamSync from '../FPL/FPLTeamSync';
import CaptainAdvisorCard from '../FPL/CaptainAdvisorCard';

const QUOTA = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
const POS_META = {
  GKP: { col: '#F59E0B', label: 'Goalkeeper' },
  DEF: { col: '#3B82F6', label: 'Defender' },
  MID: { col: '#10B981', label: 'Midfielder' },
  FWD: { col: '#F43F5E', label: 'Forward' },
};

export default function SquadBuilderView({ players }) {
  const [squad, setSquad] = useState([]);
  const [savedSquads, setSavedSquads] = useState([]);
  const [poolPos, setPoolPos] = useState('ALL');
  const [poolSearch, setPoolSearch] = useState('');
  const [squadName, setSquadName] = useState('My Dream XI');

  // Budget calculations
  const totalCost = useMemo(() => squad.reduce((sum, p) => sum + p.price, 0), [squad]);
  const remainingBudget = 100.0 - totalCost;

  // Position breakdown
  const posCounts = useMemo(() => {
    const counts = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
    squad.forEach(p => { if (counts[p.position] !== undefined) counts[p.position]++; });
    return counts;
  }, [squad]);

  // Suggested High-Rating Players
  const suggestedPlayers = useMemo(() => {
    return players
      .filter(p => !squad.some(sp => sp.id === p.id))
      .filter(p => poolPos === 'ALL' || p.position === poolPos)
      .filter(p => !poolSearch || p.name.toLowerCase().includes(poolSearch.toLowerCase()) || p.team_name.toLowerCase().includes(poolSearch.toLowerCase()))
      .sort((a, b) => (b.form * 10 + b.total_points) - (a.form * 10 + a.total_points))
      .slice(0, 40);
  }, [players, squad, poolPos, poolSearch]);

  const handleAddPlayer = (player) => {
    if (squad.length >= 15) {
      alert('Squad is full (15 players maximum).');
      return;
    }
    if (squad.some(p => p.id === player.id)) return;
    if (posCounts[player.position] >= QUOTA[player.position]) {
      alert(`You already have maximum ${QUOTA[player.position]} ${player.position} players.`);
      return;
    }
    if (player.price > remainingBudget) {
      alert(`Not enough budget remaining (Â£${remainingBudget.toFixed(1)}m available).`);
      return;
    }
    setSquad([...squad, player]);
  };

  const handleRemovePlayer = (id) => {
    setSquad(squad.filter(p => p.id !== id));
  };

  const handleClearSquad = () => {
    setSquad([]);
  };

  const handleFinalizeSquad = () => {
    if (squad.length < 11) {
      alert('Please select at least 11 players before finalizing.');
      return;
    }
    // Confetti effect
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    const newSaved = {
      id: Date.now(),
      name: squadName || `Squad #${savedSquads.length + 1}`,
      players: [...squad],
      totalPoints: squad.reduce((sum, p) => sum + p.total_points, 0),
      cost: totalCost,
      date: new Date().toLocaleDateString(),
    };
    setSavedSquads([newSaved, ...savedSquads]);
  };

  // Group squad by position for pitch view
  const gkpList = squad.filter(p => p.position === 'GKP');
  const defList = squad.filter(p => p.position === 'DEF');
  const midList = squad.filter(p => p.position === 'MID');
  const fwdList = squad.filter(p => p.position === 'FWD');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Shield size={16} /> Dynamic Tactics Board
          </div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
            Interactive Pitch & Squad Builder
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Select your 15-man squad within Â£100.0M budget. Pick high-rated suggested players from the right sidebar.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleClearSquad} disabled={squad.length === 0}>
            <Trash2 size={16} /> Reset Pitch
          </button>
          <button className="btn-primary" onClick={handleFinalizeSquad} disabled={squad.length < 11}>
            <CheckCircle size={16} /> Finalize & Save Squad
          </button>
        </div>
      </div>

      {/* FPL Sync + Captain Advisor Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <FPLTeamSync onTeamLoaded={(picks) => {
          // Load FPL team into squad
          const validPicks = picks.filter(pk => players.some(p => p.id === pk.id));
          const fullPicks = validPicks.map(pk => players.find(p => p.id === pk.id)).filter(Boolean);
          setSquad(fullPicks.slice(0, 15));
        }} />
        <CaptainAdvisorCard players={players} />
      </div>

      {/* Main Builder Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '24px' }}>
        
        {/* Left: Tactical Pitch & Squad Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Budget & Quota Bar */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REMAINING BUDGET</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: remainingBudget >= 0 ? 'var(--pl-neon-green)' : 'var(--pl-pink)' }}>
                Â£{remainingBudget.toFixed(1)}M <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100M</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {['GKP', 'DEF', 'MID', 'FWD'].map(pos => (
                <div key={pos} style={{ textAlign: 'center', padding: '4px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: POS_META[pos].col, fontWeight: 700 }}>{pos}</div>
                  <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {posCounts[pos]}/{QUOTA[pos]}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL SQUAD</div>
              <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {squad.length} / 15
              </div>
            </div>
          </div>

          {/* Tactical Pitch Canvas */}
          <div className="tactical-pitch" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div className="pitch-lines" />
            <div className="pitch-center-line" />
            <div className="pitch-center-circle" />
            <div className="pitch-penalty-top" />
            <div className="pitch-penalty-bottom" />

            {/* Goalkeepers Line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
              {gkpList.map(p => (
                <PitchCard key={p.id} player={p} onRemove={() => handleRemovePlayer(p.id)} />
              ))}
              {Array.from({ length: Math.max(0, QUOTA.GKP - gkpList.length) }).map((_, i) => (
                <EmptySlot key={`empty-gkp-${i}`} pos="GKP" />
              ))}
            </div>

            {/* Defenders Line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
              {defList.map(p => (
                <PitchCard key={p.id} player={p} onRemove={() => handleRemovePlayer(p.id)} />
              ))}
              {Array.from({ length: Math.max(0, QUOTA.DEF - defList.length) }).map((_, i) => (
                <EmptySlot key={`empty-def-${i}`} pos="DEF" />
              ))}
            </div>

            {/* Midfielders Line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
              {midList.map(p => (
                <PitchCard key={p.id} player={p} onRemove={() => handleRemovePlayer(p.id)} />
              ))}
              {Array.from({ length: Math.max(0, QUOTA.MID - midList.length) }).map((_, i) => (
                <EmptySlot key={`empty-mid-${i}`} pos="MID" />
              ))}
            </div>

            {/* Forwards Line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
              {fwdList.map(p => (
                <PitchCard key={p.id} player={p} onRemove={() => handleRemovePlayer(p.id)} />
              ))}
              {Array.from({ length: Math.max(0, QUOTA.FWD - fwdList.length) }).map((_, i) => (
                <EmptySlot key={`empty-fwd-${i}`} pos="FWD" />
              ))}
            </div>

          </div>

        </div>

        {/* Right: Suggested High-Rating Player Pool */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '620px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--pl-gold)" />
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                High-Rating Suggestions
              </h3>
            </div>
            <span className="badge-neon" style={{ fontSize: '0.7rem' }}>Live Suggestions</span>
          </div>

          {/* Pool Search & Pos Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text"
              placeholder="Filter suggested players..."
              value={poolSearch}
              onChange={(e) => setPoolSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'GKP', 'DEF', 'MID', 'FWD'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPoolPos(pos)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    borderRadius: '6px',
                    border: 'none',
                    background: poolPos === pos ? 'var(--pl-purple)' : '#f8fafc',
                    color: poolPos === pos ? 'var(--pl-neon-green)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {suggestedPlayers.map(p => (
              <div 
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: POS_META[p.position]?.col }}>{p.position}</span>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.name}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.team_short} â€¢ Form: <span style={{ color: '#0369a1' }}>{p.form}</span> â€¢ Pts: <span style={{ color: '#b45309' }}>{p.total_points}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>
                    Â£{p.price.toFixed(1)}m
                  </span>
                  <button
                    onClick={() => handleAddPlayer(p)}
                    style={{
                      background: 'rgba(0, 255, 135, 0.15)',
                      border: '1px solid rgba(0, 255, 135, 0.3)',
                      color: '#047857',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* â”€â”€ Saved Squads History Shelf â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {savedSquads.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Trophy size={20} color="var(--pl-gold)" />
            <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Your Finalized Squads Archive
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {savedSquads.map((s, idx) => (
              <div 
                key={s.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{s.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.date}</span>
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <span>Cost: <strong style={{ color: '#047857' }}>Â£{s.cost.toFixed(1)}M</strong></span>
                  <span>Total Pts: <strong style={{ color: '#b45309' }}>{s.totalPoints}</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {s.players.map(p => p.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// Pitch Player Card
function PitchCard({ player, onRemove }) {
  const col = POS_META[player.position]?.col || '#ffffff';
  return (
    <div 
      style={{
        background: 'rgba(14, 19, 31, 0.92)',
        border: `1px solid ${col}66`,
        borderRadius: '10px',
        padding: '6px 10px',
        minWidth: '85px',
        maxWidth: '110px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        cursor: 'pointer'
      }}
      onClick={onRemove}
      title="Click to remove player from pitch"
    >
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: col }}>{player.position}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {player.name}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>
        Â£{player.price.toFixed(1)}m
      </div>
    </div>
  );
}

function EmptySlot({ pos }) {
  return (
    <div style={{
      border: '1px dashed rgba(255, 255, 255, 0.25)',
      borderRadius: '10px',
      padding: '12px 10px',
      minWidth: '85px',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.3)',
      fontSize: '0.75rem',
      fontWeight: 600
    }}>
      + {pos}
    </div>
  );
}
