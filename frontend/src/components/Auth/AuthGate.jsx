import React, { useState } from 'react';
import { Trophy, Eye, EyeOff, Loader2, User, Lock, UserPlus, LogIn } from 'lucide-react';

export default function AuthGate({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      if (mode === 'register') {
        setSuccess('Account created! Logging you in...');
        setTimeout(() => {
          localStorage.setItem('pl_token', data.token);
          localStorage.setItem('pl_user', JSON.stringify(data.user));
          onLogin(data.user, data.token);
        }, 800);
      } else {
        localStorage.setItem('pl_token', data.token);
        localStorage.setItem('pl_user', JSON.stringify(data.user));
        onLogin(data.user, data.token);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername('admin');
    setPassword('admin');
    setError('');
  };

  return (
    <div className="auth-gate">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'var(--pl-purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Trophy size={28} color="#fff" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            PREMIER<span style={{ color: 'var(--pl-purple)' }}>LEAGUE</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Intelligence Hub — Sign in to continue
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', background: '#f3f4f6',
          borderRadius: '8px', padding: '4px', marginBottom: '24px',
          border: '1px solid var(--border-subtle)',
        }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '9px', borderRadius: '6px', border: 'none',
                background: mode === m ? '#ffffff' : 'transparent',
                color: mode === m ? 'var(--pl-purple)' : 'var(--text-muted)',
                fontWeight: mode === m ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
                fontFamily: 'var(--font-main)', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="auth-username"
                className="auth-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="auth-password"
                className="auth-input"
                style={{ paddingLeft: '38px', paddingRight: '44px' }}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 14px', color: '#15803d', fontSize: '0.85rem' }}>
              {success}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', opacity: loading ? 0.7 : 1, marginTop: '8px' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Demo hint */}
        {mode === 'login' && (
          <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Demo credentials available
            </div>
            <button
              id="auth-demo-btn"
              onClick={fillDemo}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Use admin / admin
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
