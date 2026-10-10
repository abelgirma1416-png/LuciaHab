import React from 'react';
import type { Game } from '../types/game';
import { useLanguage } from '../context/useLanguage';
import { GameIcon } from './GameIcon';
import { Play, Clock, Star, Trophy, Users, BookOpen } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onSelectGame: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelectGame }) => {
  const { language } = useLanguage();

  const title = language === 'am' ? game.titleAm : game.title;
  const desc = language === 'am' ? game.descriptionAm : game.description;
  const categoryLabel = language === 'am' ? game.categoryLabelAm : game.categoryLabel;
  const difficulty = language === 'am' ? game.difficultyAm : game.difficulty;
  const isAvailable = game.status === 'available';

  return (
    <article
      className={`game-catalog-card ${isAvailable ? 'card-available' : 'card-coming-soon'}`}
      style={{
        borderColor: `${game.accentColor}33`,
      }}
      aria-labelledby={`game-card-title-${game.id}`}
    >
      <div className="game-card-header">
        <div className="game-card-identity">
          <div
            className="game-card-icon-container"
            style={{
              background: `linear-gradient(135deg, ${game.accentColor}25 0%, #15102a 100%)`,
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

          <div className="game-card-heading-group">
            <div className="game-card-badges-row">
              <span className="badge badge-purple">{categoryLabel}</span>
              <span className="badge badge-gold">{difficulty}</span>
              {isAvailable ? (
                <span className="badge badge-cyan game-status-badge available">
                  <span className="live-status-dot" aria-hidden="true" />
                  {language === 'am' ? 'ዝግጁ' : 'Available'}
                </span>
              ) : (
                <span className="badge badge-purple game-status-badge coming-soon">
                  <Clock size={10} strokeWidth={2} aria-hidden="true" />
                  {language === 'am' ? 'በቅርቡ' : 'Coming Soon'}
                </span>
              )}
            </div>

            <h3 id={`game-card-title-${game.id}`} className="game-catalog-title">
              {title}
            </h3>
          </div>
        </div>
      </div>

      <p className="game-catalog-desc">{desc}</p>

      {/* Real stats row (plays, rating, best score) */}
      <div className="game-catalog-meta-row">
        {game.playsCount > 0 ? (
          <div className="meta-item" title="Verified player sessions">
            <Users size={12} strokeWidth={2} className="meta-icon" />
            <span>{game.playsCount.toLocaleString()} {language === 'am' ? 'ተጫዋቾች' : 'plays'}</span>
          </div>
        ) : (
          <div className="meta-item" title="Engine in development">
            <Clock size={12} strokeWidth={2} className="meta-icon" />
            <span>{language === 'am' ? 'በዝግጅት ላይ' : 'In Roadmap'}</span>
          </div>
        )}

        {game.bestScore !== undefined && (
          <div className="meta-item best-score" title="Player high score">
            <Trophy size={12} strokeWidth={2} color="var(--accent-gold)" />
            <span>{game.bestScore.toLocaleString()} pts</span>
          </div>
        )}

        <div className="meta-item rating">
          <Star size={12} strokeWidth={2} fill="var(--accent-gold)" color="var(--accent-gold)" />
          <span>{game.rating}</span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="game-catalog-footer">
        <span className="game-reward-pill">
          +{game.maxPointsReward} max XP
        </span>

        <div className="game-card-btn-group">
          {/* Rules & Details button */}
          <button
            type="button"
            className="btn-secondary game-details-btn"
            onClick={() => onSelectGame(game)}
            aria-label={`${language === 'am' ? 'ዝርዝር መረጃ' : 'Rules & Info'} ${title}`}
            title={language === 'am' ? 'ደንቦችና ዝርዝር ይመልከቱ' : 'View Rules & Engine Spec'}
          >
            <BookOpen size={14} strokeWidth={2} />
            <span>{language === 'am' ? 'ደንቦች' : 'Rules'}</span>
          </button>

          {/* Primary Play Button */}
          {isAvailable ? (
            <button
              type="button"
              className="btn-primary game-play-btn"
              onClick={() => onSelectGame(game)}
              aria-label={`${language === 'am' ? 'ይጫወቱ' : 'Play'} ${title}`}
              id={`play-game-${game.id}`}
            >
              <Play size={14} strokeWidth={2.5} fill="#fff" />
              <span>{language === 'am' ? 'ተጫወት' : 'Play'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary game-disabled-btn"
              onClick={() => onSelectGame(game)}
              aria-label={`${language === 'am' ? 'በቅርቡ የሚለቀቅ' : 'Coming soon info'} ${title}`}
              title={language === 'am' ? 'ይህ ጨዋታ በቅርቡ ይለቀቃል' : 'This game is currently in roadmap development'}
            >
              <Clock size={13} strokeWidth={2} />
              <span>{language === 'am' ? 'በቅርቡ' : 'Soon'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
