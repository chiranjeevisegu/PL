'use strict';

// ── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE  = 25;
const REFRESH_MS = 10 * 60 * 1000; // 10 min auto-refresh

const POS_META = {
  GKP: { col: '#F59E0B', emoji: '🧤', slots: 2  },
  DEF: { col: '#3B82F6', emoji: '🛡️', slots: 5 },
  MID: { col: '#10B981', emoji: '⚡', slots: 5   },
  FWD: { col: '#F43F5E', emoji: '🎯', slots: 3   },
};
const POS_ORDER = { GKP: 0, DEF: 1, MID: 2, FWD: 3 };
const SQUAD_QUOTA = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };

// ── Global State ─────────────────────────────────────────────────────────────
let allPlayers = [];
let filteredPlayers = [];
let currentPage = 1;
let sortCol = 'total_points', sortAsc = false;
let charts = {};

let filters = {
  positions: new Set(['GKP', 'DEF', 'MID', 'FWD']),
  teams: new Set(),
  priceMin: 0, priceMax: 999,
  minsMin: 0, search: '', availOnly: false,
};

// Squad Builder state
let pitchState = {}; // { GKP: [null,null], DEF: [null,null,null,null,null], ... }
let finalizedSquads = [];
let draggedPlayer = null;
let poolPosFilter = 'ALL';
let poolSearchStr = '';

// ── Entry Point ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPitch();
  loadAll();
  setupEventListeners();
  // Auto-refresh every 10 minutes (handles "open after 2 days" case)
  setInterval(silentRefresh, REFRESH_MS);
});

// ── Data Loading ──────────────────────────────────────────────────────────────
async function loadAll() {
  showOverlay(true);
  try {
    const [ov, players] = await Promise.all([
      apiFetch('/api/overview'),
      apiFetch('/api/players'),
    ]);
    allPlayers = players;
    renderOverview(ov);
    buildTeamFilter();
    initPriceSliders();
    applyFilters();
    setUpdateTime();
  } catch (err) {
    showToast('Could not load FPL data: ' + err.message);
  } finally {
    showOverlay(false);
  }
}

async function silentRefresh() {
  try {
    const [ov, players] = await Promise.all([
      apiFetch('/api/overview'),
      apiFetch('/api/players'),
    ]);
    allPlayers = players;
    renderOverview(ov);
    applyFilters();
    setUpdateTime();
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    if (activeTab === 'plnews') await loadPLNews();
    if (activeTab === 'squad') renderPool();
  } catch {}
}

async function apiFetch(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

// ── Overview ──────────────────────────────────────────────────────────────────
function renderOverview(ov) {
  document.getElementById('gw-pill').textContent = ov.gw_name || 'Gameweek';
  document.getElementById('h-total').textContent =
    ov.total_players ? (ov.total_players / 1e6).toFixed(2) + 'm' : '—';
  document.getElementById('h-avg').textContent  = ov.avg_score     || '—';
  document.getElementById('h-high').textContent = ov.highest_score || '—';
  if (ov.next_deadline) {
    const d = new Date(ov.next_deadline);
    document.getElementById('h-deadline').textContent = fmtDate(d);
    document.getElementById('h-deadline-lbl').textContent =
      (ov.next_gw_name || 'Next GW') + ' Deadline';
  }
}

function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function setUpdateTime() {
  const now = new Date();
  document.getElementById('update-time').textContent =
    'Updated ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Team Filter ───────────────────────────────────────────────────────────────
function buildTeamFilter() {
  const teams = [...new Set(allPlayers.map(p => p.team_name))].sort();
  const list  = document.getElementById('team-list');
  list.innerHTML = teams.map(t => `
    <label class="team-item">
      <input type="checkbox" class="team-cb" value="${esc(t)}" checked />
      <span>${esc(t)}</span>
    </label>`).join('');
  filters.teams = new Set();
  list.querySelectorAll('.team-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = [...list.querySelectorAll('.team-cb:checked')].map(c => c.value);
      filters.teams = checked.length === teams.length ? new Set() : new Set(checked);
      applyFilters();
    });
  });
}

// ── Price Sliders ─────────────────────────────────────────────────────────────
function initPriceSliders() {
  const prices = allPlayers.map(p => p.price);
  const lo = Math.floor(Math.min(...prices) * 10);
  const hi = Math.ceil(Math.max(...prices)  * 10);
  const pMin = document.getElementById('price-min');
  const pMax = document.getElementById('price-max');
  pMin.min = lo; pMin.max = hi; pMin.value = lo;
  pMax.min = lo; pMax.max = hi; pMax.value = hi;
  filters.priceMin = lo / 10; filters.priceMax = hi / 10;
  setPriceLabels(lo, hi);
}

