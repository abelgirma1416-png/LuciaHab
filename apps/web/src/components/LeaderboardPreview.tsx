import React from 'react';
import type { LeaderboardEntry } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Trophy, Medal, ChevronRight } from 'lucide-react';

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  onViewFullLeaderboard: () => void;
}

export const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({
  entries,
  onViewFullLeaderboard,
}) => {
  const { language, t } = useLanguage();

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal size={16} strokeWidth={2.5} color="#eab308" />;
    if (rank === 2) return <Medal size={16} strokeWidth={2.5} color="#94a3b8" />;
    if (rank === 3) return <Medal size={16} strokeWidth={2.5} color="#d97706" />;
    return <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>#{rank}</span>;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  };

  return (
    <section aria-labelledby="leaderboard-heading">
      <div className="section-header-block">
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 id="leaderboard-heading" className="section-title">
              <Trophy size={18} strokeWidth={2} color="var(--accent-gold)" />
              {t('leaderboard_preview_title')}
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              {language === 'am' ? 'የሙከራ ሰንጠረዥ' : 'Demo Rankings'}
            </span>
          </div>
          <p className="section-subtitle">{t('leaderboard_preview_desc')}</p>
        </div>

        <button
          type="button"
          className="section-action-btn"
          onClick={onViewFullLeaderboard}
          id="view-full-leaderboard-btn"
        >
          {t('view_full_leaderboard')}
          <ChevronRight size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state-card" role="status">
          <Trophy size={40} strokeWidth={1.5} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>
            {language === 'am' ? 'ምንም የተመዘገበ ተጫዋች የለም' : 'No Leaderboard Data Yet'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {language === 'am' ? 'ውድድሮች ሲጀመሩ ደረጃዎች እዚህ ይዘረዘራሉ።' : 'Leaderboard rankings will appear here once initial matches are logged.'}
          </p>
        </div>
      ) : (
        <div className="leaderboard-preview-list" role="list">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`leaderboard-row ${entry.isCurrentPlayer ? 'current-player-row' : ''}`}
              role="listitem"
            >
              <div className="leaderboard-player-left">
                <span className={`rank-number ${getRankClass(entry.rank)}`}>
                  {getRankBadge(entry.rank)}
                </span>

                <div className="leaderboard-avatar" aria-hidden="true">
                  {entry.initials}
                </div>

                <div className="leaderboard-name-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="leaderboard-player-name">
                      {entry.displayName}
                    </span>
                    {entry.isCurrentPlayer && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        {language === 'am' ? 'እርስዎ' : 'You'}
                      </span>
                    )}
                  </div>
                  <span className="leaderboard-player-tier">
                    {entry.tier} • {entry.gamesWon} wins
                  </span>
                </div>
              </div>

              <div className="leaderboard-player-right">
                <span className="leaderboard-score-value">
                  {entry.score.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple-light)' }}>XP</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
