import React from 'react';
import type { DailyChallenge as ChallengeType } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Target, Gift, Lock, BookOpen } from 'lucide-react';
import triviaBadgeImg from '../assets/trivia-badge.jpg';

interface DailyChallengeProps {
  challenge: ChallengeType;
  onStartChallenge: (challenge: ChallengeType) => void;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  challenge,
  onStartChallenge,
}) => {
  const { language, t } = useLanguage();
  const progressPercent = Math.round(
    (challenge.currentProgress / challenge.targetProgress) * 100
  );
  const remainingCount = Math.max(0, challenge.targetProgress - challenge.currentProgress);
  const isCompleted = challenge.status === 'completed';

  return (
    <section aria-labelledby="daily-challenge-heading">
      <div className="section-header-block">
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 id="daily-challenge-heading" className="section-title">
              <Target size={18} strokeWidth={2} color="var(--accent-gold)" />
              {t('daily_challenge_title')}
            </h2>
            <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
              {isCompleted 
                ? (language === 'am' ? 'ተጠናቋል' : 'Completed') 
                : `${remainingCount} ${language === 'am' ? 'ተግባራት ቀርተዋል' : 'Remaining'}`}
            </span>
          </div>
          <p className="section-subtitle">
            {language === 'am' ? 'የተሰጠውን የዕለት ዓላማ በማጠናቀቅ ተጨማሪ ነጥብ ያግኙ' : 'Complete the targeted active objective to earn bonus score'}
          </p>
        </div>
      </div>

      <div className="daily-challenge-card animate-glow-border">
        <div className="daily-challenge-header">
          <div className="daily-challenge-title-group">
            <div className="challenge-badges-row">
              <span className="badge badge-purple challenge-game-box">
                <img
                  src={triviaBadgeImg}
                  alt="Ethiopian Mind Sprint"
                  className="challenge-box-img"
                />
                <span>{challenge.gameTitle}</span>
              </span>
              <span className="badge badge-cyan challenge-status-box">
                <span className="challenge-status-indicator" aria-hidden="true" />
                <span>{isCompleted ? t('challenge_completed') : t('challenge_in_progress')}</span>
              </span>
            </div>

            <h3 className="daily-challenge-title">
              {language === 'am' ? challenge.titleAm : challenge.title}
            </h3>
            <p className="daily-challenge-instr">
              {language === 'am' ? challenge.instructionsAm : challenge.instructions}
            </p>
          </div>

          <div className="daily-reward-badge" title="Reward points upon verified completion">
            <Gift size={14} strokeWidth={2} />
            <span>+{challenge.rewardPoints} XP</span>
          </div>
        </div>

        {/* Data-driven Progress bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-meta">
            <span>
              {language === 'am' ? 'የተከናወነ ደረጃ' : 'Challenge Objective Progress'}
            </span>
            <span>
              <strong>{challenge.currentProgress}</strong> / {challenge.targetProgress} ({progressPercent}%)
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Daily challenge completion progress"
          >
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Footer with honest action button and security notice */}
        <div className="daily-challenge-footer">
          <div className="daily-security-note">
            <Lock size={12} strokeWidth={2} aria-hidden="true" />
            <span>
              {language === 'am'
                ? 'የውጤት ነጥብ በሰርቨር ሲረጋገጥ ብቻ ይመዘገባል'
                : 'Points credited strictly after server-side answer verification'}
            </span>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onStartChallenge(challenge)}
            id="start-daily-challenge-btn"
          >
            <BookOpen size={14} strokeWidth={2} />
            {language === 'am' ? 'የተልዕኮ መረጃ' : 'Challenge & Game Details'}
          </button>
        </div>
      </div>
    </section>
  );
};