function setPriceLabels(lo, hi) {
  document.getElementById('price-min-lbl').textContent = '£' + (lo / 10).toFixed(1) + 'm';
  document.getElementById('price-max-lbl').textContent = '£' + (hi / 10).toFixed(1) + 'm';
}

// ── Apply Filters ─────────────────────────────────────────────────────────────
function applyFilters() {
  filteredPlayers = allPlayers.filter(p => {
    if (!filters.positions.has(p.position)) return false;
    if (filters.teams.size && !filters.teams.has(p.team_name)) return false;
    if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
    if (p.minutes < filters.minsMin) return false;
    if (filters.availOnly && p.status !== 'a') return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) &&
          !p.first_name.toLowerCase().includes(q) &&
          !p.last_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  filteredPlayers.sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return sortAsc ? -1 :  1;
    if (av > bv) return sortAsc ?  1 : -1;
    return 0;
  });

  currentPage = 1;
  renderTable();
  renderPagination();

  // Rebuild charts if that tab is active
  const active = document.querySelector('.tab.active')?.dataset.tab;
  if (active === 'charts') buildCharts();
}

// ── Player Table ──────────────────────────────────────────────────────────────
function renderTable() {
  const start  = (currentPage - 1) * PAGE_SIZE;
  const slice  = filteredPlayers.slice(start, start + PAGE_SIZE);
  const maxPts = filteredPlayers.length ? Math.max(...filteredPlayers.map(p => p.total_points)) : 1;
  const maxVal = filteredPlayers.length ? Math.max(...filteredPlayers.map(p => p.value_score))  : 1;

  document.getElementById('table-info').textContent =
    filteredPlayers.length.toLocaleString() + ' players';

  const tbody = document.getElementById('player-tbody');
  tbody.innerHTML = slice.map((p, i) => {
    const rank = start + i + 1;
    const news = p.news ? `<span class="news-dot" title="${esc(p.news)}"></span>` : '';
    const chg  = p.cost_change_event > 0 ? `<sup class="price-up">▲</sup>`
               : p.cost_change_event < 0 ? `<sup class="price-down">▼</sup>` : '';
    return `<tr>
      <td class="rank-cell">${rank}</td>
      <td><span class="player-name-cell">${esc(p.name)}</span>${news}</td>
      <td style="color:var(--muted)">${esc(p.team_short)}</td>
      <td class="tc"><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td class="tr">£${p.price.toFixed(1)}${chg}</td>
      <td class="tr ${p.total_points === maxPts ? 'top-val' : ''}">${p.total_points}</td>
      <td class="tr ${p.value_score  === maxVal ? 'top-val' : ''}">${p.value_score.toFixed(2)}</td>
      <td class="tr">${p.form.toFixed(1)}</td>
      <td class="tr">${p.selected_by_percent.toFixed(1)}%</td>
      <td class="tr">${p.goals_scored}</td>
      <td class="tr">${p.assists}</td>
      <td class="tr">${p.minutes}</td>
      <td class="tr">${p.expected_goal_involvements.toFixed(2)}</td>
      <td class="tr">${p.ict_index.toFixed(1)}</td>
    </tr>`;
  }).join('');
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPagination() {
  const total = Math.ceil(filteredPlayers.length / PAGE_SIZE);
  const pg    = document.getElementById('pagination');
  if (total <= 1) { pg.innerHTML = ''; return; }

  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - currentPage) <= 2) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  pg.innerHTML = [
    `<button class="pg-btn" id="pg-prev" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`,
    ...pages.map(p => p === '…'
      ? `<button class="pg-btn" disabled>…</button>`
      : `<button class="pg-btn ${p === currentPage ? 'active' : ''}" data-p="${p}">${p}</button>`
    ),
    `<button class="pg-btn" id="pg-next" ${currentPage === total ? 'disabled' : ''}>›</button>`,
  ].join('');

  pg.addEventListener('click', e => {
    const btn = e.target.closest('.pg-btn');
    if (!btn || btn.disabled) return;
    if (btn.id === 'pg-prev') currentPage--;
    else if (btn.id === 'pg-next') currentPage++;
    else if (btn.dataset.p) currentPage = parseInt(btn.dataset.p);
    renderTable(); renderPagination();
  });
}

