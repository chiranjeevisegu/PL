import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Search } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RADAR_LABELS = ['Goals', 'Assists', 'ICT Index', 'Form', 'xG', 'Clean Sheets', 'Points'];

function normalize(player) {
  return [
    Math.min(player.goals_scored / 20 * 10, 10),
    Math.min(player.assists / 15 * 10, 10),
    Math.min(player.ict_index / 80 * 10, 10),
    Math.min(player.form * 1.25, 10),
    Math.min((player.expected_goals || 0) / 15 * 10, 10),
    Math.min(player.clean_sheets / 15 * 10, 10),
    Math.min(player.total_points / 200 * 10, 10),
  ];
}

export default function CompareModal({ player1, players, onClose }) {
  const [search, setSearch] = useState('');
  const [player2, setPlayer2] = useState(null);

  const filtered = players
    .filter((p) => p.id !== player1.id)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team_name?.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  const data1 = normalize(player1);
  const data2 = player2 ? normalize(player2) : null;

  const radarData = {
    labels: RADAR_LABELS,
    datasets: [
      {
        label: player1.name,
        data: data1,
        backgroundColor: 'rgba(0, 255, 135, 0.15)',
        borderColor: '#00ff87',
        pointBackgroundColor: '#00ff87',
        pointBorderColor: '#fff',
        borderWidth: 2,
        pointRadius: 4,
      },
      ...(data2
        ? [{
            label: player2.name,
            data: data2,
            backgroundColor: 'rgba(4, 245, 255, 0.15)',
            borderColor: '#04f5ff',
            pointBackgroundColor: '#04f5ff',
            pointBorderColor: '#fff',
            borderWidth: 2,
            pointRadius: 4,
          }]
        : []),
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 10,
        backgroundColor: 'rgba(14,19,31,0.5)',
        grid: { color: 'rgba(255,255,255,0.08)' },
        angleLines: { color: 'rgba(255,255,255,0.08)' },
        ticks: { color: 'rgba(255,255,255,0.4)', backdropColor: 'transparent', stepSize: 2, font: { size: 10 } },
        pointLabels: { color: '#94a3b8', font: { size: 11, family: 'Space Grotesk' } },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#f8fafc', font: { size: 12, family: 'Space Grotesk', weight: '600' }, boxWidth: 14, padding: 16 },
      },
      tooltip: {
        backgroundColor: 'rgba(14,19,31,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
      },
    },
  };

  const StatRow = ({ label, v1, v2 }) => {
    const better1 = v1 > v2;
    const better2 = v2 > v1;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="font-mono" style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: better1 ? 'var(--pl-neon-green)' : 'var(--text-primary)' }}>{v1}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', minWidth: '90px' }}>{label}</div>
        <div className="font-mono" style={{ textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: better2 ? 'var(--pl-cyan)' : 'var(--text-primary)' }}>{v2 ?? 'â€”'}</div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-wide" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #38003c, #04f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '1.1rem' }}>Player Radar Compare</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Side-by-side stat comparison</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Player select chips */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff87' }} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#047857' }}>{player1.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player1.team_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>VS</div>
          {player2 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(4,245,255,0.1)', border: '1px solid rgba(4,245,255,0.3)', borderRadius: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#04f5ff' }} />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0369a1' }}>{player2.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player2.team_name}</span>
              <button onClick={() => setPlayer2(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0 0 0 4px' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>Select a player below...</div>
          )}
        </div>

        {/* Search to pick player 2 */}
        {!player2 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="auth-input"
                style={{ paddingLeft: '36px', fontSize: '0.875rem', padding: '9px 14px 9px 36px' }}
                placeholder="Search player to compare..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlayer2(p)}
                  style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-main)', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(4,245,255,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  {p.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({p.team_short})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Radar Chart */}
        <div style={{ maxHeight: '300px', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Stat table */}
        {player2 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 800, color: '#047857' }}>{player1.name}</div>
              <div style={{ minWidth: '90px' }} />
              <div style={{ textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#0369a1' }}>{player2.name}</div>
            </div>
            <StatRow label="Total Points" v1={player1.total_points} v2={player2.total_points} />
            <StatRow label="Goals" v1={player1.goals_scored} v2={player2.goals_scored} />
            <StatRow label="Assists" v1={player1.assists} v2={player2.assists} />
            <StatRow label="Form" v1={player1.form} v2={player2.form} />
            <StatRow label="ICT Index" v1={player1.ict_index?.toFixed(1)} v2={player2.ict_index?.toFixed(1)} />
            <StatRow label="xG" v1={player1.expected_goals?.toFixed(2)} v2={player2.expected_goals?.toFixed(2)} />
            <StatRow label="Clean Sheets" v1={player1.clean_sheets} v2={player2.clean_sheets} />
            <StatRow label="Price" v1={`Â£${player1.price?.toFixed(1)}m`} v2={`Â£${player2.price?.toFixed(1)}m`} />
            <StatRow label="Selected By" v1={`${player1.selected_by_percent}%`} v2={`${player2.selected_by_percent}%`} />
          </div>
        )}
      </div>
    </div>
  );
}
