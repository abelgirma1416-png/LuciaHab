import React from 'react';
import type { PlayerStats as StatsType } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Gem, Gamepad2, Trophy, Flame, Info } from 'lucide-react';

interface PlayerStatsProps {
  stats: StatsType;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ stats }) => {
  const { language, t } = useLanguage();

  return (
    <section className="stats-section-container" aria-label="Player Performance Statistics">
      <div className="section-header-block" style={{ marginBottom: '8px' }}>
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="section-title" style={{ fontSize: '1.15rem' }}>
              <Trophy size={18} strokeWidth={2} color="var(--accent-gold)" />
              {language === 'am' ? 'የተጫዋች ውጤቶች' : 'Player Performance'}
            </h2>
            {stats.isMockData && (
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                {language === 'am' ? 'የሙከራ መረጃ' : 'Demo Profile'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {/* Total Points */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-icon-wrapper" aria-hidden="true">
              <Gem size={16} strokeWidth={2} color="var(--accent-purple-light)" />
            </span>
            <span className="badge badge-purple stat-badge">XP Points</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats.totalPoints.toLocaleString()}</div>
            <div className="stat-label">{t('stat_total_points')}</div>
          </div>
        </div>

        {/* Games Played */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-icon-wrapper" aria-hidden="true">
              <Gamepad2 size={16} strokeWidth={2} color="var(--accent-cyan)" />
            </span>
            <span className="badge badge-cyan stat-badge">{stats.weeklyWinRate}% Win Rate</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats.gamesPlayed}</div>
            <div className="stat-label">{t('stat_games_played')}</div>
          </div>
        </div>

        {/* Global Rank */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-icon-wrapper" aria-hidden="true">
              <Trophy size={16} strokeWidth={2} color="var(--accent-gold)" />
            </span>
            <span className="badge badge-gold stat-badge">Top 1%</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">#{stats.leaderboardRank}</div>
            <div className="stat-label">
              {t('stat_global_rank')} <span style={{ opacity: 0.65 }}>/ {stats.totalPlayers.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Daily Streak */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-icon-wrapper" aria-hidden="true">
              <Flame size={16} strokeWidth={2} color="#fb923c" />
            </span>
            <span className="badge badge-gold stat-badge">1.25x Multiplier</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats.dailyStreakDays} {language === 'am' ? 'ቀናት' : 'Days'}</div>
            <div className="stat-label">{t('stat_daily_streak')}</div>
          </div>
        </div>
      </div>

      {/* Explicit Mock Data Status Disclaimer */}
      {stats.isMockData && (
        <div className="mock-indicator-bar" role="status">
          <Info size={14} strokeWidth={2} aria-hidden="true" />
          <span>{t('mock_data_notice')}</span>
        </div>
      )}
    </section>
  );
};