// ── Charts ────────────────────────────────────────────────────────────────────
const CHART_CFG = {
  gridColor: 'rgba(255,255,255,0.05)',
  tickColor: '#64748B',
  tooltipBg: '#13161E',
  font: { family: 'Inter', size: 11 },
};

function buildCharts() {
  Object.values(charts).forEach(c => c?.destroy());
  charts = {};
  const src = filteredPlayers.length ? filteredPlayers : allPlayers;
  buildScatter(src);
  buildBar('chart-form',  src,                                  'form',          'Form',         10);
  buildBar('chart-value', src.filter(p => p.minutes > 180),     'value_score',   'Value Score',  10);
  buildBar('chart-pts',   src,                                  'total_points',  'Points',       10);
  buildBar('chart-xgi',   src,                                  'expected_goal_involvements', 'xGI', 10);
  buildDoughnut('chart-pos', src);
}

function buildScatter(src) {
  const ctx = document.getElementById('chart-scatter')?.getContext('2d');
  if (!ctx) return;
  const ds = Object.entries(POS_META).map(([pos, meta]) => ({
    label: pos,
    data: src.filter(p => p.position === pos).map(p => ({
      x: p.price, y: p.total_points, name: p.name, team: p.team_short,
    })),
    backgroundColor: meta.col + '26',
    borderColor: meta.col,
    borderWidth: 1.5,
    pointRadius: 5,
    pointHoverRadius: 8,
  }));
  charts.scatter = new Chart(ctx, {
    type: 'scatter', data: { datasets: ds },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: CHART_CFG.tickColor, font: CHART_CFG.font } },
        tooltip: {
          backgroundColor: CHART_CFG.tooltipBg,
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
          titleColor: '#F1F5F9', bodyColor: '#94A3B8', padding: 10,
          callbacks: { label: c => `${c.raw.name} (${c.raw.team}) — £${c.raw.x.toFixed(1)}m · ${c.raw.y} pts` },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Price (£m)', color: CHART_CFG.tickColor },
             ticks: { color: CHART_CFG.tickColor, callback: v => '£' + v.toFixed(1) },
             grid: { color: CHART_CFG.gridColor }, border: { color: 'transparent' } },
        y: { title: { display: true, text: 'Total Points', color: CHART_CFG.tickColor },
             ticks: { color: CHART_CFG.tickColor },
             grid: { color: CHART_CFG.gridColor }, border: { color: 'transparent' } },
      },
    },
  });
}

function buildBar(id, src, col, label, topN) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  const top = [...src].sort((a, b) => b[col] - a[col]).slice(0, topN);
  charts[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(p => p.name),
      datasets: [{
        label,
        data: top.map(p => parseFloat((p[col] || 0).toFixed(2))),
        backgroundColor: top.map(p => POS_META[p.position]?.col + '26' || '#BEFF0026'),
        borderColor:     top.map(p => POS_META[p.position]?.col || '#BEFF00'),
        borderWidth: 1.5,
        borderRadius: 5,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: CHART_CFG.tooltipBg,
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
          titleColor: '#F1F5F9', bodyColor: '#94A3B8', padding: 10,
        },
      },
      scales: {
        x: { ticks: { color: CHART_CFG.tickColor, font: CHART_CFG.font }, grid: { color: CHART_CFG.gridColor }, border: { color: 'transparent' } },
        y: { ticks: { color: '#E2E8F0', font: { ...CHART_CFG.font, weight: '600' } }, grid: { display: false }, border: { color: 'transparent' } },
      },
    },
  });
}

function buildDoughnut(id, src) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  const positions = ['GKP', 'DEF', 'MID', 'FWD'];
  charts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: positions,
      datasets: [{
        data: positions.map(pos => src.filter(p => p.position === pos).reduce((s, p) => s + p.total_points, 0)),
        backgroundColor: positions.map(pos => POS_META[pos].col + '26'),
        borderColor:     positions.map(pos => POS_META[pos].col),
        borderWidth: 2, hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { color: CHART_CFG.tickColor, font: CHART_CFG.font, padding: 16 } },
        tooltip: { backgroundColor: CHART_CFG.tooltipBg, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#F1F5F9', bodyColor: '#94A3B8', padding: 10 },
      },
    },
  });
}

