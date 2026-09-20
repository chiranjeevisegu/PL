import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

// ── Static PL Knowledge Base ─────────────────────────────────────────────────
const STATIC_KB = [
  { keys: ['top scorer', 'golden boot', 'most goals all time', 'alan shearer'], ans: '🥅 Alan Shearer holds the all-time PL record with 260 goals (Blackburn + Newcastle). Single-season record: Erling Haaland with 36 goals (Man City, 2022-23).' },
  { keys: ['most assists', 'assist record', 'de bruyne assist', 'henry assist'], ans: '🎯 Kevin De Bruyne & Thierry Henry both hold the single-season assist record with 20 each. De Bruyne (2019-20), Henry (2002-03).' },
  { keys: ['most titles', 'most trophies', 'most championships'], ans: '🏆 Manchester United hold the most PL titles with 13, all under Sir Alex Ferguson. Man City have won 4 consecutive titles (2021-2024).' },
  { keys: ['founded', 'when started', 'history of pl', '1992'], ans: '📅 The Premier League was founded on 20 Feb 1992 and began the 1992-93 season. Brian Deane scored the first ever PL goal for Sheffield United vs Manchester United.' },
  { keys: ['most clean sheets', 'goalkeeper record', 'petr cech'], ans: '🧤 Petr Čech holds the all-time clean sheet record with 202 clean sheets (Chelsea + Arsenal).' },
  { keys: ['leicester', '5000', 'miracle', 'fairy tale', 'greatest upset'], ans: '⚡ Leicester City won the 2015-16 title at 5000-1 odds under Claudio Ranieri. Vardy, Mahrez & Kanté led the charge. They were pre-season relegation favourites!' },
  { keys: ['arsenal invincible', 'unbeaten season', 'invincibles', '2003-04'], ans: '🛡️ Arsenal\'s 2003-04 Invincibles: 38 games undefeated (26W 12D 0L). Thierry Henry scored 30 goals. The only unbeaten PL season ever.' },
  { keys: ['aguero', 'agueroooo', '93:20', 'last minute title'], ans: '💥 Sergio Agüero scored at 93:20 on the final day 2011-12 vs QPR to win Man City the title on goal difference over Manchester United. The most dramatic moment in PL history.' },
  { keys: ['manchester city', 'man city', 'pep guardiola', 'city records'], ans: '🔵 Under Pep Guardiola, Man City set records: 100 points (2017-18), 36 goals in a season (Haaland 2022-23), and 4 consecutive titles (2021-2024).' },
  { keys: ['liverpool', 'klopp', 'reds', 'anfield'], ans: '🔴 Liverpool ended a 30-year title drought in 2019-20 under Klopp with 99 points. Champions League winners in 2019.' },
  { keys: ['manchester united', 'man utd', 'sir alex', 'fergie', 'old trafford'], ans: '⚫🔴 Man United dominated the PL with 13 titles under Sir Alex Ferguson (1993-2013). Ferguson retired in 2013 and they haven\'t won it since.' },
  { keys: ['arsenal', 'gunners', 'emirates', 'arteta'], ans: '🔴⚪ Arsenal are the only club to complete an unbeaten season (2003-04). Under Arteta they finished 2nd in 2022-23 and 2023-24.' },
  { keys: ['chelsea', 'blues', 'stamford bridge'], ans: '🔵 Chelsea have 5 PL titles. Back-to-back under Mourinho (2005, 2006), Ancelotti (2010), Conte (2017).' },
  { keys: ['tottenham', 'spurs', 'harry kane', 'son'], ans: '⚪ Tottenham have never won the PL. Harry Kane left for Bayern Munich as their all-time top scorer. Spurs reached the UCL final in 2019.' },
  { keys: ['relegation', 'relegated', 'bottom 3', 'drop zone'], ans: '⬇️ The bottom 3 clubs are relegated to the Championship each season (places 18, 19, 20). 3 clubs are promoted from the Championship.' },
  { keys: ['champions league', 'ucl', 'top 4', 'europe'], ans: '🌍 Top 4 clubs qualify for the Champions League. 5th = Europa League. Conference League for 6th. Bottom 3 are relegated.' },
  { keys: ['var', 'video assistant', 'technology'], ans: '📺 VAR (Video Assistant Referee) was introduced to the PL in 2019-20. It reviews goals, penalties, red cards, and mistaken identity.' },
  { keys: ['fpl tips', 'fantasy tips', 'fpl advice'], ans: '⚽ Top FPL tips: Captain form players (6.0+ form) with easy fixtures. Save chips for Double Gameweeks. Never take too many hits. Check FDR before every transfer.' },
  { keys: ['captain pick', 'who to captain', 'best captain'], ans: '🎖️ Check the Captain Advisor card on the Pitch Builder tab for data-driven picks based on Form, ICT, Fixtures & Ownership. Scroll down to see it!' },
  { keys: ['wildcard', 'free hit', 'bench boost', 'triple captain', 'chips'], ans: '🃏 FPL Chips: Wildcard (unlimited transfers, twice), Free Hit (1-week unlimited reset), Bench Boost (all 15 bench players score), Triple Captain (3× captain points).' },
  { keys: ['double gameweek', 'dgw', 'blank gameweek', 'bgw'], ans: '📅 DGW = team plays twice — great for FPL! BGW = team has no fixture. Use Bench Boost + Triple Captain on big DGWs for maximum points.' },
  { keys: ['price rise', 'price fall', 'price change', 'fpl price'], ans: '💰 FPL prices change based on net transfers. Heavy transfers-in = price rises. Sell before a drop to protect team value.' },
  { keys: ['ict index', 'ict rating', 'influence creativity threat'], ans: '📈 ICT Index = Influence (match impact) + Creativity (chance creation) + Threat (goal scoring). ICT 80+ = premium asset worth owning.' },
  { keys: ['fixture difficulty', 'fdr', 'easy fixtures'], ans: '📊 FDR rates fixtures 1 (easiest) to 5 (hardest). Target players with upcoming runs of 1s and 2s for captaincy and transfers.' },
  { keys: ['how many clubs', 'how many teams', '20 clubs'], ans: '⚽ The PL has 20 clubs, each playing 38 games (home & away vs every other club). 3 relegated, 3 promoted from Championship each season.' },
  { keys: ['fastest goal', 'quickest goal', 'shane long'], ans: '⚡ Fastest PL goal: Shane Long (Southampton vs Watford, 2019) — just 7.69 seconds after kickoff!' },
  { keys: ['hat trick', 'hat-trick', 'haaland hat'], ans: '🎩 Haaland holds the PL single-season hat-trick record (5 in 2022-23). Alan Shearer holds the all-time hat-trick record with 11.' },
  { keys: ['youngest player', 'youngest scorer'], ans: '👶 Youngest PL player: Harvey Elliott (Fulham, 16y 30d in 2019). Youngest scorer: James Vaughan (Everton, 16y 270d in 2005).' },
  { keys: ['broadcast', 'tv rights', 'sky sports', 'watch pl'], ans: '📡 PL rights in UK: Sky Sports (128 games), TNT Sports (52), Amazon Prime (20), BBC (highlights). Global rights worth £10.5B per cycle.' },
  { keys: ['most expensive', 'record transfer', 'biggest signing', 'grealish'], ans: '💰 Biggest PL signing: Jack Grealish (£100M to Man City, 2021). Haaland cost just £51.2M. World record: Neymar to PSG (£198M).' },
  { keys: ['records pl', 'all records', 'pl records'], ans: '📋 PL Records: Goals — Shearer (260) | Appearances — Barry (653) | Clean Sheets — Čech (202) | Titles — Man Utd (13) | Points in season — Man City (100) | Goals in season — Haaland (36).' },
  { keys: ['premier league 2024', '2024-25', 'current season'], ans: '📆 The 2024-25 Premier League season features 20 clubs including promoted Ipswich Town, Southampton, and Leicester City. Check the PL Live tab for live standings!' },
  { keys: ['hi', 'hello', 'hey', 'good morning', 'good evening'], ans: '👋 Hey! I\'m your PL Intelligence Bot. Ask me about standings, top scorers, FPL tips, clubs, history, or any Premier League topic!' },
  { keys: ['thank', 'cheers', 'great', 'perfect', 'thanks'], ans: '⚽ You\'re welcome! Good luck this gameweek! 🏆 Feel free to ask anything else about the Premier League.' },
  { keys: ['help', 'what can you do', 'what do you know'], ans: '🤖 I can answer about: live standings & top scorers (from our live data!), PL history & records, club profiles, FPL tips, chips, transfers, rules, and much more. Just ask!' },
];

