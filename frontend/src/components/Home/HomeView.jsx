import React from 'react';
import { 
  Trophy, Flame, TrendingUp, AlertCircle, ArrowUpRight, 
  Sparkles, Award, History, ArrowRight, ShieldCheck, Activity, Users, Zap
} from 'lucide-react';

export default function HomeView({ homeData, overview, setActiveTab, onSelectPlayer }) {
  if (!homeData) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '12px' }}>⚽</div>
        Loading Premier League Live Radar...
      </div>
    );
  }

  const { history, editorial_news, transfers, injuries, momentum_in, momentum_out } = homeData;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* ── 1. Hero Section ────────────────────────────────────────────────── */}
      <div className="glass-card" style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '40px',
        background: 'var(--pl-purple)',
        color: '#ffffff',
        border: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(0, 255, 135, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '840px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span className="badge-neon">
              <Sparkles size={14} /> PREMIER LEAGUE INTELLIGENCE
            </span>
            <span className="badge-cyan">
              {overview?.gw_name || 'SEASON 2024/25'}
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '16px',
            color: '#ffffff'
          }}>
            The Drama, The Legends, <br />
            <span style={{ color: 'var(--pl-neon-green)' }}>
              The Live Data Ecosystem.
            </span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginBottom: '28px', lineHeight: 1.6 }}>
            Explore 30+ years of historic Premier League milestones, track verified marquee transfers, monitor live player fitness radar, and engineer your ultimate winning squad.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <button 
              className="btn-primary"
              style={{ background: 'var(--pl-neon-green)', color: '#07090e' }}
              onClick={() => setActiveTab('squad')}
            >
              <ShieldCheck size={18} />
              <span>Launch Pitch Squad Builder</span>
              <ArrowRight size={16} />
            </button>
            <button 
              className="btn-secondary"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => setActiveTab('players')}
            >
              <Users size={18} />
              <span>Explore 600+ Live Players</span>
            </button>
            <button 
              className="btn-secondary"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => setActiveTab('pllive')}
            >
              <Trophy size={18} />
              <span>Live Standings & Fixtures</span>
            </button>
          </div>
        </div>

        {/* Metric Quick Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '36px',
          paddingTop: '28px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Gameweek
            </div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--pl-neon-green)' }}>
              {overview?.gw_name || 'GW In Progress'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gameweek Average
            </div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--pl-cyan)' }}>
              {overview?.avg_score || 0} pts
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Highest GW Score
            </div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--pl-gold)' }}>
              {overview?.highest_score || 0} pts
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Active Managers
            </div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              {overview?.total_players ? (overview.total_players / 1000000).toFixed(1) + 'M+' : '10.5M+'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Premier League History & Heritage Hub ───────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <History size={16} /> Heritage & Archive
            </div>
            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              Premier League History & Legendary Eras
            </h2>
          </div>
          <span className="badge-gold">1992 - Present</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '900px', marginBottom: '24px', lineHeight: 1.6 }}>
          {history?.intro}
        </p>

        {/* Milestone Cards Carousel / Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}>
          {history?.milestones?.map((m, idx) => (
            <div 
              key={idx} 
              className="glass-card glass-card-interactive"
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge-neon font-mono" style={{ fontSize: '0.8rem' }}>{m.year}</span>
                  <Award size={18} color="#b45309" />
                </div>
                <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* All-Time Hall of Fame Records */}
        <div className="glass-card" style={{ padding: '28px', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Trophy size={20} color="#b45309" />
            <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              All-Time Premier League Records & Hall of Fame
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {history?.hall_of_fame_records?.map((rec, i) => (
              <div 
                key={i}
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {rec.record}
                </div>
                <div className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b45309' }}>
                  {rec.stat}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {rec.holder}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {rec.club}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Editorial & Breaking League News ───────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Flame size={16} /> Hot Editorial & Analysis
            </div>
            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              Breaking News & Tactical Intelligence
            </h2>
          </div>
          <span className="badge-neon">Live Feed</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {editorial_news?.map((news) => (
            <article 
              key={news.id} 
              className="glass-card glass-card-interactive"
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{
                    backgroundColor: `${news.tag_color}18`,
                    color: news.tag_color,
                    border: `1px solid ${news.tag_color}44`,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase'
                  }}>
                    {news.tag}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{news.read_time}</span>
                </div>

                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  {news.title}
                </h3>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '16px' }}>
                  {news.summary}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <span>{news.author}</span>
                <span>{news.time}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── 4. Recent Transfers Radar ────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <TrendingUp size={16} /> Market Moves
            </div>
            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              Recent Marquee Transfers & Signings
            </h2>
          </div>
          <span className="badge-cyan">Market Radar</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {transfers?.map((tr, idx) => (
            <div 
              key={idx}
              className="glass-card"
              style={{
                padding: '18px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge-cyan" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {tr.type}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: tr.impact === 'Very High' ? '#047857' : '#b45309'
                }}>
                  {tr.impact} Impact
                </span>
              </div>

              <div className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {tr.player}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {tr.role}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {tr.from_team} <span style={{ color: '#047857' }}>→</span> <strong style={{ color: 'var(--text-primary)' }}>{tr.to_team}</strong>
                </div>
                <div className="font-mono" style={{ fontWeight: 700, color: '#0369a1' }}>
                  {tr.fee}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Live Player Availability & Injury Radar ────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <AlertCircle size={16} /> Live Medical Hub
            </div>
            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              Player Availability, Injuries & Market Momentum
            </h2>
          </div>
          <span className="badge-pink">Live FPL Data</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Left: Live Injury List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={18} color="#be123c" />
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Live Player Injury & Suspensions
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {injuries?.slice(0, 10).map((p) => (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#fff1f2',
                    border: '1px solid #ffe4e6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({p.team_short} • {p.position})</span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: p.status === 'Injured' ? '#fecdd3' : '#fef3c7',
                      color: p.status === 'Injured' ? '#be123c' : '#b45309'
                    }}>
                      {p.status} ({p.chance})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {p.news}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Transfer Momentum Trends */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={18} color="#047857" />
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Gameweek Transfer Momentum (In vs Out)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Most In */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} /> Most Bought In
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {momentum_in?.slice(0, 5).map((p) => (
                    <div 
                      key={p.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: '#ecfdf5',
                        border: '1px solid #d1fae5',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        <span>£{p.price.toFixed(1)}m</span>
                        <span style={{ color: '#047857', fontWeight: 600 }}>+{p.count.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Out */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#be123c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> Most Sold Out
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {momentum_out?.slice(0, 5).map((p) => (
                    <div 
                      key={p.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: '#fff1f2',
                        border: '1px solid #ffe4e6',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        <span>£{p.price.toFixed(1)}m</span>
                        <span style={{ color: '#be123c', fontWeight: 600 }}>-{p.count.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
