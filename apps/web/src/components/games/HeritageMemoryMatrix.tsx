import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { useLanguage } from '../../context/useLanguage';
import {
  Layers,
  RotateCcw,
  X,
  Trophy,
  Eye,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  Grid3x3,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Types & Constants
───────────────────────────────────────────── */
type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'difficulty_select' | 'memorise' | 'recall' | 'feedback' | 'results';

interface RoundResult {
  round: number;
  totalTiles: number;
  correctSelections: number;
  incorrectSelections: number;
  pointsEarned: number;
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { cols: number; rows: number; label: { en: string; am: string }; memoriseSec: number }
> = {
  easy: { cols: 3, rows: 3, memoriseSec: 3, label: { en: 'Easy (3×3)', am: 'ቀላል (3×3)' } },
  medium: { cols: 4, rows: 4, memoriseSec: 4, label: { en: 'Medium (4×4)', am: 'መካከለኛ (4×4)' } },
  hard: { cols: 5, rows: 5, memoriseSec: 5, label: { en: 'Hard (5×5)', am: 'ከባድ (5×5)' } },
};

const TOTAL_ROUNDS = 10;

/** Returns how many tiles to highlight for a given round & difficulty */
function patternSize(difficulty: Difficulty, round: number): number {
  const base = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  return Math.min(base + Math.floor(round / 3), difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12);
}

/** Build a random set of highlighted tile indices */
function buildPattern(totalTiles: number, count: number): Set<number> {
  const set = new Set<number>();
  while (set.size < count) {
    set.add(Math.floor(Math.random() * totalTiles));
  }
  return set;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface HeritageMemoryMatrixProps {
  onExit: () => void;
}

export const HeritageMemoryMatrix: React.FC<HeritageMemoryMatrixProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const phaserContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  /* ── Session state ─────────────────────────── */
  const [phase, setPhase] = useState<Phase>('difficulty_select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [memoriseCountdown, setMemoriseCountdown] = useState(0);

  /* Per-round state */
  const [pattern, setPattern] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [correctTiles, setCorrectTiles] = useState<Set<number>>(new Set());
  const [wrongTiles, setWrongTiles] = useState<Set<number>>(new Set());
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  /* Refs keeping live values accessible inside Phaser callbacks */
  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const roundRef = useRef(0);

  /* ── Derived values ────────────────────────── */
  const config = DIFFICULTY_CONFIG[difficulty];
  const totalTiles = config.cols * config.rows;

  /* ── Cleanup helpers ───────────────────────── */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const destroyPhaser = useCallback(() => {
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
  }, []);

  /* ── Phaser decorative banner (lifecycle safe) ─ */
  useEffect(() => {
    if (!phaserContainerRef.current) return;
    if (phaserGameRef.current) return; // guard against Strict Mode double-fire

    class MemoryBannerScene extends Phaser.Scene {
      private roundText?: Phaser.GameObjects.Text;
      private scoreText?: Phaser.GameObjects.Text;

      constructor() { super({ key: 'MemoryBannerScene' }); }

      create() {
        const { width, height } = this.scale;

        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0d0a1e, 0x0d0a1e, 0x162040, 0x162040, 1);
        bg.fillRect(0, 0, width, height);

        // Subtle blue grid
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x3b82f6, 0.1);
        for (let x = 0; x < width; x += 28) grid.lineBetween(x, 0, x, height);
        for (let y = 0; y < height; y += 28) grid.lineBetween(0, y, width, y);

        // Header pill
        const pill = this.add.graphics();
        pill.fillStyle(0x1e3a5f, 0.85);
        pill.fillRoundedRect(12, 10, width - 24, 44, 12);
        pill.lineStyle(1.2, 0x3b82f6, 0.5);
        pill.strokeRoundedRect(12, 10, width - 24, 44, 12);

        this.scoreText = this.add.text(26, 22, `XP: ${scoreRef.current}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#fbbf24',
          fontStyle: 'bold',
        });

        this.roundText = this.add.text(width - 26, 22, `Round: ${roundRef.current} / ${TOTAL_ROUNDS}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#f8fafc',
          fontStyle: '600',
        }).setOrigin(1, 0);

        // Floating hex particles (decorative)
        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 8; particleCanvas.height = 8;
        const ctx = particleCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(2, 0, 4, 8);
          ctx.fillRect(0, 2, 8, 4);
          if (!this.textures.exists('memTile')) {
            this.textures.addCanvas('memTile', particleCanvas);
          }
        }
        if (this.textures.exists('memTile')) {
          this.add.particles(0, 0, 'memTile', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            speedY: { min: -8, max: -3 },
            speedX: { min: -3, max: 3 },
            lifespan: 3000,
            scale: { start: 0.6, end: 0.05 },
            alpha: { start: 0.25, end: 0 },
            frequency: 220,
          });
        }
      }

      updateDisplay(newRound: number, newScore: number) {
        this.roundText?.setText(`Round: ${newRound} / ${TOTAL_ROUNDS}`);
        this.scoreText?.setText(`XP: ${newScore}`);
      }

      flashCorrect() { this.cameras.main.flash(200, 0, 200, 60, false); }
      flashWrong() { this.cameras.main.shake(180, 0.007); }
    }

    const cfg: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: phaserContainerRef.current,
      width: Math.min(480, phaserContainerRef.current.clientWidth || 360),
      height: 68,
      backgroundColor: '#0d0a1e',
      transparent: false,
      scene: [MemoryBannerScene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    };

    phaserGameRef.current = new Phaser.Game(cfg);

    return () => { destroyPhaser(); };
  }, [destroyPhaser]);

  /* Helper: push round / score updates to Phaser */
  const updatePhaserDisplay = useCallback((r: number, s: number) => {
    const scene = phaserGameRef.current?.scene.getScene('MemoryBannerScene');
    if (scene && (scene as any).updateDisplay) (scene as any).updateDisplay(r, s);
  }, []);

  /* ── Start a new session ───────────────────── */
  const startSession = useCallback((diff: Difficulty) => {
    clearTimer();
    setDifficulty(diff);
    scoreRef.current = 0;
    roundRef.current = 0;
    setScore(0);
    setRound(0);
    setRoundResults([]);
    setSelected(new Set());
    setCorrectTiles(new Set());
    setWrongTiles(new Set());
    updatePhaserDisplay(0, 0);

    // Start round 1 after a brief delay
    setTimeout(() => beginRound(1, diff), 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer, updatePhaserDisplay]);

  /* ── Begin a round ─────────────────────────── */
  const beginRound = useCallback((r: number, diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    const total = cfg.cols * cfg.rows;
    const patSize = patternSize(diff, r);
    const pat = buildPattern(total, patSize);

    roundRef.current = r;
    setRound(r);
    setPattern(pat);
    setSelected(new Set());
    setCorrectTiles(new Set());
    setWrongTiles(new Set());

    const memSec = cfg.memoriseSec;
    setMemoriseCountdown(memSec);
    setPhase('memorise');

    // Count down then switch to recall
    let remaining = memSec;
    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setMemoriseCountdown(remaining);
      if (remaining <= 0) {
        clearTimer();
        setPhase('recall');
      }
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer]);

  /* ── Tile tap during recall ─────────────────── */
  const handleTileClick = useCallback((idx: number) => {
    if (phase !== 'recall') return;
    setSelected(prev => {
      if (prev.has(idx)) return prev; // no duplicate scoring
      return new Set(prev).add(idx);
    });
  }, [phase]);

  /* ── Submit recall ──────────────────────────── */
  const submitRecall = useCallback(() => {
    if (phase !== 'recall') return;
    clearTimer();

    const correct = new Set<number>();
    const wrong = new Set<number>();

    selected.forEach(idx => {
      if (pattern.has(idx)) correct.add(idx);
      else wrong.add(idx);
    });

    // Missed tiles (in pattern but not selected) count as 0 — no penalty
    const hit = correct.size;
    const miss = pattern.size - hit; // tiles in pattern not selected
    const falsePositive = wrong.size;

    // Score: 30 pts per correct, −5 per false positive (floor 0 per round)
    const rawPoints = hit * 30 - falsePositive * 5;
    const pointsEarned = Math.max(0, rawPoints);

    scoreRef.current += pointsEarned;
    setScore(scoreRef.current);
    setCorrectTiles(correct);
    setWrongTiles(wrong);
    setPhase('feedback');

    // Phaser flash
    const scene = phaserGameRef.current?.scene.getScene('MemoryBannerScene');
    if (scene) {
      if (falsePositive === 0 && miss === 0 && hit === pattern.size) {
        (scene as any).flashCorrect?.();
      } else if (falsePositive > 0) {
        (scene as any).flashWrong?.();
      }
    }

    setRoundResults(prev => [...prev, {
      round: roundRef.current,
      totalTiles: pattern.size,
      correctSelections: hit,
      incorrectSelections: falsePositive,
      pointsEarned,
    }]);

    updatePhaserDisplay(roundRef.current, scoreRef.current);

    // Auto-advance after 1.5 s
    setTimeout(() => {
      const nextRound = roundRef.current + 1;
      if (nextRound > TOTAL_ROUNDS) {
        setPhase('results');
      } else {
        beginRound(nextRound, difficulty);
      }
    }, 1500);
  }, [phase, selected, pattern, clearTimer, updatePhaserDisplay, beginRound, difficulty]);

  /* ── Cleanup on unmount ─────────────────────── */
  useEffect(() => () => { clearTimer(); destroyPhaser(); }, [clearTimer, destroyPhaser]);

  /* ── Derived display values ─────────────────── */
  const totalCorrect = roundResults.reduce((s, r) => s + r.correctSelections, 0);
  const totalExpected = roundResults.reduce((s, r) => s + r.totalTiles, 0);
  const accuracy = totalExpected > 0 ? Math.round((totalCorrect / totalExpected) * 100) : 0;
  const perfectRounds = roundResults.filter(r => r.incorrectSelections === 0 && r.correctSelections === r.totalTiles).length;

  /* ── Render helpers ─────────────────────────── */
  const lang = language === 'am' ? 'am' : 'en';

  function getTileState(idx: number): 'default' | 'lit' | 'selected' | 'correct' | 'wrong' | 'missed' {
    if (phase === 'memorise') return pattern.has(idx) ? 'lit' : 'default';
    if (phase === 'recall') return selected.has(idx) ? 'selected' : 'default';
    if (phase === 'feedback') {
      if (correctTiles.has(idx)) return 'correct';
      if (wrongTiles.has(idx)) return 'wrong';
      if (pattern.has(idx) && !selected.has(idx)) return 'missed';
      return 'default';
    }
    return 'default';
  }

  const showGrid = phase === 'memorise' || phase === 'recall' || phase === 'feedback';

  return (
    <div className="memory-game-root" role="region" aria-label="Heritage Memory Matrix">
      {/* ── Top Bar ───────────────────────── */}
      <div className="memory-top-bar">
        <div className="memory-title-badge">
          <Layers size={17} strokeWidth={2.5} color="var(--accent-cyan)" />
          <span className="memory-title-text">
            {lang === 'am' ? 'የቅርስ ማስታወስ ማትሪክስ' : 'Heritage Memory Matrix'}
          </span>
        </div>
        <button
          type="button"
          className="memory-exit-btn"
          onClick={onExit}
          aria-label={lang === 'am' ? 'ከጨዋታ ውጣ' : 'Exit Game'}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Phaser Decorative Banner ──────── */}
      <div className="memory-canvas-container" ref={phaserContainerRef} />

      {/* ── Difficulty Selector ───────────── */}
      {phase === 'difficulty_select' && (
        <div className="memory-difficulty-screen">
          <div className="memory-diff-header">
            <Grid3x3 size={28} color="var(--accent-cyan)" />
            <h2 className="memory-diff-title">
              {lang === 'am' ? 'ደረጃ ይምረጡ' : 'Select Difficulty'}
            </h2>
            <p className="memory-diff-sub">
              {lang === 'am'
                ? 'ቅደም ተከተሉ ይታያል፤ ከዚያ ትክክለኛ ሳጥኖቹን ይምረጡ።'
                : 'A tile pattern will flash briefly — then you reproduce it from memory.'}
            </p>
          </div>
          <div className="memory-diff-cards">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  type="button"
                  className={`memory-diff-card ${d}`}
                  onClick={() => startSession(d)}
                >
                  <span className="diff-card-grid-preview">
                    {Array.from({ length: cfg.cols * cfg.rows }, (_, i) => (
                      <span key={i} className={`diff-preview-tile ${i < patternSize(d, 1) ? 'lit' : ''}`} />
                    ))}
                  </span>
                  <span className="diff-card-label">{cfg.label[lang]}</span>
                  <span className="diff-card-meta">
                    {lang === 'am'
                      ? `${patternSize(d, 1)}–${patternSize(d, TOTAL_ROUNDS)} ሳጥን · ${cfg.memoriseSec}ሰ ማስታወሻ`
                      : `${patternSize(d, 1)}–${patternSize(d, TOTAL_ROUNDS)} tiles · ${cfg.memoriseSec}s to memorise`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="memory-rules-note">
            {lang === 'am'
              ? `${TOTAL_ROUNDS} ዙሮች · ትክክለኛ ሳጥን 30 XP · ስህተት −5 XP`
              : `${TOTAL_ROUNDS} rounds · 30 XP per correct tile · −5 XP per false tap`}
          </p>
        </div>
      )}

      {/* ── Live HUD (during play) ────────── */}
      {showGrid && (
        <div className="memory-hud">
          <div className="memory-hud-pill">
            <Trophy size={13} color="var(--accent-gold)" />
            <span>{score} XP</span>
          </div>
          <div className="memory-hud-pill round">
            <span>{lang === 'am' ? `ዙር ${round}/${TOTAL_ROUNDS}` : `Round ${round}/${TOTAL_ROUNDS}`}</span>
          </div>
          <div className="memory-hud-pill phase">
            {phase === 'memorise' ? (
              <>
                <Eye size={13} color="var(--accent-cyan)" />
                <span className="memory-memorise-count">{memoriseCountdown}s</span>
              </>
            ) : phase === 'recall' ? (
              <span style={{ color: 'var(--accent-purple-light)', fontWeight: 700 }}>
                {lang === 'am' ? 'ይምረጡ' : 'Select'}
              </span>
            ) : (
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {lang === 'am' ? 'ውጤት' : 'Result'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Phase label ───────────────────── */}
      {showGrid && (
        <div className="memory-phase-label">
          {phase === 'memorise' && (
            <span className="memory-phase-tag memorise">
              <Eye size={14} />
              {lang === 'am' ? 'ቅደም ተከተሉን አስታውሱ' : 'Memorise the pattern'}
            </span>
          )}
          {phase === 'recall' && (
            <span className="memory-phase-tag recall">
              {lang === 'am' ? 'የሚያስታውሷቸውን ሳጥኖች ይምረጡ' : 'Tap the tiles you remember'}
            </span>
          )}
          {phase === 'feedback' && (
            <span className="memory-phase-tag feedback">
              {correctTiles.size === pattern.size && wrongTiles.size === 0
                ? (lang === 'am' ? '✓ ሙሉ በሙሉ ትክክል!' : '✓ Perfect!')
                : (lang === 'am' ? 'ያዩትን ያህል ትክክለኛ ነዎት' : 'Here is how you did')}
            </span>
          )}
        </div>
      )}

      {/* ── Tile Grid ─────────────────────── */}
      {showGrid && (
        <div
          className="memory-grid-wrapper"
          style={{ '--cols': config.cols } as React.CSSProperties}
        >
          {Array.from({ length: totalTiles }, (_, idx) => {
            const state = getTileState(idx);
            return (
              <button
                key={idx}
                type="button"
                className={`memory-tile tile-${state}`}
                onClick={() => handleTileClick(idx)}
                disabled={phase !== 'recall'}
                aria-pressed={selected.has(idx)}
                aria-label={`Tile ${idx + 1}`}
              >
                {state === 'correct' && <CheckCircle2 size={18} className="tile-icon" />}
                {state === 'wrong' && <XCircle size={18} className="tile-icon" />}
                {state === 'missed' && <span className="tile-missed-dot" />}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Submit Button ─────────────────── */}
      {phase === 'recall' && selected.size > 0 && (
        <button
          type="button"
          className="btn-primary memory-submit-btn"
          onClick={submitRecall}
        >
          {lang === 'am' ? 'ምርጫዬን አረጋግጥ' : 'Confirm Selection'}
        </button>
      )}

      {/* ── Results Screen ────────────────── */}
      {phase === 'results' && (
        <div className="memory-results-view">
          <div className="memory-results-banner">
            <div className="memory-trophy-ring">
              <Award size={36} color="var(--accent-cyan)" />
            </div>
            <h2 className="memory-results-title">
              {lang === 'am' ? 'ጨዋታው ተጠናቀቀ!' : 'Session Complete!'}
            </h2>
            <p className="memory-results-sub">
              {lang === 'am'
                ? 'የቅርስ ማትሪክስ ፈተናዎን አጠናቅቀዋል!'
                : 'You completed all Heritage Memory Matrix rounds!'}
            </p>
          </div>

          <div className="memory-stats-grid">
            <div className="memory-stat-card cyan">
              <Trophy size={16} color="var(--accent-cyan)" />
              <div className="memory-stat-value">{score} XP</div>
              <div className="memory-stat-label">{lang === 'am' ? 'ጠቅላላ ነጥብ' : 'Total Score'}</div>
            </div>
            <div className="memory-stat-card gold">
              <CheckCircle2 size={16} color="var(--accent-gold)" />
              <div className="memory-stat-value">{accuracy}%</div>
              <div className="memory-stat-label">{lang === 'am' ? 'ትክክለኛነት' : 'Accuracy'}</div>
            </div>
            <div className="memory-stat-card emerald">
              <Flame size={16} color="var(--accent-emerald)" />
              <div className="memory-stat-value">{perfectRounds}</div>
              <div className="memory-stat-label">{lang === 'am' ? 'ሙሉ ዙሮች' : 'Perfect Rounds'}</div>
            </div>
            <div className="memory-stat-card purple">
              <Grid3x3 size={16} color="var(--accent-purple-light)" />
              <div className="memory-stat-value">{TOTAL_ROUNDS}</div>
              <div className="memory-stat-label">{lang === 'am' ? 'ዙሮች' : 'Rounds'}</div>
            </div>
          </div>

          {/* Per-round breakdown */}
          <div className="memory-round-log">
            <div className="memory-round-log-header">
              {lang === 'am' ? 'ዙሮች ዝርዝር' : 'Round Breakdown'}
            </div>
            <div className="memory-round-list">
              {roundResults.map((r) => {
                const isPerfect = r.incorrectSelections === 0 && r.correctSelections === r.totalTiles;
                return (
                  <div key={r.round} className={`memory-round-item ${isPerfect ? 'perfect' : r.incorrectSelections > 0 ? 'error' : 'partial'}`}>
                    <span className="round-num">R{r.round}</span>
                    <span className="round-stats">
                      {r.correctSelections}/{r.totalTiles}
                      {r.incorrectSelections > 0 ? ` (−${r.incorrectSelections})` : ''}
                    </span>
                    <span className="round-xp">+{r.pointsEarned} XP</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="memory-actions-row">
            <button
              type="button"
              className="btn-primary memory-restart-btn"
              onClick={() => setPhase('difficulty_select')}
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              <span>{lang === 'am' ? 'እንደገና ተጫወት' : 'Play Again'}</span>
            </button>
            <button type="button" className="btn-secondary memory-exit-action-btn" onClick={onExit}>
              {lang === 'am' ? 'ውጣ' : 'Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
