import React, { useState, useEffect } from 'react';
import { Bell, Clock, X, Zap } from 'lucide-react';

function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end - now;
      if (diff <= 0) { setTimeLeft('DEADLINE PASSED'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3 * 3600000); // under 3 hours
      if (h > 24) {
        const d = Math.floor(h / 24);
        const rh = h % 24;
        setTimeLeft(`${d}d ${rh}h ${m}m`);
      } else {
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadline]);

  return { timeLeft, urgent };
}

export default function NotifBar({ overview }) {
  const [dismissed, setDismissed] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  const deadline = overview?.next_deadline;
  const gwName = overview?.next_gw_name;
  const { timeLeft, urgent } = useCountdown(deadline);

  if (dismissed || !deadline || !timeLeft) return null;

  const requestNotif = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
      // Schedule a reminder (best effort, tab must stay open)
      const end = new Date(deadline);
      const msUntil1hr = end - Date.now() - 3600000;
      if (msUntil1hr > 0) {
        setTimeout(() => {
          new Notification('⚽ FPL Deadline Approaching!', {
            body: `${gwName} deadline is in 1 hour! Make your transfers now.`,
            icon: '/favicon.ico',
          });
        }, msUntil1hr);
      }
    }
  };

  return (
    <div
      className="notif-bar"
      style={{ borderBottom: `1px solid ${urgent ? 'rgba(233,0,82,0.4)' : 'rgba(0,255,135,0.2)'}`, background: urgent ? 'linear-gradient(90deg, rgba(233,0,82,0.15) 0%, rgba(14,19,31,0.95) 100%)' : undefined }}
    >
      <Bell size={13} color={urgent ? 'var(--pl-pink)' : 'var(--pl-neon-green)'} style={{ animation: urgent ? 'pulseGlow 1.2s infinite' : 'none' }} />
      <span style={{ fontWeight: 700, color: urgent ? 'var(--pl-pink)' : 'var(--pl-neon-green)' }}>
        {gwName} Deadline:
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: urgent ? 'var(--pl-pink)' : '#fff', fontSize: '0.85rem', letterSpacing: '0.03em' }}>
        {timeLeft}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>·</span>
      <span style={{ color: 'var(--text-muted)' }}>
        {new Date(deadline).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </span>

      {!notifGranted && 'Notification' in window && Notification.permission !== 'denied' && (
        <button
          id="notif-enable-btn"
          onClick={requestNotif}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', borderRadius: '7px', padding: '3px 10px', color: 'var(--pl-neon-green)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}
        >
          <Zap size={11} /> Enable Alerts
        </button>
      )}
      {notifGranted && (
        <span style={{ fontSize: '0.75rem', color: 'var(--pl-neon-green)', fontWeight: 600 }}>
          ✓ Alerts on
        </span>
      )}

      <button
        id="notif-dismiss-btn"
        onClick={() => setDismissed(true)}
        style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
