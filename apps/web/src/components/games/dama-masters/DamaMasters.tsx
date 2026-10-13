import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  Trophy,
  Users,
  Bot,
  Swords,
  ShieldAlert,
  Play,
  RotateCw,
  Sparkles,
  Award,
  Crown,
} from 'lucide-react';
import { useLanguage } from '../../../context/useLanguage';
import type {
  AIDifficulty,
  CheckersGameState,
  GameMode,
  Move,
  PieceColor,
  Position,
} from './types';
import {
  createInitialGameState,
  getAllLegalMoves,
  getLegalMovesForSelection,
  makeMove,
} from './checkersEngine';
import { getAiMoveAsync } from './checkersAI';
import { playCheckersSound } from './checkersAudio';
import { CheckersBoard } from './CheckersBoard';
import './damaMasters.css';

interface DamaMastersProps {
  onExit: () => void;
}

const UI_TEXT = {
  title: { en: 'Dama Masters', am: 'ዳማ ማስተርስ' },
  subtitle: {
    en: 'English & American Checkers Strategy Hub',
    am: 'የአሜሪካንና የእንግሊዝ መደበኛ የዳማ ስልት ጨዋታ',
  },
  vsAi: { en: 'Play Against AI', am: 'ከAI ጋር ተጫወት' },
  twoPlayer: { en: 'Local Two-Player', am: 'ሁለት ተጫዋቾች (በአንድ ስልክ)' },
  easy: { en: 'Easy', am: 'ቀላል' },
  medium: { en: 'Medium', am: 'መካከለኛ' },
  hard: { en: 'Hard', am: 'ከባድ' },
  redColor: { en: 'Red (Moves First)', am: 'ቀይ (ቀድሞ የሚጀምር)' },
  blackColor: { en: 'Black (Moves Second)', am: 'ጥቁር (ሁለተኛ የሚንቀሳቀስ)' },
  startGame: { en: 'Start Game', am: 'ጨዋታ ጀምር' },
  yourTurn: { en: 'Your Turn', am: 'የእርስዎ ተራ' },
  aiThinking: { en: 'AI is thinking...', am: 'AI እያሰበ ነው...' },
  redTurn: { en: 'Red’s Turn', am: 'የቀይ ተራ' },
  blackTurn: { en: 'Black’s Turn', am: 'የጥቁር ተራ' },
  mandatoryCapture: { en: 'Mandatory Capture!', am: 'መያዝ ግዴታ ነው!' },
  continueJump: { en: 'Must Continue Multi-Jump!', am: 'ተከታታይ ዝላይዎን ይቀጥሉ!' },
  piecesRemaining: { en: 'Pieces Remaining', am: 'የቀሩ ጠጠሮች' },
  piecesCaptured: { en: 'Captured', am: 'የተያዙ' },
  restart: { en: 'Restart', am: 'እንደገና ጀምር' },
  rules: { en: 'Rules', am: 'ህጎች' },
  soundOn: { en: 'Sound On', am: 'ድምፅ በርቷል' },
  soundOff: { en: 'Sound Off', am: 'ድምፅ ጠፍቷል' },
  exit: { en: 'Exit Game', am: 'ከጨዋታ ውጣ' },
  playAgain: { en: 'Play Again', am: 'እንደገና ተጫወት' },
  returnMenu: { en: 'Game Menu', am: 'ወደ መነሻ ተመለስ' },
  xpEarned: { en: 'XP Points Earned', am: 'ያገኙት የXP ነጥብ' },
  pointsNotice: {
    en: 'Points calculated locally. Official XP leaderboard sync occurs with server validation.',
    am: 'ነጥቦች በአካባቢው ተሰልተዋል። ይፋዊ የደረጃ ሰንጠረዥ ማመሳሰል በሰርቨር ማረጋገጫ ይከናወናል።',
  },
  confirmRestartTitle: { en: 'Restart Current Match?', am: 'ይህን ጨዋታ እንደገና መጀመር ይፈልጋሉ?' },
  confirmRestartDesc: {
    en: 'Your active board state and moves will be reset.',
    am: 'ያለቀው ግስጋሴ ይጠፋል፤ ሰሌዳው ከአዲስ ይጀምራል።',
  },
  confirmYes: { en: 'Yes, Restart', am: 'አዎ፣ እንደገና ጀምር' },
  confirmCancel: { en: 'Cancel', am: 'ይቅር' },
  rulesTitle: { en: 'Dama Masters Official Rules', am: 'የዳማ ማስተርስ መደበኛ ህጎች' },
};