// ── Live Data Queries (matched against live players + standings) ──────────────
function getLiveAnswer(msg, liveData) {
  const { players, standings, topScorers, topAssists, topForm, overview } = liveData;

  // Table / standings queries
  if (/top team|leading|first place|who.*lead|league leader|best team in table|number one|1st place|top of/i.test(msg)) {
    if (standings && standings.length > 0) {
      const t = standings[0];
      return `🏆 **Current PL Leaders**: **${t.name}** top the table with **${t.points} pts** from ${t.played} games (${t.won}W ${t.drawn}D ${t.lost}L, GD ${t.gd > 0 ? '+' : ''}${t.gd}). Check the PL Live tab for the full table!`;
    }
  }

  // Bottom of table
  if (/bottom|relegation zone|18th|19th|20th|last place|who.*relegat/i.test(msg)) {
    if (standings && standings.length >= 18) {
      const bottom3 = standings.slice(-3).reverse();
      return `⬇️ **Relegation Zone** (bottom 3): ${bottom3.map((t, i) => `${standings.length - i}. ${t.name} (${t.points} pts)`).join(' | ')}. All three face the drop if the season ended today.`;
    }
  }

  // Top scorers from live data
  if (/top scorer|most goals|golden boot|leading scorer|who.*scoring most/i.test(msg)) {
    if (topScorers && topScorers.length > 0) {
      const list = topScorers.slice(0, 5).map((p, i) => `${i + 1}. **${p.name}** (${p.team}) — ${p.val} goals`).join('\n');
      return `🥅 **Current Top Scorers** (live data):\n${list}\n\nFor the all-time record, Alan Shearer holds it with 260 PL goals.`;
    }
  }

  // Top assists live
  if (/top assist|most assist|assist leader|who.*most assist/i.test(msg)) {
    if (topAssists && topAssists.length > 0) {
      const list = topAssists.slice(0, 5).map((p, i) => `${i + 1}. **${p.name}** (${p.team}) — ${p.val} assists`).join('\n');
      return `🎯 **Current Assist Leaders** (live data):\n${list}`;
    }
  }

  // Form leaders
  if (/best form|highest form|form leader|who.*in form|top form|hottest player/i.test(msg)) {
    if (topForm && topForm.length > 0) {
      const list = topForm.slice(0, 5).map((p, i) => `${i + 1}. **${p.name}** (${p.team}) — form ${p.val}`).join('\n');
      return `🔥 **Best Form Players** (live data):\n${list}\n\nThese are great captain and transfer targets right now!`;
    }
  }

  // Current gameweek
  if (/current gameweek|which gameweek|what gw|gw\d|gameweek \d/i.test(msg)) {
    if (overview) {
      return `📅 We're currently in **${overview.gw_name}**. Average score: **${overview.avg_score} pts**, Highest score: **${overview.highest_score} pts**. Total FPL managers: **${overview.total_players?.toLocaleString()}**.`;
    }
  }

  // Specific player search
  const playerNameMatch = msg.match(/how is ([a-z\s]+?) doing|stats? (?:for|of) ([a-z\s]+)|([a-z\s]+?) stats?|tell me about ([a-z\s]+)/i);
  if (playerNameMatch && players && players.length > 0) {
    const query = (playerNameMatch[1] || playerNameMatch[2] || playerNameMatch[3] || playerNameMatch[4] || '').trim().toLowerCase();
    if (query.length > 2) {
      const found = players.find(p =>
        p.name.toLowerCase().includes(query) ||
        (p.first_name + ' ' + p.last_name).toLowerCase().includes(query)
      );
      if (found) {
        return `⚽ **${found.name}** (${found.team_name} · ${found.position}):\n🎯 Points: ${found.total_points} | Form: ${found.form} | Price: £${found.price?.toFixed(1)}m\n⚡ Goals: ${found.goals_scored} | Assists: ${found.assists} | ICT: ${found.ict_index?.toFixed(1)}\n📊 Owned by ${found.selected_by_percent}% of FPL managers${found.news ? `\n⚠️ ${found.news}` : ''}`;
      }
    }
  }

  // General "who is best" player
  if (/best player|top player|best fpl asset|most points/i.test(msg)) {
    if (players && players.length > 0) {
      const best = [...players].sort((a, b) => b.total_points - a.total_points).slice(0, 3);
      const list = best.map((p, i) => `${i + 1}. ${p.name} (${p.team_name}) — ${p.total_points} pts, £${p.price?.toFixed(1)}m`).join('\n');
      return `🌟 **Top Scoring FPL Players** right now:\n${list}\n\nCheck the Players tab for full explorer with filters!`;
    }
  }

  // Haaland specifically
  if (/haaland/i.test(msg) && players) {
    const h = players.find(p => p.name.toLowerCase().includes('haaland'));
    if (h) return `⚽ **Erling Haaland** (Man City · FWD): ${h.total_points} pts | Form: ${h.form} | Goals: ${h.goals_scored} | Price: £${h.price?.toFixed(1)}m | Owned: ${h.selected_by_percent}% | ICT: ${h.ict_index?.toFixed(1)}`;
  }

  // Budget/expensive player
  if (/cheapest|budget player|under £5|4\.5|4\.0|bargain/i.test(msg)) {
    if (players) {
      const cheap = players.filter(p => p.price <= 5.0 && p.total_points > 20).sort((a, b) => b.total_points - a.total_points).slice(0, 3);
      if (cheap.length > 0) {
        const list = cheap.map(p => `${p.name} (${p.team_short}) £${p.price?.toFixed(1)}m — ${p.total_points} pts`).join('\n');
        return `💸 **Best Budget Picks (≤£5.0m)**:\n${list}\n\nUse the Players tab with the price filter to find more bargains!`;
      }
    }
  }

  // Deadline
  if (/deadline|transfer deadline|when.*deadline|next deadline/i.test(msg)) {
    if (overview && overview.next_deadline) {
      const d = new Date(overview.next_deadline);
      return `⏰ **${overview.next_gw_name} Deadline**: ${d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })} at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Make your transfers before then! The countdown is shown in the bar at the top of the page.`;
    }
  }

  return null; // No live match found
}

