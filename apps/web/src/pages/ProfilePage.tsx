import React, { useState } from 'react';
import type { PlayerProfile, PlayerStats } from '../types';
import { useLanguage } from '../context/useLanguage';

interface ProfilePageProps {
  player: PlayerProfile;
  stats: PlayerStats;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ player, stats }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const displayName = language === 'am' ? player.displayNameAm : player.displayName;
  const tier = language === 'am' ? player.tierAm : player.tier;

  return (
    <main className="gameverse-page">
      <div className="section-title-wrap">
        <h1 style={{ fontSize: '1.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👤</span> {t('nav_profile')}
        </h1>
        <p className="section-subtitle">
          {language === 'am' ? 'የተጠቃሚ መገለጫ እና ማስተካከያዎች' : 'Player identity and platform preferences'}
        </p>
      </div>

      {/* Main Profile Card */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#fff',
              border: '2px solid rgba(168, 85, 247, 0.4)',
            }}
          >
            {player.initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                {displayName}
              </span>
              <span className="badge badge-cyan">Level {player.level}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple-light)', fontWeight: 600 }}>
              {tier}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Telegram Handle: {player.telegramHandle} • Account ID: {player.id}
            </span>
          </div>
        </div>

        {/* Quick summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t('stat_total_points')}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{stats.totalPoints.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t('stat_games_played')}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{stats.gamesPlayed}</div>
          </div>
          <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t('stat_daily_streak')}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{stats.dailyStreakDays}d</div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#fff' }}>
          ⚙️ {language === 'am' ? 'ምርጫዎች' : 'Platform Preferences'}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              {language === 'am' ? 'የቋንቋ ምርጫ' : 'Interface Language'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {language === 'am' ? 'አማርኛ (Amharic)' : 'English (US)'}
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={toggleLanguage}>
            {language === 'en' ? '🇪🇹 አማርኛ' : '🇬🇧 English'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Game Audio & SFX</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Phaser audio effects and feedback</div>
          </div>
          <button
            type="button"
            className={soundEnabled ? 'badge badge-purple' : 'btn-secondary'}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? '🔊 Enabled' : '🔇 Muted'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Telegram Haptics</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Vibrations on win & streak actions</div>
          </div>
          <button
            type="button"
            className={hapticEnabled ? 'badge badge-purple' : 'btn-secondary'}
            onClick={() => setHapticEnabled(!hapticEnabled)}
          >
            {hapticEnabled ? '📳 Enabled' : 'Off'}
          </button>
        </div>
      </div>

      {/* Backend Integration Roadmap card */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(168, 85, 247, 0.06)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.8rem',
          lineHeight: '1.5',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>
          🔌 Planned Backend & Database Integration
        </div>
        <p>
          Supabase PostgreSQL integration is prepared. During production rollout:
        </p>
        <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
          <li>Player profiles authenticate using verified Telegram WebApp <code>initData</code> HMAC SHA-256.</li>
          <li>Database RLS (Row Level Security) restricts score edits strictly to authorized server services.</li>
          <li>Never trust client-side reported scores or expose Supabase service role keys.</li>
        </ul>
      </div>
    </main>
  );
};
