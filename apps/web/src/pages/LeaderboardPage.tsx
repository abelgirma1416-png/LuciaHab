import React, { useState } from 'react';
import type { LeaderboardEntry } from '../types';
import { useLanguage } from '../context/useLanguage';

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ entries }) => {
  const { language, t } = useLanguage();
  const [filterPeriod, setFilterPeriod] = useState<'weekly' | 'alltime'>('weekly');

  return (
    <main className="gameverse-page">
      <div className="section-title-wrap">
        <h1 style={{ fontSize: '1.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏆</span> {t('nav_leaderboard')}
        </h1>
        <p className="section-subtitle">
          {language === 'am' ? 'የተወዳዳሪዎች የክብር ሰንጠረዥ።' : 'Verified champion standings across Telegram & Web.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className={filterPeriod === 'weekly' ? 'badge badge-purple' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setFilterPeriod('weekly')}
        >
          {language === 'am' ? 'የሳምንቱ' : 'This Week'}
        </button>
        <button
          type="button"
          className={filterPeriod === 'alltime' ? 'badge badge-purple' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setFilterPeriod('alltime')}
        >
          {language === 'am' ? 'የምንጊዜውም' : 'All-Time Legends'}
        </button>
      </div>

      {/* Full Leaderboard List */}
      <div className="leaderboard-preview-list" role="list">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`leaderboard-row ${entry.isCurrentPlayer ? 'current-player-row' : ''}`}
            role="listitem"
          >
            <div className="leaderboard-player-left">
              <span className="rank-number" style={{ color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#d97706' : 'var(--text-dim)' }}>
                {entry.rank <= 3 ? (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') : `#${entry.rank}`}
              </span>

              <div className="leaderboard-avatar">{entry.initials}</div>

              <div className="leaderboard-name-group">
                <span className="leaderboard-player-name">{entry.displayName}</span>
                <span className="leaderboard-player-tier">{entry.tier} • {entry.gamesWon} wins</span>
              </div>
            </div>

            <div className="leaderboard-player-right">
              <span className="leaderboard-score-value">
                {entry.score.toLocaleString()} XP
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Guarantee Card */}
      <div
        style={{
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--surface-glass-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          lineHeight: '1.4',
        }}
      >
        🛡️ <strong>Privacy Protection:</strong> Leaderboard records show only public player aliases. Telegram user identifiers, private authentication tokens, and personal credentials are encrypted and never exposed in the client.
      </div>
    </main>
  );
};