// ── PL Live ───────────────────────────────────────────────────────────────────
async function loadPLNews() {
  try {
    const data = await apiFetch('/api/plnews');
    renderStandings(data.standings);
    renderMatches('recent-results',   data.recent,   data.prev_gw_name, true);
    renderMatches('upcoming-fixtures', data.upcoming, data.next_gw_name, false);
    renderTopStat('top-scorers-list', data.top_scorers);
    renderTopStat('top-assists-list', data.top_assists);
    renderTopStat('top-form-list',    data.top_form);
    document.getElementById('recent-gw-title').textContent   = data.prev_gw_name + ' Results';
    document.getElementById('upcoming-gw-title').textContent = data.next_gw_name + ' Fixtures';
  } catch (e) {
    showToast('PL News error: ' + e.message);
  }
}

function renderStandings(rows) {
  const tbody = document.getElementById('standings-tbody');
  tbody.innerHTML = rows.map((t, i) => {
    const pos = i + 1;
    const cls = pos <= 4 ? 'zone-ucl' : pos === 5 ? 'zone-uel' : pos >= 18 ? 'zone-rel' : '';
    const gd  = t.gd > 0 ? `+${t.gd}` : t.gd.toString();
    return `<tr class="${cls}">
      <td class="standings-pos">${pos}</td>
      <td class="standings-team">${esc(t.name)}</td>
      <td class="tr">${t.played}</td>
      <td class="tr">${t.won}</td>
      <td class="tr">${t.drawn}</td>
      <td class="tr">${t.lost}</td>
      <td class="tr">${t.gf}</td>
      <td class="tr">${t.ga}</td>
      <td class="tr ${t.gd > 0 ? 'pos-gd' : t.gd < 0 ? 'neg-gd' : ''}">${gd}</td>
      <td class="tr standings-pts-col">${t.points}</td>
    </tr>`;
  }).join('');
}

function renderMatches(containerId, matches, gwName, isResult) {
  const el = document.getElementById(containerId);
  if (!matches.length) { el.innerHTML = `<div class="loading-placeholder">No ${isResult ? 'results' : 'fixtures'} available</div>`; return; }
  el.innerHTML = matches.map(m => {
    if (isResult) {
      return `<div class="match-card">
        <div class="match-team home">
          <div class="match-abbr">${esc(m.home)}</div>
          <div class="match-fullname">${esc(m.home_full)}</div>
        </div>
        <div class="match-score">
          <span class="score-num">${m.home_score}</span>
          <span class="score-sep">—</span>
          <span class="score-num">${m.away_score}</span>
        </div>
        <div class="match-team away">
          <div class="match-abbr">${esc(m.away)}</div>
          <div class="match-fullname">${esc(m.away_full)}</div>
        </div>
      </div>`;
    } else {
      const ko   = m.kickoff ? fmtDate(new Date(m.kickoff)) : 'TBC';
      const hDif = `<span class="diff-badge diff-${m.h_diff}">${m.h_diff}</span>`;
      const aDif = `<span class="diff-badge diff-${m.a_diff}">${m.a_diff}</span>`;
      return `<div class="match-card">
        <div class="match-team home">
          <div class="match-abbr">${esc(m.home)} ${hDif}</div>
          <div class="match-fullname">${esc(m.home_full)}</div>
        </div>
        <div class="match-score">
          <span class="score-num" style="color:var(--muted);font-size:.7rem">vs</span>
        </div>
        <div class="match-team away">
          <div class="match-abbr">${aDif} ${esc(m.away)}</div>
          <div class="match-fullname">${esc(m.away_full)}</div>
        </div>
        <span class="match-kickoff">${ko}</span>
      </div>`;
    }
  }).join('');
}

function renderTopStat(id, list) {
  const el = document.getElementById(id);
  el.innerHTML = list.map((s, i) => `
    <li>
      <span class="stat-rank">${i + 1}</span>
      <span class="stat-name">${esc(s.name)}</span>
      <span class="stat-team">${esc(s.team)}</span>
      <span class="stat-val">${typeof s.val === 'number' ? s.val.toFixed(s.val % 1 === 0 ? 0 : 1) : s.val}</span>
    </li>`).join('');
}

// ── Squad Builder — Pitch ─────────────────────────────────────────────────────
function initPitch() {
  pitchState = {
    GKP: Array(2).fill(null),
    DEF: Array(5).fill(null),
    MID: Array(5).fill(null),
    FWD: Array(3).fill(null),
  };
  buildPitchHTML();
}

