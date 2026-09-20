import React, { useState } from 'react';
import { Trophy, Calendar, CheckCircle2, Flame, Award, Radio, Swords } from 'lucide-react';
import H2HModal from './H2HModal';

export default function PLLiveView({ plNews }) {
  const [h2hModal, setH2hModal] = useState(null); // { home, away, homeId, awayId }

  if (!plNews) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Live League Standings & Fixtures...
      </div>
    );
  }

  const { standings, recent, upcoming, top_scorers, top_assists, top_form, prev_gw_name, next_gw_name } = plNews;

  const openH2H = (fixture, isRecent) => {
    if (!fixture) return;
    setH2hModal({
      home: isRecent ? fixture.home_full || fixture.home : fixture.home_full || fixture.home,
      away: isRecent ? fixture.away_full || fixture.away : fixture.away_full || fixture.away,
      homeId: fixture.home_id,
      awayId: fixture.away_id,
    });
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
          <Radio size={16} /> Matchday Center
        </div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
          Premier League Live Table & Match Results
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Real-time computed standings, recent matchday scores, upcoming fixture difficulty, and Golden Boot leaders.
          <span style={{ color: '#0369a1', fontSize: '0.8rem', marginLeft: '8px' }}>Click any fixture to view H2H history â†’</span>
        </p>
      </div>

      {/* Top Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            <Trophy size={16} /> Top Goalscorers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top_scorers?.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{idx + 1}. {p.name} ({p.team})</span>
                <span className="font-mono" style={{ color: '#b45309', fontWeight: 700 }}>{p.val} Goals</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            <Award size={16} /> Top Assist Providers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top_assists?.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{idx + 1}. {p.name} ({p.team})</span>
                <span className="font-mono" style={{ color: '#0369a1', fontWeight: 700 }}>{p.val} Assists</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            <Flame size={16} /> Highest Form Rating
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top_form?.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{idx + 1}. {p.name} ({p.team})</span>
                <span className="font-mono" style={{ color: '#047857', fontWeight: 700 }}>{p.val} Form</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>
          Premier League Standings
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Pos</th>
                <th style={{ padding: '10px 14px' }}>Club</th>
                <th style={{ padding: '10px 14px' }}>Pl</th>
                <th style={{ padding: '10px 14px' }}>W</th>
                <th style={{ padding: '10px 14px' }}>D</th>
                <th style={{ padding: '10px 14px' }}>L</th>
                <th style={{ padding: '10px 14px' }}>GF</th>
                <th style={{ padding: '10px 14px' }}>GA</th>
                <th style={{ padding: '10px 14px' }}>GD</th>
                <th style={{ padding: '10px 14px' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings?.map((team, idx) => {
                const rank = idx + 1;
                let rankColor = 'var(--text-muted)';
                if (rank <= 4) rankColor = '#00ff87'; // UCL
                else if (rank === 5) rankColor = '#04f5ff'; // UEL
                else if (rank >= 18) rankColor = '#e90052'; // Relegation

                return (
                  <tr 
                    key={team.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: rankColor }}>
                      {rank}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {team.name}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{team.played}</td>
                    <td style={{ padding: '10px 14px' }}>{team.won}</td>
                    <td style={{ padding: '10px 14px' }}>{team.drawn}</td>
                    <td style={{ padding: '10px 14px' }}>{team.lost}</td>
                    <td style={{ padding: '10px 14px' }}>{team.gf}</td>
                    <td style={{ padding: '10px 14px' }}>{team.ga}</td>
                    <td style={{ padding: '10px 14px', color: team.gd > 0 ? 'var(--pl-neon-green)' : (team.gd < 0 ? 'var(--pl-pink)' : 'inherit') }}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#b45309' }}>
                      {team.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Results & Upcoming Fixtures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Recent Results */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle2 size={18} color="var(--pl-neon-green)" />
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Recent Results ({prev_gw_name})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent?.map((m, idx) => (
              <div 
                key={idx}
                onClick={() => openH2H(m, true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,135,0.2)';
                  e.currentTarget.style.background = 'rgba(0,255,135,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.25)';
                }}
              >
                <div style={{ fontWeight: 600, flex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>{m.home}</div>
                <div className="font-mono" style={{ padding: '4px 12px', background: 'var(--pl-purple)', borderRadius: '6px', fontWeight: 800, color: '#00ff87', margin: '0 12px' }}>
                  {m.home_score} - {m.away_score}
                </div>
                <div style={{ fontWeight: 600, flex: 1, textAlign: 'left', color: 'var(--text-primary)' }}>{m.away}</div>
                <Swords size={13} color="var(--text-muted)" style={{ marginLeft: '8px', flexShrink: 0 }} />
              </div>
            ))}
            {(!recent || recent.length === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '0.85rem' }}>
                No recent results available
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Fixtures */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={18} color="var(--pl-cyan)" />
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Upcoming Fixtures ({next_gw_name})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcoming?.map((f, idx) => (
              <div 
                key={idx}
                onClick={() => openH2H(f, false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(4,245,255,0.2)';
                  e.currentTarget.style.background = 'rgba(4,245,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.25)';
                }}
              >
                <div style={{ fontWeight: 600, flex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>{f.home}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 10px', gap: '2px' }}>
                  <div style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>VS</div>
                  {f.h_diff && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: f.h_diff <= 2 ? 'rgba(0,255,135,0.15)' : f.h_diff >= 4 ? 'rgba(233,0,82,0.15)' : 'rgba(226,183,20,0.15)', color: f.h_diff <= 2 ? 'var(--pl-neon-green)' : f.h_diff >= 4 ? 'var(--pl-pink)' : 'var(--pl-gold)' }}>
                        FDR {f.h_diff}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 600, flex: 1, textAlign: 'left', color: 'var(--text-primary)' }}>{f.away}</div>
                <Swords size={13} color="var(--text-muted)" style={{ marginLeft: '8px', flexShrink: 0 }} />
              </div>
            ))}
            {(!upcoming || upcoming.length === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '0.85rem' }}>
                No upcoming fixtures available
              </div>
            )}
          </div>
        </div>

      </div>

      {/* H2H Modal */}
      {h2hModal && (
        <H2HModal
          home={h2hModal.home}
          away={h2hModal.away}
          homeId={h2hModal.homeId}
          awayId={h2hModal.awayId}
          onClose={() => setH2hModal(null)}
        />
      )}
    </div>
  );
}
