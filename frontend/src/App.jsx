import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import NotifBar from './components/Navbar/NotifBar';
import HomeView from './components/Home/HomeView';
import PlayersView from './components/Players/PlayersView';
import ChartsView from './components/Charts/ChartsView';
import PLLiveView from './components/PLLive/PLLiveView';
import SquadBuilderView from './components/SquadBuilder/SquadBuilderView';
import AuthGate from './components/Auth/AuthGate';
import ChatbotWidget from './components/Chatbot/ChatbotWidget';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [players, setPlayers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [plNews, setPlNews] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('pl_token');
    const savedUser = localStorage.getItem('pl_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        // Verify token is still valid
        fetch(`/api/auth/me?token=${savedToken}`)
          .then((r) => {
            if (!r.ok) {
              localStorage.removeItem('pl_token');
              localStorage.removeItem('pl_user');
              setUser(null);
              setToken(null);
            }
          })
          .catch(() => {});
      } catch {
        localStorage.removeItem('pl_token');
        localStorage.removeItem('pl_user');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  const fetchAllData = async () => {
    try {
      const [resPlayers, resOverview, resHome, resPL] = await Promise.all([
        fetch('/api/players').then(r => r.json()),
        fetch('/api/overview').then(r => r.json()),
        fetch('/api/home-feed').then(r => r.json()),
        fetch('/api/plnews').then(r => r.json())
      ]);
      setPlayers(resPlayers || []);
      setOverview(resOverview || null);
      setHomeData(resHome || null);
      setPlNews(resPL || null);
    } catch (err) {
      console.error('Error fetching FPL live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Log tab changes to activity
  useEffect(() => {
    if (user && token && activeTab) {
      const labels = { home: 'Home & History', players: 'Players Explorer', charts: 'Charts & Stats', pllive: 'PL Live', squad: 'Pitch Builder' };
      fetch('/api/auth/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'Viewed Tab', detail: labels[activeTab] || activeTab }),
      }).catch(() => {});
    }
  }, [activeTab]);

  // Not yet determined auth state
  if (!authChecked) return null;

  // Show auth gate if not logged in
  if (!user) {
    return <AuthGate onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overview={overview}
        user={user}
        token={token}
        onLogout={handleLogout}
      />
      <NotifBar overview={overview} />

      <main style={{ flex: 1 }}>
        {loading && (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Syncing live Premier League data...
          </div>
        )}
        {!loading && activeTab === 'home' && (
          <HomeView
            homeData={homeData}
            overview={overview}
            setActiveTab={setActiveTab}
            players={players}
          />
        )}
        {!loading && activeTab === 'players' && (
          <PlayersView players={players} />
        )}
        {!loading && activeTab === 'charts' && (
          <ChartsView players={players} />
        )}
        {!loading && activeTab === 'pllive' && (
          <PLLiveView plNews={plNews} />
        )}
        {!loading && activeTab === 'squad' && (
          <SquadBuilderView players={players} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(7, 9, 14, 0.95)'
      }}>
        <div>Official Premier League & Fantasy Live Intelligence Dashboard</div>
        <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
          Data synchronized via Fantasy Premier League API • Built for Premier League Managers & Fans
        </div>
      </footer>

      {/* Floating chatbot — always visible when logged in */}
      <ChatbotWidget user={user} players={players} plNews={plNews} overview={overview} />
    </div>
  );
}