function buildPitchHTML() {
  for (const [pos, meta] of Object.entries(POS_META)) {
    const row = document.getElementById(`row-${pos}`);
    if (!row) continue;
    row.innerHTML = Array.from({ length: meta.slots }, (_, i) => `
      <div class="drop-slot" data-pos="${pos}" data-idx="${i}">
        <span class="slot-empty-icon">${meta.emoji}</span>
        <span class="slot-empty-label">${pos}</span>
      </div>`).join('');
  }
  setupDropZones();
}

function setupDropZones() {
  document.querySelectorAll('.drop-slot').forEach(slot => {
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      if (!draggedPlayer) return;
      if (slot.dataset.pos !== draggedPlayer.position) { e.dataTransfer.dropEffect = 'none'; return; }
      if (slot.classList.contains('filled')) return;
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (!draggedPlayer) return;
      const { pos, idx } = slot.dataset;
      if (pos !== draggedPlayer.position) {
        showToast(`${draggedPlayer.name} plays ${draggedPlayer.position} — drop on a ${draggedPlayer.position} slot`);
        return;
      }
      if (slot.classList.contains('filled')) { showToast('Slot already filled. Remove the player first.'); return; }
      // Check club limit (max 3)
      const onPitch = getSquadPlayers();
      const clubCount = onPitch.filter(p => p.team_name === draggedPlayer.team_name).length;
      if (clubCount >= 3) { showToast(`Max 3 players per club (${draggedPlayer.team_name})`); return; }
      placePlayer(draggedPlayer, slot, parseInt(idx));
    });
  });
}

function placePlayer(player, slot, idx) {
  const pos  = slot.dataset.pos;
  pitchState[pos][idx] = player;
  const meta = POS_META[pos];
  slot.classList.add('filled');
  slot.innerHTML = `
    <div class="slot-player">
      <button class="slot-remove" data-pos="${pos}" data-idx="${idx}">✕</button>
      <div class="slot-pos-strip" style="background:${meta.col}"></div>
      <div class="slot-emoji">${meta.emoji}</div>
      <div class="slot-name">${esc(player.name)}</div>
      <div class="slot-team">${esc(player.team_short)}</div>
      <div class="slot-pts">${player.total_points}pts</div>
    </div>`;
  slot.querySelector('.slot-remove').addEventListener('click', () => removePlayer(pos, idx, slot));
  updatePitchFooter();
  renderPool();
}

function removePlayer(pos, idx, slot) {
  pitchState[pos][idx] = null;
  slot.classList.remove('filled');
  const meta = POS_META[pos];
  slot.innerHTML = `<span class="slot-empty-icon">${meta.emoji}</span><span class="slot-empty-label">${pos}</span>`;
  updatePitchFooter();
  renderPool();
}

function getSquadPlayers() {
  return Object.values(pitchState).flat().filter(Boolean);
}

function updatePitchFooter() {
  const placed = getSquadPlayers();
  const cost   = placed.reduce((s, p) => s + p.price, 0);
  document.getElementById('squad-filled').textContent = `${placed.length} / 15 selected`;
  document.getElementById('squad-cost').textContent   = `£${cost.toFixed(1)}m spent`;
  document.getElementById('btn-finalize-squad').disabled = placed.length < 15;
}

function clearPitch() {
  initPitch();
  updatePitchFooter();
  renderPool();
}

function finalizeSquad() {
  const placed = getSquadPlayers();
  if (placed.length < 15) { showToast('Place all 15 players first!'); return; }
  const budget = parseFloat(document.getElementById('budget-slider').value);
  const cost   = placed.reduce((s, p) => s + p.price, 0);
  if (cost > budget) { showToast(`Squad costs £${cost.toFixed(1)}m — over your £${budget.toFixed(1)}m budget!`); return; }
  const pts    = placed.reduce((s, p) => s + p.total_points, 0);
  const avgFrm = (placed.reduce((s, p) => s + p.form, 0) / 15).toFixed(1);
  finalizedSquads.unshift({ num: finalizedSquads.length + 1, players: [...placed], cost, pts, avgFrm });
  renderFinalizedSquads();
  clearPitch();
  document.getElementById('finalized-squads').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`✅ Squad ${finalizedSquads[0].num} saved! £${cost.toFixed(1)}m · ${pts} pts`);
}

