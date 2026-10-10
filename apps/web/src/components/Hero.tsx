import React from 'react';
import type { PlayerProfile, DailyChallenge } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Gamepad2, Target } from 'lucide-react';

interface HeroProps {
  player: PlayerProfile;
  dailyChallenge: DailyChallenge;
  onPlayNow: () => void;
  onViewChallenge: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  player,
  dailyChallenge,
  onPlayNow,
  onViewChallenge,
}) => {
  const { language, t } = useLanguage();
  const playerName = language === 'am' ? player.displayNameAm : player.displayName;

  return (
    <section className="hero-card" aria-labelledby="hero-title">
      <div className="hero-glow-accent" aria-hidden="true" />
      
      <div className="hero-header">
        <div className="hero-greeting-container">
          <div className="hero-tag-row">
            <span className="badge badge-purple">{t('beta_tag')}</span>
            <span className="badge badge-cyan">{t('telegram_ready')}</span>
          </div>

          <h1 id="hero-title" className="hero-greeting">
            {language === 'am' ? (
              <>እንኳን ደህና መጡ፣ <span className="player-highlight">{playerName}</span>!</>
            ) : (
              <>Welcome back, <span className="player-highlight">{playerName}</span>!</>
            )}
          </h1>

          <p className="hero-subtitle">
            {language === 'am' 
              ? 'የአዕምሮ ብቃትዎን ይፈትሹ፤ የዕለቱን ፈተናዎች በማጠናቀቅ የደረጃ ሰንጠረዡን በበላይነት ይምሩ።'
              : 'Sharpen your cognitive agility. Outsmart rivals in Ethiopian trivia, speed math, and tactical chess.'}
          </p>
        </div>

        <div className="hero-visual-badge" role="img" aria-label="Gaming Emblem">
          ⚔️
        </div>
      </div>

      {/* Hero Balanced Actions */}
      <div className="hero-actions-row">
        <button
          type="button"
          className="btn-primary"
          onClick={onPlayNow}
          id="hero-play-now-btn"
        >
          <Gamepad2 size={15} strokeWidth={2} />
          {language === 'am' ? 'ጨዋታዎችን ያስሱ' : 'Browse Featured Games'}
        </button>

        <button
          type="button"
          className="hero-daily-pill"
          onClick={onViewChallenge}
          title="Jump to today's active challenge"
          id="hero-challenge-pill-btn"
        >
          <Target size={14} strokeWidth={2} />
          <span className="hero-daily-pill-text">
            {language === 'am' ? dailyChallenge.titleAm : dailyChallenge.title}
          </span>
          <span className="hero-daily-pill-count">
            ({dailyChallenge.currentProgress}/{dailyChallenge.targetProgress})
          </span>
        </button>
      </div>
    </section>
  );
};
