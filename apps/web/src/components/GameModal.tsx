import React, { useState } from 'react';
import type { Game } from '../types';
import { useLanguage } from '../context/useLanguage';
import { BookOpen, ShieldCheck, X, Play } from 'lucide-react';
import { GameIcon } from './GameIcon';
import { TurboMathGame } from './games/TurboMathGame';
import { EthiopianMindSprintGame } from './games/EthiopianMindSprintGame';
import { HeritageMemoryMatrix } from './games/HeritageMemoryMatrix';
import { EthiopianGrandmasterChess } from './games/EthiopianGrandmasterChess';

interface GameModalProps {
  game: Game | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  if (!game) return null;

  const title = language === 'am' ? game.titleAm : game.title;
  const desc = language === 'am' ? game.descriptionAm : game.description;
  const category = language === 'am' ? game.categoryLabelAm : game.categoryLabel;
  const difficulty = language === 'am' ? game.difficultyAm : game.difficulty;
  const engineStatus = language === 'am' ? game.engineStatusAm : game.engineStatus;
  const rulesList = language === 'am' ? (game.rulesAm || game.rules) : game.rules;
  const isTurboMath = game.id === 'turbo-math-challenge';
  const isTrivia = game.id === 'ethiopian-mind-sprint-trivia';
  const isMemoryMatrix = game.id === 'heritage-memory-matrix';
  const isChess = game.id === 'ethiopian-grandmaster-chess';
  const isPlayableGame = isTurboMath || isTrivia || isMemoryMatrix || isChess;

  const handleClose = () => {
    setIsPlaying(false);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-game-title">
      <div className={`modal-content-card ${isPlaying ? 'modal-gameplay-mode' : ''}`}>
        {/* If user clicked Play, mount the appropriate game view */}
        {isPlaying && isTurboMath ? (
          <TurboMathGame onExit={() => setIsPlaying(false)} />
        ) : isPlaying && isTrivia ? (
          <EthiopianMindSprintGame onExit={() => setIsPlaying(false)} />
        ) : isPlaying && isMemoryMatrix ? (
          <HeritageMemoryMatrix onExit={() => setIsPlaying(false)} />
        ) : isPlaying && isChess ? (
          <EthiopianGrandmasterChess onExit={() => setIsPlaying(false)} />
        ) : (
          <>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${game.accentColor}25`,
                    border: `1px solid ${game.accentColor}55`,
                  }}
                >
                  <GameIcon iconName={game.icon} size={26} color={game.accentColor} />
                </span>
                <div>
                  <h3 id="modal-game-title" style={{ fontSize: '1.25rem', color: '#fff', lineHeight: '1.2' }}>
                    {title}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span className="badge badge-purple">{category}</span>
                    <span className="badge badge-gold">{difficulty}</span>
                    {game.status === 'available' ? (
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                        {language === 'am' ? 'ዝግጁ' : 'Playable'}
                      </span>
                    ) : (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                        {language === 'am' ? 'በቅርቡ' : 'Coming Soon'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleClose}
                aria-label={t('close')}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Game Synopsis */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {desc}
            </p>

            {/* Game Rules / Objectives */}
            {rulesList && rulesList.length > 0 && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--surface-glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} strokeWidth={2} color="var(--accent-purple-light)" />
                  {language === 'am' ? 'የጨዋታው ሕጎች እና ዓላማዎች' : 'Gameplay Objectives & Rules'}
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {rulesList.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Architecture & Reward Metrics */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--surface-glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Engine Architecture:</span>
                <span style={{ color: 'var(--accent-purple-light)', fontWeight: 600 }}>
                  {isPlayableGame ? 'Phaser 4.2.1 (Active)' : (engineStatus || 'Phaser 4 (Milestone 2)')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Session Duration:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>~{game.minDurationMinutes || 2} Minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Maximum Points Yield:</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>+{game.maxPointsReward} XP</span>
              </div>
            </div>

            {/* Transparent Status and Security Notice */}
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                background: 'rgba(168, 85, 247, 0.08)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(168, 85, 247, 0.22)',
                lineHeight: '1.45',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <ShieldCheck size={16} strokeWidth={2} color="var(--accent-purple-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                {isPlayableGame ? (
                  language === 'am'
                    ? 'ጨዋታው በPhaser 4 ሞተር ዝግጁ ሆኗል። የውጤት ነጥቦች በሰርቨር ተረጋግጠው ይመዘገባሉ።'
                    : 'Phaser 4 active game instance is ready to play. Local points are calculated immediately, and server-side verification commits final XP.'
                ) : (
                  language === 'am'
                    ? 'ይህ ጨዋታ በቅርቡ በPhaser 4 ሞተር የሚለቀቅ ሲሆን ደንቦቹና ስልቱ ከላይ ተዘርዝረዋል።'
                    : 'Phaser 4 canvas gameplay is scheduled for this title. Game specs and rules are displayed above.'
                )}
              </span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {isPlayableGame ? (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => setIsPlaying(true)}
                    id="modal-play-game-btn"
                  >
                    <Play size={15} strokeWidth={2.5} fill="#fff" />
                    <span>{t('play_game')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={handleClose}
                  >
                    {t('close')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleClose}
                >
                  {t('close')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
