import React from 'react';
import type { Game } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Sparkles, BookOpen, Settings } from 'lucide-react';
import { GameIcon } from './GameIcon';

interface FeaturedGamesProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  onViewAllGames?: () => void;
}

export const FeaturedGames: React.FC<FeaturedGamesProps> = ({
  games,
  onSelectGame,
  onViewAllGames,
}) => {
  const { language, t } = useLanguage();

  return (
    <section aria-labelledby="featured-games-title">
      <div className="section-header-block">
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 id="featured-games-title" className="section-title">
              <Sparkles size={18} strokeWidth={2} color="var(--accent-purple-light)" />
              {t('featured_games_title')}
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              {games.filter((g) => g.status === 'available').length} {language === 'am' ? 'ጨዋታዎች' : 'Titles'}
            </span>
          </div>
          <p className="section-subtitle">{t('featured_games_desc')}</p>
        </div>
        {onViewAllGames && (
          <button
            type="button"
            className="section-action-btn"
            onClick={onViewAllGames}
            id="view-all-games-btn"
          >
            {t('view_all_games')} →
          </button>
        )}
      </div>

      <div className="games-grid">
        {games.map((game) => {
          const title = language === 'am' ? game.titleAm : game.title;
          const desc = language === 'am' ? game.descriptionAm : game.description;
          const category = language === 'am' ? game.categoryLabelAm : game.categoryLabel;
          const difficulty = language === 'am' ? game.difficultyAm : game.difficulty;
          const badge = language === 'am' ? game.badgeAm : game.badge;
          const engineStatus = language === 'am' ? game.engineStatusAm : game.engineStatus;

          return (
            <article
              key={game.id}
              className={`game-card game-card-${game.id}`}
              style={{
                borderColor: `${game.accentColor}33`,
              }}
            >
              <div className="game-card-top">
                <div
                  className="game-avatar-box"
                  style={{
                    background: `linear-gradient(135deg, ${game.accentColor}25 0%, #130e26 100%)`,
                    border: `1px solid ${game.accentColor}55`,
                    color: game.accentColor,
                  }}
                  aria-hidden="true"
                >
                  {game.logoUrl ? (
                    <img
                      src={game.logoUrl}
                      alt={`${title} logo`}
                      className="game-custom-thumb"
                    />
                  ) : (
                    <GameIcon iconName={game.icon} size={24} color={game.accentColor} />
                  )}
                </div>

                <div className="game-info">
                  <div className="game-badge-row">
                    <span className="badge badge-purple">{category}</span>
                    <span className="badge badge-gold">{difficulty}</span>
                    {badge && <span className="badge badge-cyan">{badge}</span>}
                  </div>

                  <h3 className="game-title">{title}</h3>
                  <p className="game-desc">{desc}</p>

                  {engineStatus && (
                    <div style={{ marginTop: '4px' }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-dim)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '0.66rem',
                          textTransform: 'none',
                          letterSpacing: 'normal',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Settings size={10} strokeWidth={2} /> {engineStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="game-card-footer">
                <div className="game-stats-meta">
                  {game.bestScore !== undefined && (
                    <span className="game-score-tag">
                      <span>★</span> {language === 'am' ? 'ከፍተኛ ውጤት' : 'Best'}: {game.bestScore.toLocaleString()} pts
                    </span>
                  )}
                  <span className="game-plays-tag">
                    +{game.maxPointsReward} max XP • {game.rating} ★
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-secondary game-action-btn"
                  onClick={() => onSelectGame(game)}
                  id={`preview-btn-${game.id}`}
                  aria-label={`${language === 'am' ? 'ደንቦችና ዝርዝር ይመልከቱ' : 'View Rules and Details'} ${title}`}
                >
                  <BookOpen size={13} strokeWidth={2} />
                  {language === 'am' ? 'ዝርዝርና ደንቦች' : 'Rules & Preview'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
