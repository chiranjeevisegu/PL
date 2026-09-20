import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, Shield, Zap, Sparkles, X } from 'lucide-react';
import CompareModal from './CompareModal';

const POS_META = {
  GKP: { col: '#F59E0B', label: 'Goalkeeper' },
  DEF: { col: '#3B82F6', label: 'Defender' },
  MID: { col: '#10B981', label: 'Midfielder' },
  FWD: { col: '#F43F5E', label: 'Forward' },
};

export default function PlayersView({ players }) {
  const [search, setSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(16);
  const [sortBy, setSortBy] = useState('total_points');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [comparePlayer, setComparePlayer] = useState(null);

  // Extract unique teams
  const teams = useMemo(() => {
    const set = new Set(players.map(p => p.team_name).filter(Boolean));
    return Array.from(set).sort();
  }, [players]);

  // Filter and Sort
  const filtered = useMemo(() => {
    return players.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.first_name.toLowerCase().includes(search.toLowerCase()) && !p.last_name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedPos !== 'ALL' && p.position !== selectedPos) return false;
      if (selectedTeam !== 'ALL' && p.team_name !== selectedTeam) return false;
      if (p.price > maxPrice) return false;
      return true;
    }).sort((a, b) => {
      const vA = a[sortBy] ?? 0;
      const vB = b[sortBy] ?? 0;
      return sortAsc ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });
  }, [players, search, selectedPos, selectedTeam, maxPrice, sortBy, sortAsc]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Zap size={16} /> Live Player Intelligence
          </div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
            Premier League Player Explorer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Displaying {filtered.length} of {players.length} live players with instant stats, form, ICT rating, and market values.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'grid' ? 'var(--pl-purple)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--pl-neon-green)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Card Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'table' ? 'var(--pl-purple)' : 'transparent',
              color: viewMode === 'table' ? 'var(--pl-neon-green)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Data Table
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Position Selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'GKP', 'DEF', 'MID', 'FWD'].map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPos(pos)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedPos === pos ? 'var(--pl-neon-green)' : 'var(--border-subtle)',
                  background: selectedPos === pos ? 'rgba(0, 255, 135, 0.15)' : '#f1f5f9',
                  color: selectedPos === pos ? 'var(--pl-neon-green)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Team Dropdown */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: '#0e131f',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-main)',
                fontSize: '0.875rem'
              }}
            >
              <option value="ALL">All 20 Premier League Teams</option>
              {teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: '#0e131f',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-main)',
                fontSize: '0.875rem'
              }}
            >
              <option value="total_points">Total Points</option>
              <option value="form">Form (Last Matches)</option>
              <option value="price">Price (Â£M)</option>
              <option value="value_score">Value (Pts / Â£M)</option>
              <option value="selected_by_percent">Ownership %</option>
              <option value="goals_scored">Goals Scored</option>
              <option value="assists">Assists</option>
              <option value="clean_sheets">Clean Sheets</option>
              <option value="ict_index">ICT Index</option>
              <option value="expected_goal_involvements">xGI (Expected Goal Inv.)</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              title="Toggle Sort Direction"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: '#f8fafc',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>

        </div>

        {/* Max Price Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Max Price: <strong style={{ color: '#047857' }}>Â£{maxPrice.toFixed(1)}m</strong></span>
          <input 
            type="range"
            min="4"
            max="16"
            step="0.5"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
            style={{ flex: 1, accentcolor: '#047857' }}
          />
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {filtered.slice(0, 60).map((player) => {
            const posCol = POS_META[player.position]?.col || '#ffffff';
            return (
              <div
                key={player.id}
                className="glass-card glass-card-interactive"
                onClick={() => setSelectedPlayer(player)}
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: `${posCol}22`,
                      color: posCol,
                      border: `1px solid ${posCol}55`,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {player.position}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}>
                      Â£{player.price.toFixed(1)}m
                    </span>
                  </div>

                  <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {player.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {player.team_name}
                  </div>

                  {/* Player Key Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>POINTS</div>
                      <div className="font-mono" style={{ fontWeight: 800, color: '#b45309' }}>{player.total_points}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>FORM</div>
                      <div className="font-mono" style={{ fontWeight: 800, color: '#0369a1' }}>{player.form}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>OWNED</div>
                      <div className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{player.selected_by_percent}%</div>
                    </div>
                  </div>
                </div>

                {player.news && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '0.7rem',
                    color: '#be123c',
                    backgroundColor: 'rgba(233, 0, 82, 0.08)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    âš ï¸ {player.news}
                  </div>
                )}
                {/* Compare button */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                  <button
                    className="compare-chip"
                    onClick={(e) => { e.stopPropagation(); setComparePlayer(player); }}
                    title="Compare with another player"
                  >
                    <Zap size={11} /> Compare
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Player</th>
                <th style={{ padding: '12px 16px' }}>Pos</th>
                <th style={{ padding: '12px 16px' }}>Team</th>
                <th style={{ padding: '12px 16px' }}>Price</th>
                <th style={{ padding: '12px 16px' }}>Points</th>
                <th style={{ padding: '12px 16px' }}>Form</th>
                <th style={{ padding: '12px 16px' }}>Goals</th>
                <th style={{ padding: '12px 16px' }}>Assists</th>
                <th style={{ padding: '12px 16px' }}>Clean Sheets</th>
                <th style={{ padding: '12px 16px' }}>xGI</th>
                <th style={{ padding: '12px 16px' }}>Selected %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(p => (
                <tr 
                  key={p.id}
                  onClick={() => setSelectedPlayer(p)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                  <td style={{ padding: '12px 16px', color: POS_META[p.position]?.col || '#fff', fontWeight: 600 }}>{p.position}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.team_name}</td>
                  <td style={{ padding: '12px 16px', color: '#047857', fontWeight: 600 }}>Â£{p.price.toFixed(1)}m</td>
                  <td style={{ padding: '12px 16px', color: '#b45309', fontWeight: 700 }}>{p.total_points}</td>
                  <td style={{ padding: '12px 16px', color: '#0369a1' }}>{p.form}</td>
                  <td style={{ padding: '12px 16px' }}>{p.goals_scored}</td>
                  <td style={{ padding: '12px 16px' }}>{p.assists}</td>
                  <td style={{ padding: '12px 16px' }}>{p.clean_sheets}</td>
                  <td style={{ padding: '12px 16px' }}>{p.expected_goal_involvements}</td>
                  <td style={{ padding: '12px 16px' }}>{p.selected_by_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setSelectedPlayer(null)}>
          <div 
            className="glass-card animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              background: '#0e131f',
              border: '1px solid rgba(0, 255, 135, 0.3)',
              borderRadius: '20px',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setSelectedPlayer(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#f8fafc',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge-neon">{selectedPlayer.position}</span>
              <span className="badge-cyan">{selectedPlayer.team_name}</span>
            </div>

            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedPlayer.first_name} {selectedPlayer.last_name}
            </h2>
            <div style={{ fontSize: '1rem', color: '#047857', fontWeight: 700, marginBottom: '20px' }}>
              Â£{selectedPlayer.price.toFixed(1)}M â€¢ {selectedPlayer.total_points} Points
            </div>

            {/* Stat Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FORM</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0369a1' }}>{selectedPlayer.form}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GOALS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPlayer.goals_scored}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ASSISTS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPlayer.assists}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>xG (EXP GOALS)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b45309' }}>{selectedPlayer.expected_goals}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>xA (EXP ASSISTS)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b45309' }}>{selectedPlayer.expected_assists}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ICT INDEX</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#047857' }}>{selectedPlayer.ict_index}</div>
              </div>
            </div>

            {selectedPlayer.news && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#ffe4e6',
                border: '1px solid rgba(233, 0, 82, 0.25)',
                color: '#be123c',
                fontSize: '0.85rem'
              }}>
                <strong>Physio Status:</strong> {selectedPlayer.news}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player Radar Compare Modal */}
      {comparePlayer && (
        <CompareModal
          player1={comparePlayer}
          players={players}
          onClose={() => setComparePlayer(null)}
        />
      )}

    </div>
  );
}