export const DamaMasters: React.FC<DamaMastersProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const lang = language === 'am' ? 'am' : 'en';

  // Game configuration setup
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [humanColor, setHumanColor] = useState<PieceColor>('red');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Core Game State
  const [gameState, setGameState] = useState<CheckersGameState>(() =>
    createInitialGameState()
  );
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Modals & confirmation dialogs
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Session ID to safely prevent stale AI moves from executing after restart/exit
  const sessionIdRef = useRef<number>(0);
  // Track whether points have been awarded for this finished match
  const hasAwardedPointsRef = useRef<boolean>(false);
  const [awardedXp, setAwardedXp] = useState<number>(0);

  // Animation states
  const [animatingMove, setAnimatingMove] = useState<{
    from: Position;
    to: Position;
    deltaRow: number;
    deltaCol: number;
  } | null>(null);
  const [capturedPos, setCapturedPos] = useState<Position | null>(null);
  const [crowningPos, setCrowningPos] = useState<Position | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animTimerRef = useRef<number | null>(null);

  // Clean up animation timers on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) {
        window.clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  // Check if mandatory capture is available on board
  const allCurrentLegalMoves = useMemo(() => {
    return getAllLegalMoves(
      gameState.board,
      gameState.currentTurn,
      gameState.activeJumpPos
    );
  }, [gameState.board, gameState.currentTurn, gameState.activeJumpPos]);

  const hasMandatoryCapture = useMemo(() => {
    return allCurrentLegalMoves.some((m) => m.isCapture);
  }, [allCurrentLegalMoves]);

  // Selected piece's legal moves
  const legalMovesForSelected = useMemo(() => {
    if (!gameState.selectedPos) return [];
    return getLegalMovesForSelection(
      gameState.board,
      gameState.selectedPos,
      gameState.currentTurn,
      gameState.activeJumpPos
    );
  }, [
    gameState.board,
    gameState.selectedPos,
    gameState.currentTurn,
    gameState.activeJumpPos,
  ]);

  // Handle Game Over point scoring safely
  useEffect(() => {
    if (gameState.isGameOver && gameState.result && !hasAwardedPointsRef.current) {
      hasAwardedPointsRef.current = true;

      // Only award victory points if player won vs AI (no self-farming in 2-player)
      let xp = 0;
      if (gameMode === 'vs_ai' && gameState.result.winner === humanColor) {
        if (difficulty === 'easy') xp = 150;
        else if (difficulty === 'medium') xp = 250;
        else if (difficulty === 'hard') xp = 400;
        playCheckersSound('victory', soundEnabled);
      } else if (gameMode === 'vs_ai' && gameState.result.winner !== humanColor && gameState.result.winner !== 'draw') {
        playCheckersSound('defeat', soundEnabled);
      } else {
        playCheckersSound('move', soundEnabled);
      }
      setAwardedXp(xp);
    }
  }, [gameState.isGameOver, gameState.result, gameMode, humanColor, difficulty, soundEnabled]);

  // AI execution ref for recursive multi-jumps without self-reference warnings
  const triggerAiTurnRef = useRef<(st: CheckersGameState) => Promise<void>>(() => Promise.resolve());

  // Smooth animated move executor
  const executeCheckersMoveWithAnimation = useCallback(
    (
      currentState: CheckersGameState,
      move: Move,
      onComplete?: (nextState: CheckersGameState) => void
    ) => {
      setIsAnimating(true);
      const isFlipped = gameMode === 'vs_ai' && humanColor === 'black';
      // Visual deltas based on row/col display orientation
      const deltaRow = isFlipped ? move.from.r - move.to.r : move.to.r - move.from.r;
      const deltaCol = isFlipped ? move.from.c - move.to.c : move.to.c - move.from.c;

      setAnimatingMove({
        from: move.from,
        to: move.to,
        deltaRow,
        deltaCol,
      });

      if (move.isCapture && move.capturedPos) {
        setCapturedPos(move.capturedPos);
      }

      // Audio feedback
      if (move.promotes) {
        playCheckersSound('crown', soundEnabled);
      } else if (move.isCapture) {
        playCheckersSound('capture', soundEnabled);
      } else {
        playCheckersSound('move', soundEnabled);
      }

      animTimerRef.current = window.setTimeout(() => {
        const nextState = makeMove(currentState, move);
        setAnimatingMove(null);
        setCapturedPos(null);

        // If crowning, celebrate with gold crown elevation
        if (move.promotes) {
          setCrowningPos(move.to);
          setGameState(nextState);
          animTimerRef.current = window.setTimeout(() => {
            setCrowningPos(null);
            setIsAnimating(false);
            onComplete?.(nextState);
          }, 320);
        } else {
          setIsAnimating(false);
          setGameState(nextState);
          onComplete?.(nextState);
        }
      }, 170);
    },
    [gameMode, humanColor, soundEnabled]
  );

  // Trigger AI move if it's AI's turn
  const triggerAiTurnIfNeeded = useCallback(
    async (currentState: CheckersGameState) => {
      if (
        currentState.isGameOver ||
        gameMode !== 'vs_ai' ||
        currentState.currentTurn === humanColor
      ) {
        return;
      }

      setIsAiThinking(true);
      const currentSession = sessionIdRef.current;

      try {
        const aiMove = await getAiMoveAsync(
          currentState.board,
          currentState.currentTurn,
          difficulty,
          currentState.activeJumpPos,
          currentSession,
          () => sessionIdRef.current
        );

        if (aiMove && currentSession === sessionIdRef.current) {
          executeCheckersMoveWithAnimation(currentState, aiMove, (nextState) => {
            if (sessionIdRef.current !== currentSession) {
              setIsAiThinking(false);
              return;
            }

            // If AI made a jump and must continue a multi-jump, trigger continuation
            if (!nextState.isGameOver && nextState.currentTurn !== humanColor) {
              animTimerRef.current = window.setTimeout(() => {
                if (sessionIdRef.current === currentSession) {
                  triggerAiTurnRef.current(nextState);
                } else {
                  setIsAiThinking(false);
                }
              }, 200);
            } else {
              setIsAiThinking(false);
            }
          });
        } else {
          setIsAiThinking(false);
        }
      } catch (err) {
        console.error('Error in AI turn:', err);
        if (currentSession === sessionIdRef.current) {
          setIsAiThinking(false);
        }
      }
    },
    [difficulty, executeCheckersMoveWithAnimation, gameMode, humanColor]
  );

  useEffect(() => {
    triggerAiTurnRef.current = triggerAiTurnIfNeeded;
  }, [triggerAiTurnIfNeeded]);

  // Square Click Handler
  const handleSquareClick = useCallback(
    (pos: Position) => {
      if (gameState.isGameOver || isAiThinking || isAnimating) return;

      // In vs_ai mode, lock input when it's not the human player's turn
      if (gameMode === 'vs_ai' && gameState.currentTurn !== humanColor) {
        return;
      }

      const clickedPiece = gameState.board[pos.r][pos.c];

      // If clicked on an already selected square: deselect (unless locked in multi-jump)
      if (
        gameState.selectedPos &&
        gameState.selectedPos.r === pos.r &&
        gameState.selectedPos.c === pos.c
      ) {
        if (!gameState.activeJumpPos) {
          setGameState((prev) => ({ ...prev, selectedPos: null }));
          playCheckersSound('click', soundEnabled);
        }
        return;
      }

      // Check if clicking a valid move destination for the currently selected piece
      if (gameState.selectedPos && legalMovesForSelected.length > 0) {
        const matchingMove = legalMovesForSelected.find(
          (m) => m.to.r === pos.r && m.to.c === pos.c
        );

        if (matchingMove) {
          try {
            executeCheckersMoveWithAnimation(gameState, matchingMove, (nextState) => {
              // If turn transitioned to AI, trigger AI calculation
              if (
                !nextState.isGameOver &&
                gameMode === 'vs_ai' &&
                nextState.currentTurn !== humanColor
              ) {
                triggerAiTurnRef.current(nextState);
              }
            });
          } catch {
            playCheckersSound('illegal', soundEnabled);
          }
          return;
        }
      }

      // If locked in an active multi-jump sequence, cannot select other pieces!
      if (gameState.activeJumpPos) {
        if (pos.r !== gameState.activeJumpPos.r || pos.c !== gameState.activeJumpPos.c) {
          playCheckersSound('illegal', soundEnabled);
        }
        return;
      }

      // Selecting a piece of the current turn's color
      if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        const pieceLegalMoves = getLegalMovesForSelection(
          gameState.board,
          pos,
          gameState.currentTurn,
          gameState.activeJumpPos
        );

        if (pieceLegalMoves.length > 0) {
          setGameState((prev) => ({ ...prev, selectedPos: pos }));
          playCheckersSound('click', soundEnabled);
        } else {
          // If piece has no legal moves (e.g. blocked or mandatory capture exists elsewhere)
          playCheckersSound('illegal', soundEnabled);
        }
        return;
      }

      // Clicking empty square without valid move: clear selection if not locked
      if (!gameState.activeJumpPos) {
        setGameState((prev) => ({ ...prev, selectedPos: null }));
      }
    },
    [
      executeCheckersMoveWithAnimation,
      gameMode,
      gameState,
      humanColor,
      isAiThinking,
      isAnimating,
      legalMovesForSelected,
      soundEnabled,
    ]
  );

  // Start new match
  const handleStartGame = () => {
    if (animTimerRef.current) {
      window.clearTimeout(animTimerRef.current);
    }
    setAnimatingMove(null);
    setCapturedPos(null);
    setCrowningPos(null);
    setIsAnimating(false);

    sessionIdRef.current += 1;
    hasAwardedPointsRef.current = false;
    setAwardedXp(0);
    setIsAiThinking(false);
    setShowRestartConfirm(false);

    const freshState = createInitialGameState();
    setGameState(freshState);
    setIsPlaying(true);

    playCheckersSound('click', soundEnabled);

    // If vs AI and player chose Black, Red AI moves first!
    if (gameMode === 'vs_ai' && humanColor === 'black') {
      triggerAiTurnIfNeeded(freshState);
    }
  };

  // Restart match handler
  const handleRestartClick = () => {
    if (gameState.lastMove || gameState.isGameOver) {
      setShowRestartConfirm(true);
    } else {
      handleStartGame();
    }
  };

  const handleExitGame = () => {
    if (animTimerRef.current) {
      window.clearTimeout(animTimerRef.current);
    }
    setAnimatingMove(null);
    setCapturedPos(null);
    setCrowningPos(null);
    setIsAnimating(false);
    onExit();
  };

  return (
    <div className="dama-masters-container" role="main" aria-label="Dama Masters Checkers">
      {/* ── Top Bar Header ────────────────────────────────────────── */}
      <header className="dama-header">
        <div className="dama-header-brand">
          <div className="dama-brand-icon">
            <Swords size={20} color="var(--accent-gold)" />
          </div>
          <div>
            <h2 className="dama-title">{UI_TEXT.title[lang]}</h2>
            <span className="dama-mode-chip">
              {gameMode === 'vs_ai'
                ? `AI (${UI_TEXT[difficulty][lang]})`
                : UI_TEXT.twoPlayer[lang]}
            </span>
          </div>
        </div>

        <div className="dama-header-controls">
          <button
            type="button"
            className="dama-control-btn"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? UI_TEXT.soundOff[lang] : UI_TEXT.soundOn[lang]}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            type="button"
            className="dama-control-btn"
            onClick={() => setShowRulesModal(true)}
            title={UI_TEXT.rules[lang]}
            aria-label="View Rules"
          >
            <BookOpen size={18} />
          </button>

          {isPlaying && (
            <button
              type="button"
              className="dama-control-btn"
              onClick={handleRestartClick}
              title={UI_TEXT.restart[lang]}
              aria-label="Restart Match"
            >
              <RotateCw size={18} />
            </button>
          )}

          <button
            type="button"
            className="dama-control-btn dama-exit-btn"
            onClick={handleExitGame}
            title={UI_TEXT.exit[lang]}
            aria-label="Exit Game"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* ── Mode Selection Screen (Before Match Starts) ───────────── */}
      {!isPlaying ? (
        <div className="dama-setup-card">
          <div className="dama-hero-art-box">
            <div className="dama-hero-piece-display">
              <div className="hero-piece hero-piece-red">
                <Crown size={22} fill="#f59e0b" color="#fff" />
              </div>
              <div className="hero-piece hero-piece-black">
                <Crown size={22} fill="#f59e0b" color="#fff" />
              </div>
            </div>
            <h3 className="dama-hero-title">{UI_TEXT.title[lang]}</h3>
            <p className="dama-hero-desc">{UI_TEXT.subtitle[lang]}</p>
          </div>

          {/* Mode Selector */}
          <div className="setup-section">
            <label className="setup-label">Select Game Mode</label>
            <div className="setup-toggle-row">
              <button
                type="button"
                className={`setup-toggle-btn ${gameMode === 'vs_ai' ? 'active' : ''}`}
                onClick={() => setGameMode('vs_ai')}
              >
                <Bot size={18} />
                <span>{UI_TEXT.vsAi[lang]}</span>
              </button>
              <button
                type="button"
                className={`setup-toggle-btn ${gameMode === 'two_player' ? 'active' : ''}`}
                onClick={() => setGameMode('two_player')}
              >
                <Users size={18} />
                <span>{UI_TEXT.twoPlayer[lang]}</span>
              </button>
            </div>
          </div>

          {/* AI Settings (Only if vs AI) */}
          {gameMode === 'vs_ai' && (
            <>
              <div className="setup-section">
                <label className="setup-label">AI Difficulty Level</label>
                <div className="difficulty-pills">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`difficulty-pill ${difficulty === d ? 'active' : ''} diff-${d}`}
                      onClick={() => setDifficulty(d)}
                    >
                      {UI_TEXT[d][lang]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-section">
                <label className="setup-label">Your Pieces Color</label>
                <div className="color-select-row">
                  <button
                    type="button"
                    className={`color-select-btn ${humanColor === 'red' ? 'active' : ''}`}
                    onClick={() => setHumanColor('red')}
                  >
                    <span className="color-dot color-dot-red" />
                    <span>{UI_TEXT.redColor[lang]}</span>
                  </button>
                  <button
                    type="button"
                    className={`color-select-btn ${humanColor === 'black' ? 'active' : ''}`}
                    onClick={() => setHumanColor('black')}
                  >
                    <span className="color-dot color-dot-black" />
                    <span>{UI_TEXT.blackColor[lang]}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            className="dama-start-btn"
            onClick={handleStartGame}
            id="start-dama-game-btn"
          >
            <Play size={20} fill="#fff" />
            <span>{UI_TEXT.startGame[lang]}</span>
          </button>
        </div>
      ) : (
        /* ── Active Gameplay View ────────────────────────────────── */
        <div className="dama-play-view">
          {/* Opponent Bar */}
          <div className="player-hud hud-opponent">
            <div className="hud-identity">
              <span className={`hud-avatar-disc disc-${gameMode === 'vs_ai' ? (humanColor === 'red' ? 'black' : 'red') : 'black'}`} />
              <div>
                <span className="hud-player-name">
                  {gameMode === 'vs_ai'
                    ? `AI Opponent (${UI_TEXT[difficulty][lang]})`
                    : UI_TEXT.blackTurn[lang]}
                </span>
                <span className="hud-sub-info">
                  {UI_TEXT.piecesRemaining[lang]}:{' '}
                  {gameMode === 'vs_ai'
                    ? humanColor === 'red'
                      ? gameState.blackPiecesCount
                      : gameState.redPiecesCount
                    : gameState.blackPiecesCount}
                </span>
              </div>
            </div>

            {/* Captures tray */}
            <div className="hud-captures">
              <span className="hud-captured-badge">
                +{gameMode === 'vs_ai'
                  ? humanColor === 'red'
                    ? gameState.blackCapturedCount
                    : gameState.redCapturedCount
                  : gameState.blackCapturedCount}
              </span>
            </div>
          </div>

          {/* Turn status alert banner */}
          <div className="dama-turn-banner">
            {isAiThinking ? (
              <div className="turn-indicator ai-thinking-pulse">
                <span className="thinking-spinner" />
                <span>{UI_TEXT.aiThinking[lang]}</span>
              </div>
            ) : gameState.activeJumpPos ? (
              <div className="turn-indicator alert-jump-pulse">
                <Sparkles size={16} />
                <span>{UI_TEXT.continueJump[lang]}</span>
              </div>
            ) : hasMandatoryCapture ? (
              <div className="turn-indicator alert-capture-pulse">
                <ShieldAlert size={16} />
                <span>{UI_TEXT.mandatoryCapture[lang]}</span>
              </div>
            ) : (
              <div className={`turn-indicator turn-${gameState.currentTurn}`}>
                <span className={`turn-dot dot-${gameState.currentTurn}`} />
                <span>
                  {gameMode === 'vs_ai'
                    ? gameState.currentTurn === humanColor
                      ? UI_TEXT.yourTurn[lang]
                      : UI_TEXT.aiThinking[lang]
                    : gameState.currentTurn === 'red'
                      ? UI_TEXT.redTurn[lang]
                      : UI_TEXT.blackTurn[lang]}
                </span>
              </div>
            )}
          </div>

          {/* ── Checkers Board ────────────────────────────────────── */}
          <CheckersBoard
            board={gameState.board}
            selectedPos={gameState.selectedPos}
            legalMoves={legalMovesForSelected}
            lastMove={gameState.lastMove}
            activeJumpPos={gameState.activeJumpPos}
            onSquareClick={handleSquareClick}
            boardFlipped={gameMode === 'vs_ai' && humanColor === 'black'}
            animatingMove={animatingMove}
            capturedPos={capturedPos}
            crowningPos={crowningPos}
          />

          {/* Human Player Bar */}
          <div className="player-hud hud-player">
            <div className="hud-identity">
              <span className={`hud-avatar-disc disc-${gameMode === 'vs_ai' ? humanColor : 'red'}`} />
              <div>
                <span className="hud-player-name">
                  {gameMode === 'vs_ai' ? 'You' : UI_TEXT.redTurn[lang]}
                </span>
                <span className="hud-sub-info">
                  {UI_TEXT.piecesRemaining[lang]}:{' '}
                  {gameMode === 'vs_ai'
                    ? humanColor === 'red'
                      ? gameState.redPiecesCount
                      : gameState.blackPiecesCount
                    : gameState.redPiecesCount}
                </span>
              </div>
            </div>

            <div className="hud-captures">
              <span className="hud-captured-badge">
                +{gameMode === 'vs_ai'
                  ? humanColor === 'red'
                    ? gameState.redCapturedCount
                    : gameState.blackCapturedCount
                  : gameState.redCapturedCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Restart Confirmation Modal ──────────────────────────── */}
      {showRestartConfirm && (
        <div className="dama-modal-backdrop" role="dialog" aria-modal="true">
          <div className="dama-modal-card">
            <ShieldAlert size={36} color="var(--accent-gold)" />
            <h3 className="modal-title">{UI_TEXT.confirmRestartTitle[lang]}</h3>
            <p className="modal-desc">{UI_TEXT.confirmRestartDesc[lang]}</p>
            <div className="modal-action-row">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => setShowRestartConfirm(false)}
              >
                {UI_TEXT.confirmCancel[lang]}
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleStartGame}
              >
                {UI_TEXT.confirmYes[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Game Over Result Modal ───────────────────────────────── */}
      {gameState.isGameOver && gameState.result && (
        <div className="dama-modal-backdrop" role="dialog" aria-modal="true">
          <div className="dama-modal-card result-modal-card">
            <div className="result-trophy-glow">
              <Trophy size={42} color="var(--accent-gold)" />
            </div>

            <h3 className="result-title">
              {gameState.result.winner === 'draw'
                ? lang === 'am' ? 'ጨዋታው አቻ ወጥቷል!' : 'Match Drawn!'
                : gameMode === 'vs_ai'
                  ? gameState.result.winner === humanColor
                    ? lang === 'am' ? 'እንኳን ደስ አለዎት! አሸንፈዋል!' : 'Victory! You Won!'
                    : lang === 'am' ? 'ተሸንፈዋል! በሚቀጥለው ዙር ይሞክሩ' : 'Defeat! AI Won!'
                  : lang === 'am'
                    ? `${gameState.result.winner === 'red' ? 'ቀይ' : 'ጥቁር'} አሸንፏል!`
                    : `${gameState.result.winner === 'red' ? 'Red' : 'Black'} Wins!`}
            </h3>

            <p className="result-desc">
              {lang === 'am' ? gameState.result.reasonAm : gameState.result.reasonEn}
            </p>

            {/* XP Yield Card */}
            {awardedXp > 0 && (
              <div className="result-xp-card">
                <Award size={24} color="var(--accent-gold)" />
                <div className="xp-details">
                  <span className="xp-label">{UI_TEXT.xpEarned[lang]}</span>
                  <span className="xp-number">+{awardedXp} XP</span>
                </div>
              </div>
            )}

            <p className="result-disclaimer">{UI_TEXT.pointsNotice[lang]}</p>

            <div className="modal-action-row">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => setIsPlaying(false)}
              >
                {UI_TEXT.returnMenu[lang]}
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleStartGame}
              >
                <RotateCw size={16} />
                <span>{UI_TEXT.playAgain[lang]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rules & Objectives Modal ─────────────────────────────── */}
      {showRulesModal && (
        <div className="dama-modal-backdrop" role="dialog" aria-modal="true">
          <div className="dama-modal-card rules-modal-card">
            <div className="rules-modal-header">
              <BookOpen size={22} color="var(--accent-purple-light)" />
              <h3 className="rules-title">{UI_TEXT.rulesTitle[lang]}</h3>
            </div>

            <div className="rules-body">
              <h4>{lang === 'am' ? '1. የሰሌዳና የጠጠሮች አደረጃጀት' : '1. Board & Initial Setup'}</h4>
              <p>
                {lang === 'am'
                  ? 'ጨዋታው በ8×8 ሰሌዳ ላይ ባሉ 32 ጥቁር ሳጥኖች ብቻ ይካሄዳል። ሁለቱም ተጫዋቾች በ12 ጠጠሮች ይጀምራሉ። ቀይ ጠጠር ከታች ወደ ላይ፣ ጥቁር ጠጠር ከላይ ወደ ታች ይጓዛሉ።'
                  : 'Played on an 8×8 grid on the 32 dark squares only. Each player commands 12 pieces. Red starts at the bottom moving up, and Black starts at the top moving down.'}
              </p>

              <h4>{lang === 'am' ? '2. እንቅስቃሴ እና መያዝ (መዝለል)' : '2. Movement & Mandatory Captures'}</h4>
              <p>
                {lang === 'am'
                  ? 'ተራ ጠጠሮች ወደፊት ብቻ በሰያፍ አንድ እርምጃ ይጓዛሉ። ተቃራኒ ጠጠርን መዝለል ከተቻለ መያዝ ግዴታ (Mandatory) ነው። በርካታ የመያዝ አማራጮች ካሉ የተፈለገውን መምረጥ ይቻላል።'
                  : 'Regular men move diagonally forward one square. If any jump capture is available, capturing is MANDATORY. If multiple capture paths exist, the player may select any legal capture.'}
              </p>

              <h4>{lang === 'am' ? '3. ተከታታይ ዝላይ (Multi-Jump)' : '3. Multi-Jump Sequences'}</h4>
              <p>
                {lang === 'am'
                  ? 'አንድ ጠጠር ተቃራኒውን ከዘለለ በኋላ ሌላ ተጨማሪ መዝለል የሚችል ከሆነ፣ ያው ጠጠር እስኪያልቅ ድረስ ተከታታይ ዝላዩን መቀጠል አለበት።'
                  : 'If a piece can continue capturing from its landing square, the same piece MUST continue jumping until no further captures remain.'}
              </p>

              <h4>{lang === 'am' ? '4. ደማ (ንጉሥ) መሆን' : '4. King Promotion'}</h4>
              <p>
                {lang === 'am'
                  ? 'ቀይ ወደ መጨረሻው የላይኛው ረድፍ (Row 0)፣ ጥቁር ወደ መጨረሻው የታችኛው ረድፍ (Row 7) ሲደርስ ደማ (ንጉሥ) ይሆናል። በመዝለል ሂደት ላይ ደማ የሆነ ጠጠር ተራው ወዲያውኑ ያበቃል። ደማ ወደፊትም ወደኋላም ይዘላል።'
                  : 'A piece reaching the opposite end is crowned a King. In American Checkers, crowning during a jump ends the turn immediately. A crowned King moves and captures both forward and backward.'}
              </p>

              <h4>{lang === 'am' ? '5. ማሸነፍና አቻ' : '5. Victory & Draw Conditions'}</h4>
              <p>
                {lang === 'am'
                  ? 'የተቃራኒውን ጠጠሮች በሙሉ የያዘ ወይም ተቃራኒው ምንም እንቅስቃሴ ማድረግ የማይችል ሲሆን ያሸንፋል። በ40 እንቅስቃሴዎች ምንም መያዝ ወይም ተራ ጠጠር ካልተንቀሳቀሰ፣ ወይም በ3 ተከታታይ የቦታ ድግግሞሽ ጨዋታው አቻ ይሆናል።'
                  : 'Win by capturing all opponent pieces or blocking the opponent from having legal moves. A draw occurs after 40 consecutive moves without capture or man advancement, or upon threefold board repetition.'}
              </p>
            </div>

            <button
              type="button"
              className="modal-btn primary"
              onClick={() => setShowRulesModal(false)}
            >
              {lang === 'am' ? 'ተረድቻለሁ (ዝጋ)' : 'Got It (Close)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
