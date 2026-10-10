import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { useLanguage } from '../../context/useLanguage';
import {
  Brain,
  RotateCcw,
  X,
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  Flame,
  Sparkles,
  Award,
  HelpCircle,
} from 'lucide-react';
import type { TriviaQuestion } from '../../data/triviaQuestions';
import {
  TRIVIA_CATEGORY_LABELS,
  selectSessionQuestions,
} from '../../data/triviaQuestions';
import { fetchApprovedTriviaQuestions } from '../../services/triviaService';

interface EthiopianMindSprintGameProps {
  onExit: () => void;
}

interface AnswerHistoryItem {
  question: TriviaQuestion;
  selectedOptionIndex: number | null; // null if timed out
  isCorrect: boolean;
  pointsEarned: number;
}

export const EthiopianMindSprintGame: React.FC<EthiopianMindSprintGameProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // Session state
  const [sessionQuestions, setSessionQuestions] = useState<TriviaQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<AnswerHistoryItem[]>([]);

  // Refs for timer and synchronization with Phaser
  const timerIntervalRef = useRef<number | null>(null);
  const timeLeftRef = useRef(15);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const isAnsweredRef = useRef(false);
  const isGameOverRef = useRef(false);
  const currentIndexRef = useRef(0);
  const sessionQuestionsRef = useRef<TriviaQuestion[]>([]);

  const QUESTION_TIME_LIMIT = 15;
  const TOTAL_QUESTIONS = 10;

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Advance to next question or end game
  const advanceToNext = useCallback(() => {
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx >= sessionQuestionsRef.current.length || nextIdx >= TOTAL_QUESTIONS) {
      // Game Complete
      isGameOverRef.current = true;
      setIsGameOver(true);
      clearTimer();

      const scene = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
      if (scene && (scene as any).triggerGameComplete) {
        (scene as any).triggerGameComplete(scoreRef.current);
      }
      return;
    }

    currentIndexRef.current = nextIdx;
    setCurrentIndex(nextIdx);
    setSelectedOption(null);
    setIsAnswered(false);
    isAnsweredRef.current = false;
    timeLeftRef.current = QUESTION_TIME_LIMIT;
    setTimeLeft(QUESTION_TIME_LIMIT);

    // Update scene
    const scene = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
    if (scene && (scene as any).updateProgress) {
      (scene as any).updateProgress(nextIdx + 1, TOTAL_QUESTIONS);
      (scene as any).updateTimer(QUESTION_TIME_LIMIT);
    }

    // Start 15s timer for the next question
    clearTimer();
    timerIntervalRef.current = window.setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      const sc = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
      if (sc && (sc as any).updateTimer) {
        (sc as any).updateTimer(timeLeftRef.current);
      }

      if (timeLeftRef.current <= 0) {
        clearTimer();
        // Handle timeout
        handleOptionSelect(-1); // -1 signifies timeout
      }
    }, 1000);
  }, [clearTimer]);

  // Handle option selection or timeout
  const handleOptionSelect = useCallback(
    (optionIdx: number) => {
      if (isAnsweredRef.current || isGameOverRef.current) return;

      isAnsweredRef.current = true;
      setIsAnswered(true);
      setSelectedOption(optionIdx);
      clearTimer();

      const currentQ = sessionQuestionsRef.current[currentIndexRef.current];
      if (!currentQ) return;

      const isCorrect = optionIdx === currentQ.correctIndex;
      let pointsAwarded = 0;

      if (isCorrect) {
        streakRef.current += 1;
        setStreak(streakRef.current);
        setBestStreak((prev) => Math.max(prev, streakRef.current));

        // 100 base points + speed bonus (up to 50 pts based on remaining time) + streak bonus
        const speedBonus = Math.floor((timeLeftRef.current / QUESTION_TIME_LIMIT) * 50);
        const streakBonus = Math.min(50, (streakRef.current - 1) * 15);
        pointsAwarded = 100 + speedBonus + streakBonus;

        scoreRef.current += pointsAwarded;
        setScore(scoreRef.current);

        const scene = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
        if (scene && (scene as any).onCorrectAnswer) {
          (scene as any).onCorrectAnswer(pointsAwarded, scoreRef.current);
        }
      } else {
        streakRef.current = 0;
        setStreak(0);

        const scene = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
        if (scene && (scene as any).onIncorrectAnswer) {
          (scene as any).onIncorrectAnswer();
        }
      }

      // Record to history
      setHistory((prev) => [
        ...prev,
        {
          question: currentQ,
          selectedOptionIndex: optionIdx >= 0 ? optionIdx : null,
          isCorrect,
          pointsEarned: pointsAwarded,
        },
      ]);

      // Delay before moving to the next question so user can see correct answer & explanation
      setTimeout(() => {
        advanceToNext();
      }, 1600);
    },
    [advanceToNext, clearTimer]
  );

  // Start / Restart game
  const startNewSession = useCallback(async () => {
    clearTimer();
    setIsLoading(true);

    let questions: TriviaQuestion[] = [];
    try {
      const result = await fetchApprovedTriviaQuestions({ total: TOTAL_QUESTIONS });
      questions = result.questions.length > 0 ? result.questions : selectSessionQuestions(TOTAL_QUESTIONS);
    } catch {
      questions = selectSessionQuestions(TOTAL_QUESTIONS);
    } finally {
      setIsLoading(false);
    }

    sessionQuestionsRef.current = questions;
    setSessionQuestions(questions);

    currentIndexRef.current = 0;
    setCurrentIndex(0);

    scoreRef.current = 0;
    setScore(0);

    streakRef.current = 0;
    setStreak(0);
    setBestStreak(0);

    timeLeftRef.current = QUESTION_TIME_LIMIT;
    setTimeLeft(QUESTION_TIME_LIMIT);

    setSelectedOption(null);
    setIsAnswered(false);
    isAnsweredRef.current = false;

    isGameOverRef.current = false;
    setIsGameOver(false);
    setHistory([]);

    const scene = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
    if (scene && (scene as any).resetScene) {
      (scene as any).resetScene();
      (scene as any).updateProgress(1, TOTAL_QUESTIONS);
      (scene as any).updateTimer(QUESTION_TIME_LIMIT);
    }

    // Start question timer
    timerIntervalRef.current = window.setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      const sc = phaserGameRef.current?.scene.getScene('TriviaDecorativeScene');
      if (sc && (sc as any).updateTimer) {
        (sc as any).updateTimer(timeLeftRef.current);
      }

      if (timeLeftRef.current <= 0) {
        clearTimer();
        handleOptionSelect(-1);
      }
    }, 1000);
  }, [clearTimer, handleOptionSelect]);

  // Setup Phaser Scene
  useEffect(() => {
    if (!gameContainerRef.current) return;

    class TriviaDecorativeScene extends Phaser.Scene {
      private scoreTextObj?: Phaser.GameObjects.Text;
      private timerTextObj?: Phaser.GameObjects.Text;
      private progressTextObj?: Phaser.GameObjects.Text;

      constructor() {
        super({ key: 'TriviaDecorativeScene' });
      }

      create() {
        const { width, height } = this.scale;

        // Rich Ethiopian & Cosmic Gradient simulation
        const bg = this.add.graphics();
        // Deep purple to warm gold undertone
        bg.fillGradientStyle(0x130b29, 0x130b29, 0x1f143d, 0x1f143d, 1);
        bg.fillRect(0, 0, width, height);

        // Subtle geometric grid
        const grid = this.add.graphics();
        grid.lineStyle(1, 0xeab308, 0.08);
        for (let x = 0; x < width; x += 36) {
          grid.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 36) {
          grid.lineBetween(0, y, width, y);
        }

        // Animated ambient dust / star particles
        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 6;
        particleCanvas.height = 6;
        const ctx = particleCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(3, 3, 2, 0, Math.PI * 2);
          ctx.fill();
          if (!this.textures.exists('ambientStar')) {
            this.textures.addCanvas('ambientStar', particleCanvas);
          }
        }

        if (this.textures.exists('ambientStar')) {
          this.add.particles(0, 0, 'ambientStar', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            speedY: { min: -15, max: -5 },
            speedX: { min: -5, max: 5 },
            lifespan: 2500,
            scale: { start: 0.8, end: 0.1 },
            alpha: { start: 0.4, end: 0 },
            frequency: 180,
          });
        }

        // Header frame with golden border
        const headerCard = this.add.graphics();
        headerCard.fillStyle(0x28184d, 0.8);
        headerCard.fillRoundedRect(12, 10, width - 24, 46, 12);
        headerCard.lineStyle(1.2, 0xeab308, 0.45);
        headerCard.strokeRoundedRect(12, 10, width - 24, 46, 12);

        // Score display
        this.scoreTextObj = this.add.text(24, 23, `XP: ${scoreRef.current}`, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '15px',
          color: '#fbbf24',
          fontStyle: 'bold',
        });

        // Question Progress in Center
        this.progressTextObj = this.add.text(
          width / 2,
          23,
          `Q: ${currentIndexRef.current + 1} / ${TOTAL_QUESTIONS}`,
          {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            color: '#e2e8f0',
            fontStyle: '600',
          }
        ).setOrigin(0.5, 0);

        // Timer display at Right
        this.timerTextObj = this.add.text(
          width - 24,
          23,
          `⏱ ${QUESTION_TIME_LIMIT}s`,
          {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            color: '#ffffff',
            fontStyle: 'bold',
          }
        ).setOrigin(1, 0);

        // Bottom accent pulse bar
        const accentLine = this.add.graphics();
        accentLine.fillStyle(0xeab308, 0.35);
        accentLine.fillRoundedRect(width / 2 - 50, height - 8, 100, 3, 2);
      }

      updateProgress(current: number, total: number) {
        if (this.progressTextObj) {
          this.progressTextObj.setText(`Q: ${current} / ${total}`);
        }
      }

      updateTimer(rem: number) {
        if (this.timerTextObj) {
          this.timerTextObj.setText(`⏱ ${rem}s`);
          if (rem <= 5) {
            this.timerTextObj.setColor('#f43f5e');
          } else if (rem <= 10) {
            this.timerTextObj.setColor('#fbbf24');
          } else {
            this.timerTextObj.setColor('#ffffff');
          }
        }
      }

      onCorrectAnswer(pointsEarned: number, totalScore: number) {
        if (this.scoreTextObj) {
          this.scoreTextObj.setText(`XP: ${totalScore}`);
        }

        const { width } = this.scale;
        const popup = this.add.text(width / 2, 45, `+${pointsEarned} XP!`, {
          fontSize: '18px',
          fontFamily: 'system-ui, sans-serif',
          color: '#10b981',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: popup,
          y: 20,
          alpha: 0,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => popup.destroy(),
        });
      }

      onIncorrectAnswer() {
        this.cameras.main.shake(150, 0.007);
      }

      triggerGameComplete(finalScore: number) {
        const { width, height } = this.scale;
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0c071d, 0.88);
        overlay.fillRect(0, 0, width, height);

        const banner = this.add.text(width / 2, height / 2 - 12, 'SPRINT FINISHED', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          color: '#fbbf24',
          fontStyle: '900',
        }).setOrigin(0.5);

        const scoreSub = this.add.text(width / 2, height / 2 + 16, `${finalScore} XP EARNED`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: [banner, scoreSub],
          scale: { from: 0.8, to: 1 },
          duration: 350,
          ease: 'Back.easeOut',
        });
      }

      resetScene() {
        this.scene.restart();
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: Math.min(480, gameContainerRef.current.clientWidth || 360),
      height: 70, // Compact banner canvas providing ambient effects and live telemetry
      backgroundColor: '#130b29',
      transparent: false,
      scene: [TriviaDecorativeScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    // Initial session start
    startNewSession();

    return () => {
      clearTimer();
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [clearTimer, startNewSession]);

  const currentQuestion = sessionQuestions[currentIndex];
  const langKey = language === 'am' ? 'am' : 'en';

  const correctAnswersCount = history.filter((h) => h.isCorrect).length;
  const accuracy = history.length > 0 ? Math.round((correctAnswersCount / history.length) * 100) : 0;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="trivia-game-root" role="region" aria-label="Ethiopian Mind Sprint Trivia">
      {/* Top Header Bar */}
      <div className="trivia-game-top-bar">
        <div className="trivia-game-title-badge">
          <Brain size={17} strokeWidth={2.5} color="var(--accent-gold)" />
          <span className="trivia-title-text">
            {language === 'am' ? 'የኢትዮጵያ አዕምሮ ጥያቄና መልስ' : 'Ethiopian Mind Sprint'}
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="trivia-exit-btn"
          aria-label={language === 'am' ? 'ከጨዋታ ውጣ' : 'Exit Game'}
          title={language === 'am' ? 'ውጣ' : 'Exit'}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Phaser Canvas Container */}
      <div className="trivia-canvas-container" ref={gameContainerRef} />

      {/* Main Game Card View: Playing vs Results */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '12px' }}>
          <Sparkles size={28} color="var(--accent-gold)" style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {language === 'am' ? 'ጥያቄዎች እየተዘጋጁ ነው...' : 'Loading approved questions...'}
          </span>
        </div>
      ) : !isGameOver && currentQuestion ? (
        <div className="trivia-play-container">
          {/* Progress & Category Sub-bar */}
          <div className="trivia-sub-bar">
            <div className="trivia-cat-badge">
              <Sparkles size={13} color="var(--accent-gold)" />
              <span>{TRIVIA_CATEGORY_LABELS[currentQuestion.category][langKey]}</span>
            </div>

            <div className="trivia-meta-chips">
              {streak > 1 && (
                <div className="trivia-streak-chip">
                  <Flame size={12} color="#f97316" />
                  <span>{streak}x Streak</span>
                </div>
              )}
              <span className={`trivia-diff-pill ${currentQuestion.difficulty}`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Linear Timer Bar */}
          <div className="trivia-timer-track">
            <div
              className={`trivia-timer-fill ${timeLeft <= 5 ? 'critical' : ''}`}
              style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
            />
          </div>

          {/* Question Box */}
          <div className="trivia-question-card">
            <div className="trivia-q-num">
              {language === 'am' ? `ጥያቄ ${currentIndex + 1} ከ 10` : `Question ${currentIndex + 1} of 10`}
            </div>
            <h3 className="trivia-q-text">{currentQuestion.question[langKey]}</h3>
          </div>

          {/* 4 Options Grid */}
          <div className="trivia-options-grid">
            {currentQuestion.options[langKey].map((optionText, idx) => {
              let optionClass = 'trivia-option-btn';
              const isSelected = selectedOption === idx;
              const isCorrectTarget = idx === currentQuestion.correctIndex;

              if (isAnswered) {
                if (isCorrectTarget) {
                  optionClass += ' reveal-correct';
                } else if (isSelected && !isCorrectTarget) {
                  optionClass += ' selected-wrong';
                } else {
                  optionClass += ' disabled';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={optionClass}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  aria-pressed={isSelected}
                >
                  <span className="option-badge">{optionLetters[idx]}</span>
                  <span className="option-text">{optionText}</span>
                  {isAnswered && isCorrectTarget && (
                    <CheckCircle2 size={18} className="option-state-icon correct" />
                  )}
                  {isAnswered && isSelected && !isCorrectTarget && (
                    <XCircle size={18} className="option-state-icon wrong" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate Feedback Card & Explanation */}
          {isAnswered && (
            <div
              className={`trivia-explanation-card ${
                selectedOption === currentQuestion.correctIndex ? 'success' : 'alert'
              }`}
            >
              <div className="explanation-header">
                {selectedOption === currentQuestion.correctIndex ? (
                  <>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <span className="feedback-label">
                      {language === 'am' ? 'ትክክል ነው! ድንቅ ዕውቀት!' : 'Correct! Great job!'}
                    </span>
                  </>
                ) : selectedOption === null ? (
                  <>
                    <Timer size={16} color="var(--accent-rose)" />
                    <span className="feedback-label">
                      {language === 'am' ? 'ጊዜው አልቋል!' : "Time's up!"}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} color="var(--accent-rose)" />
                    <span className="feedback-label">
                      {language === 'am' ? 'ትክክል አይደለም' : 'Incorrect'}
                    </span>
                  </>
                )}
              </div>
              <p className="explanation-text">{currentQuestion.explanation[langKey]}</p>
            </div>
          )}
        </div>
      ) : isGameOver ? (
        /* Results View */
        <div className="trivia-results-view">
          <div className="trivia-results-banner">
            <div className="results-trophy-ring">
              <Award size={36} color="var(--accent-gold)" />
            </div>
            <h2 className="results-title">
              {language === 'am' ? 'የጥያቄና መልስ ፍልሚያ ተጠናቀቀ!' : 'Sprint Complete!'}
            </h2>
            <p className="results-subtitle">
              {language === 'am'
                ? 'የኢትዮጵያ ታሪክና ባህል ዕውቀትዎን በተሳካ ሁኔታ ፈትሸዋል!'
                : 'You have tested your knowledge of Ethiopian history, heritage, and culture!'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="trivia-stats-grid">
            <div className="stat-card gold">
              <Trophy size={16} color="var(--accent-gold)" />
              <div className="stat-value">{score} XP</div>
              <div className="stat-label">{language === 'am' ? 'የተገኘ ውጤት' : 'Total Score'}</div>
            </div>

            <div className="stat-card emerald">
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <div className="stat-value">{correctAnswersCount} / {TOTAL_QUESTIONS}</div>
              <div className="stat-label">{language === 'am' ? 'ትክክለኛ' : 'Correct'}</div>
            </div>

            <div className="stat-card purple">
              <Sparkles size={16} color="var(--accent-purple-light)" />
              <div className="stat-value">{accuracy}%</div>
              <div className="stat-label">{language === 'am' ? 'ትክክለኛነት' : 'Accuracy'}</div>
            </div>

            <div className="stat-card orange">
              <Flame size={16} color="#f97316" />
              <div className="stat-value">{bestStreak}</div>
              <div className="stat-label">{language === 'am' ? 'ምርጥ ተከታታይ' : 'Best Streak'}</div>
            </div>
          </div>

          {/* Question Review List */}
          <div className="trivia-review-card">
            <div className="review-title">
              <HelpCircle size={15} color="var(--text-muted)" />
              <span>{language === 'am' ? 'የጥያቄዎች ማጠቃለያ' : 'Question Breakdown'}</span>
            </div>
            <div className="review-list">
              {history.map((item, idx) => (
                <div key={idx} className={`review-item ${item.isCorrect ? 'pass' : 'fail'}`}>
                  <div className="review-icon">
                    {item.isCorrect ? (
                      <CheckCircle2 size={14} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={14} color="var(--accent-rose)" />
                    )}
                  </div>
                  <div className="review-content">
                    <div className="review-q">{item.question.question[langKey]}</div>
                    <div className="review-ans">
                      <span className="ans-label">
                        {language === 'am' ? 'መልስ፡' : 'Answer:'}
                      </span>{' '}
                      {item.question.options[langKey][item.question.correctIndex]}
                    </div>
                  </div>
                  <div className="review-points">
                    +{item.pointsEarned} XP
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="trivia-actions-row">
            <button
              type="button"
              className="btn-primary trivia-restart-btn"
              onClick={startNewSession}
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              <span>{language === 'am' ? 'እንደገና ተጫወት' : 'Play Again'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary trivia-exit-action-btn"
              onClick={onExit}
            >
              {language === 'am' ? 'ውጣ' : 'Exit to Lobby'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