function renderFinalizedSquads() {
  const el = document.getElementById('finalized-squads');
  el.innerHTML = finalizedSquads.map(sq => `
    <div class="finalized-squad">
      <div class="finalized-squad-header">
        <h3>Squad ${sq.num}</h3>
        <div class="finalized-stats">
          <span>💰 £${sq.cost.toFixed(1)}m</span>
          <span>⭐ ${sq.pts} pts</span>
          <span>🔥 ${sq.avgFrm} avg form</span>
        </div>
      </div>
      <div class="finalized-players">
        ${['GKP','DEF','MID','FWD'].flatMap(pos =>
          sq.players.filter(p => p.position === pos).map(p => `
            <div class="finalized-player-chip">
              <span class="pos-badge pos-${pos}">${pos}</span>
              <span style="font-weight:600">${esc(p.name)}</span>
              <span style="color:var(--muted);font-size:.65rem">${esc(p.team_short)}</span>
              <span style="color:var(--lime);font-weight:700;margin-left:auto">£${p.price.toFixed(1)}</span>
            </div>`)
        ).join('')}
      </div>
    </div>`).join('');
}

// ── Pool Rendering ────────────────────────────────────────────────────────────
function renderPool() {
  const budget   = parseFloat(document.getElementById('budget-slider')?.value || 100);
  const availOnly = document.getElementById('squad-avail')?.checked;
  const onPitch   = getSquadPlayers().map(p => p.id);
  const metric    = document.getElementById('pool-sort-metric')?.value || 'total_points';

  const pool = allPlayers
    .filter(p => {
      if (availOnly && p.status !== 'a') return false;
      if (poolPosFilter !== 'ALL' && p.position !== poolPosFilter) return false;
      if (poolSearchStr) {
        const q = poolSearchStr.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.last_name.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, 100);

  document.getElementById('pool-count').textContent = pool.length + ' shown';

  const list = document.getElementById('pool-list');
  list.innerHTML = pool.map(p => {
    const meta    = POS_META[p.position] || {};
    const placed  = onPitch.includes(p.id);
    return `<div class="pool-card ${placed ? 'on-pitch' : ''}"
                 draggable="${!placed}"
                 data-id="${p.id}"
                 data-pos="${p.position}"
                 style="--pos-col:${meta.col}">
      <div class="pool-card-info">
        <div class="pool-card-name">${esc(p.name)}</div>
        <div class="pool-card-team">${esc(p.team_short)} · ${p.position}</div>
      </div>
      <div class="pool-card-stats">
        <div class="pool-stat-row">
          <div class="pool-stat"><span>Pts</span><strong>${p.total_points}</strong></div>
          <div class="pool-stat"><span>£</span><strong>${p.price.toFixed(1)}</strong></div>
          <div class="pool-stat"><span>Frm</span><strong>${p.form.toFixed(1)}</strong></div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Attach drag listeners
  list.querySelectorAll('.pool-card:not(.on-pitch)').forEach(card => {
    card.addEventListener('dragstart', e => {
      draggedPlayer = allPlayers.find(p => p.id === parseInt(card.dataset.id));
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
      // Highlight valid slots
      document.querySelectorAll(`.drop-slot[data-pos="${draggedPlayer.position}"]:not(.filled)`)
        .forEach(s => s.classList.add('can-drop'));
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedPlayer = null;
      document.querySelectorAll('.drop-slot').forEach(s => s.classList.remove('can-drop', 'drag-over'));
    });
  });
}

// ── CSV Download ──────────────────────────────────────────────────────────────
function downloadCSV() {
  const cols = ['name','team_name','position','price','total_points','value_score','form',
                'selected_by_percent','goals_scored','assists','minutes',
                'expected_goal_involvements','ict_index','status'];
  const hdrs = ['Player','Team','Pos','Price','Points','Value','Form',
                'Owned%','Goals','Assists','Mins','xGI','ICT','Status'];
  const csv = [hdrs, ...filteredPlayers.map(p =>
    cols.map(c => { const v = p[c]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; })
  )].map(r => r.join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: 'fpl_players.csv' }).click();
  URL.revokeObjectURL(url);
}

// ── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      // Lazy load on first visit
      const t = tab.dataset.tab;
      if (t === 'charts') buildCharts();
      if (t === 'plnews') loadPLNews();
      if (t === 'squad')  renderPool();
    });
  });

  // Position chips
  document.querySelectorAll('.pos-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      filters.positions = new Set([...document.querySelectorAll('.pos-chip.active')].map(c => c.dataset.pos));
      applyFilters();
    });
  });

  // Price sliders
  const pMin = document.getElementById('price-min');
  const pMax = document.getElementById('price-max');
  function syncPrice() {
    let lo = parseInt(pMin.value), hi = parseInt(pMax.value);
    if (lo > hi) { [lo, hi] = [hi, lo]; pMin.value = lo; pMax.value = hi; }
    filters.priceMin = lo / 10; filters.priceMax = hi / 10;
    setPriceLabels(lo, hi);
    applyFilters();
  }
  pMin.addEventListener('input', syncPrice);
  pMax.addEventListener('input', syncPrice);

  // Minutes
  document.getElementById('mins-slider').addEventListener('input', e => {
    filters.minsMin = parseInt(e.target.value);
    document.getElementById('mins-val').textContent = e.target.value;
    applyFilters();
  });

  // Player search (debounced)
  let st;
  document.getElementById('player-search').addEventListener('input', e => {
    clearTimeout(st);
    st = setTimeout(() => { filters.search = e.target.value.trim(); applyFilters(); }, 250);
  });

  // Team search
  document.getElementById('team-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.team-item').forEach(i => {
      i.style.display = i.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Available toggle
  document.getElementById('avail-toggle').addEventListener('change', e => {
    filters.availOnly = e.target.checked; applyFilters();
  });

  // Sort select
  document.getElementById('sort-select').addEventListener('change', e => {
    sortCol = e.target.value; sortAsc = false; applyFilters();
  });

  // Table header sort
  document.querySelector('#player-table thead').addEventListener('click', e => {
    const th = e.target.closest('.th-sort');
    if (!th) return;
    const col = th.dataset.col;
    if (col === sortCol) sortAsc = !sortAsc; else { sortCol = col; sortAsc = false; }
    document.querySelectorAll('.th-sort').forEach(h => h.classList.remove('active-col'));
    th.classList.add('active-col');
    applyFilters();
  });

  // CSV
  document.getElementById('btn-download').addEventListener('click', downloadCSV);

  // Refresh
  document.getElementById('btn-refresh').addEventListener('click', () => loadAll());

  // Reset filters
  document.getElementById('btn-reset').addEventListener('click', () => {
    document.querySelectorAll('.pos-chip').forEach(c => c.classList.add('active'));
    filters.positions = new Set(['GKP','DEF','MID','FWD']);
    document.querySelectorAll('.team-cb').forEach(cb => cb.checked = true);
    filters.teams = new Set();
    const prices = allPlayers.map(p => p.price);
    const lo = Math.floor(Math.min(...prices) * 10), hi = Math.ceil(Math.max(...prices) * 10);
    document.getElementById('price-min').value = lo;
    document.getElementById('price-max').value = hi;
    filters.priceMin = lo / 10; filters.priceMax = hi / 10;
    setPriceLabels(lo, hi);
    document.getElementById('mins-slider').value = 0;
    document.getElementById('mins-val').textContent = '0';
    filters.minsMin = 0;
    document.getElementById('player-search').value = '';
    document.getElementById('team-search').value   = '';
    document.querySelectorAll('.team-item').forEach(i => i.style.display = '');
    filters.search = '';
    document.getElementById('avail-toggle').checked = false;
    filters.availOnly = false;
    applyFilters();
  });

  // Budget slider
  document.getElementById('budget-slider').addEventListener('input', e => {
    document.getElementById('budget-display').textContent = '£' + parseFloat(e.target.value).toFixed(1) + 'm';
  });

  // Pool controls
  document.getElementById('pool-sort-metric').addEventListener('change', renderPool);
  document.getElementById('squad-avail').addEventListener('change', renderPool);

  let pt;
  document.getElementById('pool-search').addEventListener('input', e => {
    clearTimeout(pt);
    pt = setTimeout(() => { poolSearchStr = e.target.value.trim(); renderPool(); }, 200);
  });

  document.querySelectorAll('.pool-pos-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pool-pos-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      poolPosFilter = btn.dataset.pos;
      renderPool();
    });
  });

  // Pitch clear & finalize
  document.getElementById('btn-clear-pitch').addEventListener('click', clearPitch);
  document.getElementById('btn-finalize-squad').addEventListener('click', finalizeSquad);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function showOverlay(v) {
  document.getElementById('overlay').classList.toggle('hidden', !v);
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
