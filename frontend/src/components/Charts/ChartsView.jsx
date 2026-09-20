import React, { useMemo } from 'react';
import { Bar, Scatter, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart3, Info, TrendingUp, HelpCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartsView({ players }) {
  // Chart 1: Top 12 Scorers (Points)
  const topPointsData = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.total_points - a.total_points).slice(0, 12);
    return {
      labels: sorted.map(p => p.name),
      datasets: [
        {
          label: 'Total FPL Points',
          data: sorted.map(p => p.total_points),
          backgroundColor: '#00ff87',
          borderRadius: 8,
        }
      ]
    };
  }, [players]);

  // Chart 2: Price vs Total Points Matrix
  const priceVsPointsData = useMemo(() => {
    const sample = players.filter(p => p.total_points > 20);
    return {
      datasets: [
        {
          label: 'Players Value Matrix',
          data: sample.map(p => ({ x: p.price, y: p.total_points })),
          backgroundColor: '#04f5ff',
          borderColor: 'rgba(4, 245, 255, 0.4)',
          pointRadius: 6,
          pointHoverRadius: 9,
        }
      ]
    };
  }, [players]);

  // Chart 3: Goals vs Expected Goals (xG)
  const goalsVsXgData = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.goals_scored - a.goals_scored).slice(0, 10);
    return {
      labels: sorted.map(p => p.name),
      datasets: [
        {
          label: 'Actual Goals Scored',
          data: sorted.map(p => p.goals_scored),
          backgroundColor: '#00ff87',
          borderRadius: 6,
        },
        {
          label: 'Expected Goals (xG)',
          data: sorted.map(p => p.expected_goals),
          backgroundColor: '#e90052',
          borderRadius: 6,
        }
      ]
    };
  }, [players]);

  // Chart 4: Top Assists & xA Creators
  const creatorsData = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.assists - a.assists).slice(0, 10);
    return {
      labels: sorted.map(p => p.name),
      datasets: [
        {
          label: 'Assists',
          data: sorted.map(p => p.assists),
          backgroundColor: '#ffd700',
          borderRadius: 6,
        },
        {
          label: 'Expected Assists (xA)',
          data: sorted.map(p => p.expected_assists),
          backgroundColor: '#04f5ff',
          borderRadius: 6,
        }
      ]
    };
  }, [players]);

  // Chart 5: Ownership % vs Total Points
  const ownershipVsPointsData = useMemo(() => {
    const sample = players.filter(p => p.selected_by_percent > 3);
    return {
      datasets: [
        {
          label: 'Ownership % vs Points',
          data: sample.map(p => ({ x: p.selected_by_percent, y: p.total_points })),
          backgroundColor: '#e2b714',
          pointRadius: 6,
        }
      ]
    };
  }, [players]);

  // Chart 6: Position Distribution of Points
  const positionDistData = useMemo(() => {
    const sums = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
    players.forEach(p => {
      if (sums[p.position] !== undefined) sums[p.position] += p.total_points;
    });
    return {
      labels: ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards'],
      datasets: [
        {
          data: [sums.GKP, sums.DEF, sums.MID, sums.FWD],
          backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#F43F5E'],
          borderWidth: 0,
        }
      ]
    };
  }, [players]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
      tooltip: {
        backgroundColor: '#0e131f',
        titleColor: '#00ff87',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  const scatterOptions = (xLabel, yLabel) => ({
    ...chartOptions,
    scales: {
      x: {
        title: { display: true, text: xLabel, color: '#94a3b8' },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        title: { display: true, text: yLabel, color: '#94a3b8' },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pl-neon-green)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
          <BarChart3 size={16} /> Advanced Statistical Analytics
        </div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
          Premier League Visual Analytics & Detailed Explanations
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Every chart is accompanied by an in-depth explanation breaking down metric mechanics, statistical benchmarks, and tactical manager actions.
        </p>
      </div>

      {/* Grid of Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        
        {/* Chart 1 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            1. Top 12 Overall Points Scorers
          </h3>
          <div style={{ height: '280px' }}>
            <Bar data={topPointsData} options={chartOptions} />
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pl-neon-green)', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={16} /> What & How to Interpret This:
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Metric:</strong> Total accumulated Fantasy Premier League points across all gameweeks including goals, clean sheets, assists, and bonus points (BPS).<br />
              <strong>Tactical Insight:</strong> Players at the top of this chart represent the premier "captaincy anchors" for your squad who consistently deliver baseline returns regardless of fixture difficulty.
            </p>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            2. Price (£M) vs Total Points Value Matrix
          </h3>
          <div style={{ height: '280px' }}>
            <Scatter data={priceVsPointsData} options={scatterOptions('Price (£M)', 'Total Points')} />
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pl-cyan)', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={16} /> What & How to Interpret This:
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Metric:</strong> Scatter mapping of player acquisition cost against overall point productivity.<br />
              <strong>Tactical Insight:</strong> The top-left quadrant highlights the highest "value-for-money" gems (budget enablers providing premium-level point returns for under £6.5m). Points in the lower right indicate overpriced underperformers.
            </p>
          </div>
        </div>

        {/* Chart 3 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            3. Goals Scored vs Expected Goals (xG)
          </h3>
          <div style={{ height: '280px' }}>
            <Bar data={goalsVsXgData} options={chartOptions} />
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pl-pink)', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={16} /> What & How to Interpret This:
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Metric:</strong> Expected Goals (xG) measures the statistical probability of a shot resulting in a goal based on position, angle, and defensive pressure.<br />
              <strong>Tactical Insight:</strong> If a player has a significantly higher xG than actual goals, they are due for positive regression (buy target). If actual goals far exceed xG, they might be on an unsustainable finishing streak.
            </p>
          </div>
        </div>

        {/* Chart 4 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            4. Top Creators: Assists vs Expected Assists (xA)
          </h3>
          <div style={{ height: '280px' }}>
            <Bar data={creatorsData} options={chartOptions} />
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pl-gold)', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={16} /> What & How to Interpret This:
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Metric:</strong> Expected Assists (xA) evaluates the likelihood that a pass completed by a player will become a goal assist, evaluating key-pass quality.<br />
              <strong>Tactical Insight:</strong> High xA creators who take set pieces (corners and direct free kicks) consistently deliver high baseline creativity points.
            </p>
          </div>
        </div>

        {/* Chart 5 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            5. Ownership % vs Total Points (Template vs Differential)
          </h3>
          <div style={{ height: '280px' }}>
            <Scatter data={ownershipVsPointsData} options={scatterOptions('Ownership %', 'Total Points')} />
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pl-neon-green)', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={16} /> What & How to Interpret This:
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Metric:</strong> Percentage of all global managers who currently own the player mapped against point returns.<br />
              <strong>Tactical Insight:</strong> Players with low ownership (&lt;10%) but high total points are "Differential Goldmines" capable of boosting your overall rank rapidly when they return points.
            </p>
          </div>
        </div>

        {/* Chart 6 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            6. Positional Point Yield Distribution
          </h3>
          <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={positionDistData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={16} /> What & How to Interpret This:
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Metric:</strong> Total aggregate points generated by each position category (Goalkeepers, Defenders, Midfielders, Forwards).<br />
              <strong>Tactical Insight:</strong> Midfielders typically generate the highest share of points due to clean sheet bonuses (+1 pt) and higher goal points (+5 pts) compared to forwards.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
