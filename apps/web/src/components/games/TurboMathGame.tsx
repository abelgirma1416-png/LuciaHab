import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { useLanguage } from '../../context/useLanguage';
import { RotateCcw, X, Zap, Trophy, Timer, CheckCircle2, XCircle } from 'lucide-react';

interface TurboMathGameProps {
  onExit: () => void;
}

interface Question {
  text: string;
  options: number[];
  answer: number;
}

export const TurboMathGame: React.FC<TurboMathGameProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // React state mirroring game metrics for accessible and transparent display
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [stats, setStats] = useState({ totalAnswered: 0, correctCount: 0 });

  // Refs for tracking mutable game state accessed inside Phaser event handlers
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const timeLeftRef = useRef(60);
  const timerIntervalRef = useRef<number | null>(null);
  const currentQuestionRef = useRef<Question | null>(null);
  const isGameOverRef = useRef(false);

  // Generate unique math problem with 4 distinct choices
  const generateQuestion = useCallback((): Question => {
    const types = ['add', 'subtract', 'multiply'];
    // Increase difficulty progressively
    const difficultyLevel = Math.min(3, Math.floor(scoreRef.current / 200) + 1);
    const chosenType = types[Math.floor(Math.random() * (difficultyLevel === 1 ? 2 : 3))];

    let num1 = 1;
    let num2 = 1;
    let answer = 0;
    let text = '';

    if (chosenType === 'add') {
      const maxVal = difficultyLevel === 1 ? 20 : difficultyLevel === 2 ? 50 : 100;
      num1 = Math.floor(Math.random() * maxVal) + 2;
      num2 = Math.floor(Math.random() * maxVal) + 2;
      answer = num1 + num2;
      text = `${num1} + ${num2} = ?`;
    } else if (chosenType === 'subtract') {
      const maxVal = difficultyLevel === 1 ? 30 : difficultyLevel === 2 ? 60 : 120;
      num1 = Math.floor(Math.random() * maxVal) + 10;
      num2 = Math.floor(Math.random() * (num1 - 2)) + 1; // Keep result positive
      answer = num1 - num2;
      text = `${num1} - ${num2} = ?`;
    } else {
      // Multiplication
      const maxFactor = difficultyLevel <= 2 ? 9 : 12;
      num1 = Math.floor(Math.random() * maxFactor) + 2;
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = num1 * num2;
      text = `${num1} × ${num2} = ?`;
    }

    // Generate 3 unique wrong options
    const optionsSet = new Set<number>([answer]);
    const deltas = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10];

    while (optionsSet.size < 4) {
      const delta = deltas[Math.floor(Math.random() * deltas.length)];
      const candidate = answer + delta;
      if (candidate >= 0 && !optionsSet.has(candidate)) {
        optionsSet.add(candidate);
      } else {
        const randomNum = Math.floor(Math.random() * (answer + 15)) + 1;
        if (randomNum !== answer && !optionsSet.has(randomNum)) {
          optionsSet.add(randomNum);
        }
      }
    }

    // Shuffle options
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return { text, options, answer };
  }, []);

  // Answer handler callable from both HTML buttons and Phaser canvas
  const handleAnswer = useCallback((selectedOption: number) => {
    if (isGameOverRef.current || !currentQuestionRef.current) return;

    const isCorrect = selectedOption === currentQuestionRef.current.answer;

    setStats((prev) => ({
      totalAnswered: prev.totalAnswered + 1,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
    }));

    if (isCorrect) {
      streakRef.current += 1;
      const streakMultiplier = Math.min(3, 1 + Math.floor(streakRef.current / 3) * 0.5);
      const pointsEarned = Math.round(50 * streakMultiplier);
      scoreRef.current += pointsEarned;

      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setLastFeedback('correct');

      // Trigger scene particle effect/pulse if available
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

    // Brief timeout to clear feedback icon and generate next question
    setTimeout(() => {
      setLastFeedback(null);
      if (!isGameOverRef.current) {
        const nextQ = generateQuestion();
        currentQuestionRef.current = nextQ;
        setCurrentQuestion(nextQ);

        const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
        if (scene && (scene as any).updateQuestionDisplay) {
          (scene as any).updateQuestionDisplay(nextQ);
        }
      }
    }, 280);
  }, [generateQuestion]);

  // Restart game cleanly
  const restartGame = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    scoreRef.current = 0;
    streakRef.current = 0;
    timeLeftRef.current = 60;
    isGameOverRef.current = false;

    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setLastFeedback(null);
    setStats({ totalAnswered: 0, correctCount: 0 });

    const q = generateQuestion();
    currentQuestionRef.current = q;
    setCurrentQuestion(q);

    // Start 60-second timer countdown
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
        setIsGameOver(true);

        const sceneGameOver = phaserGameRef.current?.scene.getScene('TurboMathScene');
        if (sceneGameOver && (sceneGameOver as any).triggerGameOver) {
          (sceneGameOver as any).triggerGameOver(scoreRef.current);
        }
      }
    }, 1000);

    const scene = phaserGameRef.current?.scene.getScene('TurboMathScene');
    if (scene && (scene as any).resetGameDisplay) {
      (scene as any).resetGameDisplay(q);
    }
  }, [generateQuestion]);

  // Setup Phaser Scene and Game lifecycle
  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Custom Phaser Scene
    class TurboMathScene extends Phaser.Scene {
      private questionTextObj?: Phaser.GameObjects.Text;
      private timerTextObj?: Phaser.GameObjects.Text;
      private scoreTextObj?: Phaser.GameObjects.Text;

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
        glowGraphics.fillRoundedRect(16, 12, width - 32, 38, 12);
        glowGraphics.lineStyle(1, 0xa855f7, 0.4);
        glowGraphics.strokeRoundedRect(16, 12, width - 32, 38, 12);

        // Top bar text in Canvas
        this.scoreTextObj = this.add.text(28, 22, `XP: ${scoreRef.current}`, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: '#fbbf24',
          fontStyle: 'bold',
        });

        this.timerTextObj = this.add.text(width - 28, 22, `⏱ 60s`, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(1, 0);

        // Question display badge
        const questionBox = this.add.graphics();
        questionBox.fillStyle(0x241447, 0.9);
        questionBox.fillRoundedRect(20, 64, width - 40, 76, 14);
        questionBox.lineStyle(1.5, 0xc084fc, 0.55);
        questionBox.strokeRoundedRect(20, 64, width - 40, 76, 14);

        // Question formula
        const qText = currentQuestionRef.current?.text || '7 + 5 = ?';
        this.questionTextObj = this.add.text(width / 2, 102, qText, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '32px',
          color: '#ffffff',
          fontStyle: '800',
        }).setOrigin(0.5);

        // Pulse tween on question text
        this.tweens.add({
          targets: this.questionTextObj,
          scale: { from: 0.94, to: 1 },
          duration: 220,
          ease: 'Back.easeOut',
        });
      }

      updateQuestionDisplay(newQ: Question) {
        if (this.questionTextObj) {
          this.questionTextObj.setText(newQ.text);
          this.tweens.add({
            targets: this.questionTextObj,
            scale: { from: 0.85, to: 1 },
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
        // Floating point popup in canvas
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

      triggerGameOver(finalScore: number) {
        const { width, height } = this.scale;
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0a0618, 0.82);
        overlay.fillRect(0, 0, width, height);

        const banner = this.add.text(width / 2, height / 2 - 20, 'GAME OVER', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '28px',
          color: '#fbbf24',
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

      resetGameDisplay(newQ: Question) {
        this.scene.restart();
        this.events.once('create', () => {
          this.updateQuestionDisplay(newQ);
        });
      }
    }

    // Phaser 4 Configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: Math.min(480, gameContainerRef.current.clientWidth || 360),
      height: 155, // Compact canvas view rendering header & question badge
      backgroundColor: '#0c081e',
      transparent: false,
      scene: [TurboMathScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
    };

    // Instantiate Phaser
    phaserGameRef.current = new Phaser.Game(config);

    // Initial question and timer start
    restartGame();

    // Cleanup on component unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [restartGame]);

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.correctCount / stats.totalAnswered) * 100)
    : 100;

  return (
    <div className="turbo-math-game-root" role="region" aria-label="Turbo Math Challenge Game">
      {/* Top Game Controls Bar */}
      <div className="turbo-game-top-bar">
        <div className="turbo-game-title-badge">
          <Zap size={16} strokeWidth={2.5} color="var(--accent-purple-light)" />
          <span className="turbo-title-text">
            {language === 'am' ? 'የቱርቦ ሒሳብ ፈተና' : 'Turbo Math Challenge'}
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
      </div>

      {/* Phaser Canvas Mount Container */}
      <div
        ref={gameContainerRef}
        className="turbo-phaser-container"
        aria-hidden="true"
      />

      {/* Interactive Answer Grid or Game-Over Screen */}
      {!isGameOver ? (
        <div className="turbo-interaction-panel">
          {/* Answer Options Grid */}
          <div className="turbo-options-grid" role="group" aria-label="Answer options">
            {currentQuestion?.options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(option)}
                className={`turbo-option-btn option-${idx + 1}`}
                aria-label={`Option ${idx + 1}: ${option}`}
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
      ) : (
        /* Game Over Dialog Card */
        <div className="turbo-game-over-card" role="dialog" aria-modal="true" aria-label="Game Over Summary">
          <div className="game-over-icon-glow">
            <Trophy size={36} color="var(--accent-gold)" />
          </div>

          <h3 className="game-over-title">
            {language === 'am' ? 'ጊዜው አልቋል!' : 'Time is Up!'}
          </h3>

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

          <p className="game-over-security-notice">
            🔒 {language === 'am'
              ? 'የውጤት ነጥቦች በሰርቨር ሲረጋገጡ በቀጥታ ወደ ዋናው የደረጃ ሰንጠረዥ ይተላለፋሉ።'
              : 'Points calculated locally. Official XP leaderboard sync occurs with server validation.'}
          </p>

          <div className="game-over-btn-row">
            <button
              type="button"
              onClick={restartGame}
              className="btn-primary turbo-restart-btn"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              <span>{language === 'am' ? 'እንደገና ተጫወት' : 'Play Again'}</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="btn-secondary turbo-finish-btn"
            >
              <X size={16} strokeWidth={2} />
              <span>{language === 'am' ? 'ጨርስና ውጣ' : 'Return to Catalog'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
