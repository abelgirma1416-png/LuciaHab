import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { useLanguage } from '../../context/useLanguage';
import {
  RotateCcw,
  X,
  Zap,
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  Settings,
} from 'lucide-react';
import {
  createSessionQuestionSet,
  type GameQuestion,
  type MathDifficulty,
  type QuestionCountChoice,
  DIFFICULTY_CONFIGS,
  getBankCounts,
  calculateSessionTimer,
  getQuestionBankCount,
} from '../../services/mathQuestionService';

interface TurboMathGameProps {
  onExit: () => void;
}

type GameModeState = 'setup' | 'playing' | 'game_over';

/**
 * Calculates adaptive font size so mathematical formulas and equations
 * fit comfortably within the Phaser question container.
 */
function getAdaptiveFontSize(text: string): string {
  if (text.length > 80) return '15px';
  if (text.length > 50) return '18px';
  if (text.length > 28) return '21px';
  return '26px';
}

export const TurboMathGame: React.FC<TurboMathGameProps> = ({ onExit }) => {
  const { language, t } = useLanguage();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // Setup / Mode selection state
  const [gameState, setGameState] = useState<GameModeState>('setup');
  const [selectedDifficulty, setSelectedDifficulty] = useState<MathDifficulty>('easy');
  const [selectedCount, setSelectedCount] = useState<QuestionCountChoice>(20);

  // Session Question Set
  const [sessionQuestions, setSessionQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Live Metrics
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [stats, setStats] = useState({ totalAnswered: 0, correctCount: 0 });
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [isCompletedRun, setIsCompletedRun] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutable refs for tracking game state inside Phaser & Timer callbacks
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const timeLeftRef = useRef(60);
  const timerIntervalRef = useRef<number | null>(null);
  const sessionQuestionsRef = useRef<GameQuestion[]>([]);
  const currentIndexRef = useRef(0);
  const isGameOverRef = useRef(false);

  const bankCounts = getBankCounts();
  const totalQuestionsAll = getQuestionBankCount();

  // Start the game with the selected difficulty and question count
  const startGame = useCallback(() => {
    try {
      setErrorMessage(null);
      const questions = createSessionQuestionSet(selectedDifficulty, selectedCount);
      const totalTime = calculateSessionTimer(selectedDifficulty, selectedCount);

      sessionQuestionsRef.current = questions;
      currentIndexRef.current = 0;
      scoreRef.current = 0;
      streakRef.current = 0;
      timeLeftRef.current = totalTime;
      isGameOverRef.current = false;

      setSessionQuestions(questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setStreak(0);
      setTimeLeft(totalTime);
      setStats({ totalAnswered: 0, correctCount: 0 });
      setLastFeedback(null);
      setLastExplanation(null);
      setIsCompletedRun(false);

      setGameState('playing');
    } catch (err: any) {
      setErrorMessage(err.message || t('math_bank_empty_error'));
    }
  }, [selectedDifficulty, selectedCount, t]);

  const currentQuestion: GameQuestion | undefined = sessionQuestions[currentQuestionIndex];

  // Answer handler callable from HTML buttons
  const handleAnswer = useCallback(
    (selectedOption: string) => {
      if (isGameOverRef.current) return;
      const currentQ = sessionQuestionsRef.current[currentIndexRef.current];
      if (!currentQ) return;

      const isCorrect = String(selectedOption).trim() === String(currentQ.answer).trim();

      setStats((prev) => ({
        totalAnswered: prev.totalAnswered + 1,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      }));

      if (currentQ.explanation) {
        setLastExplanation(currentQ.explanation);
      }

      const diffConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

      if (isCorrect) {
        streakRef.current += 1;
        const streakMultiplier = Math.min(3, 1 + Math.floor(streakRef.current / 3) * 0.5);
        const pointsEarned = Math.round(diffConfig.basePoints * streakMultiplier);
        scoreRef.current += pointsEarned;

        setScore(scoreRef.current);
        setStreak(streakRef.current);
        setLastFeedback('correct');

        const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
        if (scene && (scene as any).onCorrectAnswer) {
          (scene as any).onCorrectAnswer(pointsEarned);
        }
      } else {
        streakRef.current = 0;
        setStreak(0);
        setLastFeedback('incorrect');

        const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
        if (scene && (scene as any).onIncorrectAnswer) {
          (scene as any).onIncorrectAnswer();
        }
      }

      // Brief feedback timeout before advancing question
      setTimeout(() => {
        setLastFeedback(null);
        if (isGameOverRef.current) return;

        const nextIdx = currentIndexRef.current + 1;
        if (nextIdx >= sessionQuestionsRef.current.length) {
          // Finished all questions in session!
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          isGameOverRef.current = true;
          setIsCompletedRun(true);
          setGameState('game_over');

          const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
          if (scene && (scene as any).triggerGameOver) {
            (scene as any).triggerGameOver(scoreRef.current, true);
          }
        } else {
          currentIndexRef.current = nextIdx;
          setCurrentQuestionIndex(nextIdx);
          const nextQ = sessionQuestionsRef.current[nextIdx];

          const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
          if (scene && (scene as any).updateQuestionDisplay) {
            (scene as any).updateQuestionDisplay(nextQ);
          }
        }
      }, 280);
    },
    [selectedDifficulty]
  );

  // Return to difficulty setup
  const returnToSetup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    isGameOverRef.current = false;
    setGameState('setup');
  }, []);

  // Setup Phaser Scene and Game lifecycle when playing
  useEffect(() => {
    if (gameState !== 'playing' || !gameContainerRef.current) return;

    class TurboMathScene extends Phaser.Scene {
      private questionTextObj?: Phaser.GameObjects.Text;
      private timerTextObj?: Phaser.GameObjects.Text;
      private scoreTextObj?: Phaser.GameObjects.Text;
      private topicTextObj?: Phaser.GameObjects.Text;

      constructor() {
        super({ key: 'TurboMathScene' });
      }

      create() {
        const { width, height } = this.scale;

        // Visual background gradient simulation using graphics
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x191032, 0x191032, 0x0c081e, 0x0c081e, 1);
        bgGraphics.fillRect(0, 0, width, height);

        // Grid lines overlay
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x9333ea, 0.12);
        for (let x = 0; x < width; x += 32) {
          gridGraphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 32) {
          gridGraphics.lineBetween(0, y, width, y);
        }

        // Header decorative glow banner
        const glowGraphics = this.add.graphics();
        glowGraphics.fillStyle(0x7c3aed, 0.2);
        glowGraphics.fillRoundedRect(16, 10, width - 32, 36, 12);
        glowGraphics.lineStyle(1, 0xa855f7, 0.4);
        glowGraphics.strokeRoundedRect(16, 10, width - 32, 36, 12);

        // Top bar text in Canvas
        this.scoreTextObj = this.add.text(28, 19, `XP: ${scoreRef.current}`, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          color: '#fbbf24',
          fontStyle: 'bold',
        });

        const activeQ = sessionQuestionsRef.current[currentIndexRef.current];
        const activeTopic = activeQ?.topic || 'Mathematics';
        this.topicTextObj = this.add.text(width / 2, 19, activeTopic, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '12px',
          color: '#d8b4fe',
          fontStyle: '600',
        }).setOrigin(0.5, 0);

        this.timerTextObj = this.add.text(width - 28, 19, `⏱ ${timeLeftRef.current}s`, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(1, 0);

        // Question display badge
        const questionBox = this.add.graphics();
        questionBox.fillStyle(0x241447, 0.9);
        questionBox.fillRoundedRect(16, 54, width - 32, 92, 14);
        questionBox.lineStyle(1.5, 0xc084fc, 0.55);
        questionBox.strokeRoundedRect(16, 54, width - 32, 92, 14);

        // Question formula with adaptive sizing & wrapping
        const qText = activeQ?.text || 'Math Challenge';
        const fontSize = getAdaptiveFontSize(qText);

        this.questionTextObj = this.add.text(width / 2, 100, qText, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize,
          color: '#ffffff',
          fontStyle: '700',
          align: 'center',
          wordWrap: { width: width - 52, useAdvancedWrap: true },
        }).setOrigin(0.5);

        // Pulse tween on question text
        this.tweens.add({
          targets: this.questionTextObj,
          scale: { from: 0.94, to: 1 },
          duration: 220,
          ease: 'Back.easeOut',
        });
      }

      updateQuestionDisplay(newQ: GameQuestion) {
        if (this.topicTextObj && newQ.topic) {
          this.topicTextObj.setText(newQ.topic);
        }
        if (this.questionTextObj) {
          this.questionTextObj.setFontSize(getAdaptiveFontSize(newQ.text));
          this.questionTextObj.setText(newQ.text);
          this.tweens.add({
            targets: this.questionTextObj,
            scale: { from: 0.88, to: 1 },
            duration: 180,
            ease: 'Back.easeOut',
          });
        }
      }

      updateTimerDisplay(remTime: number) {
        if (this.timerTextObj) {
          this.timerTextObj.setText(`⏱ ${remTime}s`);
          if (remTime <= 10) {
            this.timerTextObj.setColor('#f43f5e');
          } else {
            this.timerTextObj.setColor('#ffffff');
          }
        }
      }

      onCorrectAnswer(points: number) {
        if (this.scoreTextObj) {
          this.scoreTextObj.setText(`XP: ${scoreRef.current}`);
        }
        const popup = this.add.text(this.scale.width / 2, 80, `+${points} XP!`, {
          fontSize: '20px',
          fontFamily: 'system-ui, sans-serif',
          color: '#10b981',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: popup,
          y: 45,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => popup.destroy(),
        });
      }

      onIncorrectAnswer() {
        this.cameras.main.shake(180, 0.008);
      }

      triggerGameOver(finalScore: number, completed = false) {
        const { width, height } = this.scale;
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0a0618, 0.88);
        overlay.fillRect(0, 0, width, height);

        const bannerText = completed ? 'ROUND COMPLETE!' : 'TIME IS UP!';
        const bannerColor = completed ? '#34d399' : '#fbbf24';

        const banner = this.add.text(width / 2, height / 2 - 20, bannerText, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '24px',
          color: bannerColor,
          fontStyle: '900',
        }).setOrigin(0.5);

        const scoreBanner = this.add.text(width / 2, height / 2 + 16, `${finalScore} XP`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: [banner, scoreBanner],
          scale: { from: 0.7, to: 1 },
          duration: 300,
          ease: 'Back.easeOut',
        });
      }
    }

    // Phaser Configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: Math.min(480, gameContainerRef.current.clientWidth || 360),
      height: 160,
      backgroundColor: '#0c081e',
      transparent: false,
      scene: [TurboMathScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    // Start timer interval
    timerIntervalRef.current = window.setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
      if (scene && (scene as any).updateTimerDisplay) {
        (scene as any).updateTimerDisplay(timeLeftRef.current);
      }

      if (timeLeftRef.current <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        isGameOverRef.current = true;
        setGameState('game_over');

        const sceneGameOver = phaserGameRef.current?.scene.getScene('TurboMathScene');
        if (sceneGameOver && (sceneGameOver as any).triggerGameOver) {
          (sceneGameOver as any).triggerGameOver(scoreRef.current, false);
        }
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [gameState]);

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.correctCount / stats.totalAnswered) * 100)
    : 100;

  const currentDiffConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

  return (
    <div className="turbo-math-game-root" role="region" aria-label="Turbo Math Challenge Game">
      {/* Top Game Controls Bar */}
      <div className="turbo-game-top-bar">
        <div className="turbo-game-title-badge">
          <Zap size={16} strokeWidth={2.5} color="var(--accent-purple-light)" />
          <span className="turbo-title-text">
            {language === 'am' ? 'የቱርቦ ሒሳብ ፈተና' : 'Turbo Math Challenge'}
          </span>
          <span className="turbo-bank-badge" title="Verified questions in total local question bank">
            {totalQuestionsAll} Qs
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="turbo-exit-btn"
          aria-label={language === 'am' ? 'ከጨዋታ ውጣ' : 'Exit Game'}
          title={language === 'am' ? 'ውጣ' : 'Exit'}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* VIEW 1: DIFFICULTY & QUESTION COUNT SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="turbo-setup-card" role="region" aria-label="Game Setup">
          <div className="turbo-setup-header">
            <h2 className="turbo-setup-title">{t('math_difficulty_title')}</h2>
            <p className="turbo-setup-subtitle">{t('math_difficulty_subtitle')}</p>
          </div>

          {errorMessage && (
            <div className="turbo-setup-error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Difficulty Tier Selector Cards */}
          <div className="turbo-diff-selection-grid" role="radiogroup" aria-label="Select Difficulty Tier">
            {(['easy', 'medium', 'hard'] as MathDifficulty[]).map((diff) => {
              const cfg = DIFFICULTY_CONFIGS[diff];
              const isSelected = selectedDifficulty === diff;
              const qCount = bankCounts[diff];
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`turbo-diff-card ${diff} ${isSelected ? 'active' : ''}`}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <div className="diff-card-top">
                    <span className={`diff-badge-pill ${diff}`}>
                      {language === 'am' ? cfg.badgeAm : cfg.badgeEn}
                    </span>
                    <span className="diff-count-chip">{qCount} Qs</span>
                  </div>
                  <h3 className="diff-card-title">
                    {language === 'am' ? cfg.labelAm : cfg.labelEn}
                  </h3>
                  <p className="diff-card-desc">
                    {language === 'am' ? cfg.descriptionAm : cfg.descriptionEn}
                  </p>
                  <div className="diff-card-meta">
                    <span className="diff-meta-item">⚡ +{cfg.basePoints} XP</span>
                    <span className="diff-meta-item">⏱ ~{cfg.secondsPerQuestion}s/Q</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Question Count Selector */}
          <div className="turbo-qcount-panel">
            <span className="turbo-qcount-label">
              <Layers size={14} />
              <span>{t('math_qcount_title')}</span>
            </span>
            <div className="turbo-qcount-options" role="radiogroup" aria-label="Select Question Count">
              {([10, 20, 50] as QuestionCountChoice[]).map((count) => {
                const isSelected = selectedCount === count;
                const estSeconds = calculateSessionTimer(selectedDifficulty, count);
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSelectedCount(count)}
                    className={`turbo-qcount-btn ${isSelected ? 'active' : ''}`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className="qcount-num">{count} Qs</span>
                    <span className="qcount-time">⏱ {estSeconds}s</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Action Button */}
          <button
            type="button"
            onClick={startGame}
            className="btn-primary turbo-start-challenge-btn"
          >
            <Sparkles size={18} />
            <span>{t('math_start_challenge')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* VIEW 2: ACTIVE GAMEPLAY MODE */}
      {gameState === 'playing' && (
        <>
          {/* Live Metric HUD */}
          <div className="turbo-hud-row">
            <div className="turbo-hud-card score">
              <Trophy size={14} color="var(--accent-gold)" />
              <div className="hud-metric">
                <span className="hud-label">{language === 'am' ? 'ውጤት' : 'Score'}</span>
                <span className="hud-value">{score} XP</span>
              </div>
            </div>

            <div className={`turbo-hud-card timer ${timeLeft <= 10 ? 'danger-pulse' : ''}`}>
              <Timer size={14} color={timeLeft <= 10 ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
              <div className="hud-metric">
                <span className="hud-label">{language === 'am' ? 'የቀረ ሰዓት' : 'Time Left'}</span>
                <span className="hud-value">{timeLeft}s</span>
              </div>
            </div>

            <div className="turbo-hud-card streak">
              <Zap size={14} color="#f59e0b" />
              <div className="hud-metric">
                <span className="hud-label">{language === 'am' ? 'ተከታታይ' : 'Streak'}</span>
                <span className="hud-value">{streak}x</span>
              </div>
            </div>

            <div className="turbo-hud-card progress">
              <Layers size={14} color="var(--accent-purple-light)" />
              <div className="hud-metric">
                <span className="hud-label">{language === 'am' ? 'ሂደት' : 'Progress'}</span>
                <span className="hud-value">{currentQuestionIndex + 1}/{sessionQuestions.length}</span>
              </div>
            </div>
          </div>

          {/* Phaser Canvas Mount Container */}
          <div
            ref={gameContainerRef}
            className="turbo-phaser-container"
            aria-hidden="true"
          />

          {/* Accessible screen reader announcement */}
          <div className="sr-only" role="status" aria-live="polite">
            {currentQuestion?.text}
          </div>

          {/* Interactive Answer Grid */}
          <div className="turbo-interaction-panel">
            {/* Question topic & difficulty metadata badge */}
            {currentQuestion && (
              <div className="turbo-question-meta-bar">
                <span className={`meta-badge-diff ${currentQuestion.difficulty}`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
                <span className="meta-badge-dot">·</span>
                <span className="meta-badge-area">{currentQuestion.topic}</span>
                <span className="meta-badge-dot">·</span>
                <span className="meta-badge-qnum">
                  {t('math_question_progress')} {currentQuestionIndex + 1}/{sessionQuestions.length}
                </span>
              </div>
            )}

            {/* Answer Options Grid */}
            <div className="turbo-options-grid" role="group" aria-label="Answer options">
              {currentQuestion?.options.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  className={`turbo-option-btn option-${idx + 1}`}
                  aria-label={`Option ${String.fromCharCode(65 + idx)}: ${option}`}
                >
                  <span className="option-num-badge">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-value">{option}</span>
                </button>
              ))}
            </div>

            {/* Feedback Indicator */}
            <div className="turbo-feedback-indicator" role="status" aria-live="polite">
              {lastFeedback === 'correct' && (
                <span className="feedback-badge correct">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>{language === 'am' ? 'ትክክል! +XP' : 'Correct! +XP'}</span>
                </span>
              )}
              {lastFeedback === 'incorrect' && (
                <span className="feedback-badge incorrect">
                  <XCircle size={16} strokeWidth={2.5} />
                  <span>{language === 'am' ? 'ስህተት! ሞክሩ' : 'Incorrect! Try Next'}</span>
                </span>
              )}
              {!lastFeedback && (
                <span className="feedback-badge idle">
                  {language === 'am'
                    ? 'ትክክለኛውን መልስ ይጫኑ'
                    : 'Tap or click the correct answer'}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW 3: GAME OVER / CHALLENGE COMPLETE SUMMARY */}
      {gameState === 'game_over' && (
        <div className="turbo-game-over-card" role="dialog" aria-modal="true" aria-label="Game Over Summary">
          <div className="game-over-icon-glow">
            <Trophy size={36} color="var(--accent-gold)" />
          </div>

          <h3 className="game-over-title">
            {isCompletedRun
              ? (language === 'am' ? 'ፈተናው ተጠናቋል!' : 'Challenge Completed!')
              : (language === 'am' ? 'ጊዜው አልቋል!' : 'Time is Up!')}
          </h3>

          <div className="game-over-tier-pill">
            <span className={`diff-badge-pill ${selectedDifficulty}`}>
              {language === 'am' ? currentDiffConfig.badgeAm : currentDiffConfig.badgeEn}
            </span>
            <span className="tier-pill-count">{stats.totalAnswered} / {sessionQuestions.length} Qs</span>
          </div>

          <div className="game-over-stats-grid">
            <div className="stat-box">
              <span className="stat-title">{language === 'am' ? 'የመጨረሻ ውጤት' : 'Final Score'}</span>
              <span className="stat-num gold">{score} XP</span>
            </div>
            <div className="stat-box">
              <span className="stat-title">{language === 'am' ? 'ትክክለኛነት' : 'Accuracy'}</span>
              <span className="stat-num">{accuracy}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-title">{language === 'am' ? 'የተመለሱ ጥያቄዎች' : 'Total Answered'}</span>
              <span className="stat-num">{stats.totalAnswered}</span>
            </div>
          </div>

          {lastExplanation && (
            <div className="game-over-explanation-box">
              <div className="explanation-header">
                <BookOpen size={14} color="var(--accent-purple-light)" />
                <span>{language === 'am' ? 'የመጨረሻው ጥያቄ መፍትሔ' : 'Last Question Solution'}</span>
              </div>
              <p className="explanation-text">{lastExplanation}</p>
            </div>
          )}

          <p className="game-over-security-notice">
            🔒 {language === 'am'
              ? 'የውጤት ነጥቦች በሰርቨር ሲረጋገጡ በቀጥታ ወደ ዋናው የደረጃ ሰንጠረዥ ይተላለፋሉ።'
              : 'Points calculated locally. Official XP leaderboard sync occurs with server validation.'}
          </p>

          <div className="game-over-btn-row">
            <button
              type="button"
              onClick={startGame}
              className="btn-primary turbo-restart-btn"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              <span>{language === 'am' ? 'እንደገና ተጫወት' : 'Play Again'}</span>
            </button>

            <button
              type="button"
              onClick={returnToSetup}
              className="btn-secondary turbo-settings-btn"
              title={language === 'am' ? 'ደረጃ ቀይር' : 'Change Level'}
            >
              <Settings size={16} strokeWidth={2} />
              <span>{t('math_change_settings')}</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="btn-secondary turbo-finish-btn"
            >
              <X size={16} strokeWidth={2} />
              <span>{language === 'am' ? 'ውጣ' : 'Exit'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