// ── Static fallback ───────────────────────────────────────────────────────────
function getStaticAnswer(msg) {
  const lower = msg.toLowerCase();
  for (const entry of STATIC_KB) {
    if (entry.keys.some((k) => lower.includes(k))) return entry.ans;
  }
  return null;
}

// ── Main answer function ──────────────────────────────────────────────────────
function getAnswer(msg, liveData) {
  const live = getLiveAnswer(msg, liveData);
  if (live) return live;
  const stat = getStaticAnswer(msg);
  if (stat) return stat;
  return "🤔 I'm not sure about that yet. Try asking about standings, top scorers, specific players, PL history, FPL tips, or club profiles! You can also browse the Players or PL Live tabs for full data.";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChatbotWidget({ user, players, plNews, overview }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `👋 Hi${user ? ` ${user.username}` : ''}! I'm your PL Intelligence Bot — trained on live standings, player stats & PL history. Ask me anything!`,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  // Build live data context from props
  const liveData = {
    players: players || [],
    standings: plNews?.standings || [],
    topScorers: plNews?.top_scorers || [],
    topAssists: plNews?.top_assists || [],
    topForm: plNews?.top_form || [],
    overview: overview || null,
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (overrideMsg) => {
    const msg = (overrideMsg !== undefined ? overrideMsg : input).trim();
    if (!msg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setTyping(true);
    // Small delay to feel natural
    const delay = 500 + Math.random() * 600;
    setTimeout(() => {
      const reply = getAnswer(msg, liveData);
      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
      setTyping(false);
    }, delay);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const QUICK = [
    'Who leads the table?',
    'Top scorer this season?',
    'Best form players?',
    'FPL captain tips',
    'Haaland stats',
    'Cheapest budget picks',
  ];

  const hasLiveData = liveData.standings.length > 0 || liveData.players.length > 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="chatbot-fab"
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        title="PL Intelligence Chatbot"
      >
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(56,0,60,0.45)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #38003c, #00ff87)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>PL Intelligence Bot</div>
              <div style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--pl-neon-green)' }}>● Online</span>
                {hasLiveData && <span style={{ color: 'var(--text-muted)' }}>· Live data loaded</span>}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'bot' ? 'chatbot-msg-bot' : 'chatbot-msg-user'}>
                {/* Render bold markdown-style **text** */}
                {m.text.split('\n').map((line, li) => (
                  <div key={li} style={{ lineHeight: 1.55 }}>
                    {line.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                      pi % 2 === 1 ? <strong key={pi} style={{ color: m.role === 'bot' ? 'var(--pl-neon-green)' : 'inherit' }}>{part}</strong> : part
                    )}
                  </div>
                ))}
              </div>
            ))}
            {typing && (
              <div className="chatbot-msg-bot" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '12px 14px' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick reply chips */}
          <div style={{ padding: '8px 14px 4px', display: 'flex', flexWrap: 'wrap', gap: '5px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {QUICK.map((q) => (
              <button
                key={q}
                style={{
                  background: 'rgba(56,0,60,0.5)', border: '1px solid rgba(0,255,135,0.2)',
                  borderRadius: '7px', padding: '3px 9px', color: 'var(--pl-neon-green)',
                  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-main)', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,255,135,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56,0,60,0.5)'}
                onClick={() => send(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="chatbot-input-row">
            <input
              id="chatbot-input"
              className="chatbot-input"
              placeholder="Ask about standings, players, FPL..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              autoComplete="off"
            />
            <button
              id="chatbot-send-btn"
              onClick={() => send()}
              style={{
                background: 'linear-gradient(135deg, #38003c, #00ff87)', border: 'none',
                borderRadius: '10px', padding: '9px 13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: '#fff', flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
