import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { useLanguage } from '../../context/useLanguage';
import {
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  ArrowUpDown,
  Flag,
  RotateCw,
  Trophy,
  Bot,
  Users,
  Swords,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ChessPieceView } from './chess/ChessPieceView';
import { selectComputerMove, type ChessDifficulty } from './chess/chessAi';
import { playChessSound } from './chess/chessAudio';

interface EthiopianGrandmasterChessProps {
  onExit: () => void;
}

type PlayMode = 'vs_computer' | 'two_player';
type PlayerColor = 'w' | 'b';

interface MoveHistoryItem {
  san: string;
  from: string;
  to: string;
  color: 'w' | 'b';
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const START_PIECE_COUNTS: Record<string, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

export const EthiopianGrandmasterChess: React.FC<EthiopianGrandmasterChessProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const lang = language === 'am' ? 'am' : 'en';

  // Game configuration
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playMode, setPlayMode] = useState<PlayMode>('vs_computer');
  const [difficulty, setDifficulty] = useState<ChessDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('w');

  // Audio preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Persistent Chess engine instance
  const [chess] = useState<Chess>(() => new Chess());
  // FEN state triggers re-renders on board mutations
  const [fen, setFen] = useState<string>(() => chess.fen());

  // Selection & moves
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Status & AI
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverDetails, setGameOverDetails] = useState<{
    title: { en: string; am: string };
    desc: { en: string; am: string };
    winner: 'w' | 'b' | 'draw' | null;
  } | null>(null);

  // Dialogs
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);

  // AI race condition token
  const gameSessionIdRef = useRef<number>(0);
  const historyScrollRef = useRef<HTMLDivElement>(null);

  // Scroll move history on update
  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [history]);

  // King position in check
  const kingInCheckSquare = useMemo((): Square | null => {
    // depend on fen
    if (!fen || !chess.isCheck()) return null;

    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode('a'.charCodeAt(0) + c);
          const rank = (8 - r).toString();
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }, [chess, fen]);

  // Captured pieces and material advantage
  const { whiteCaptured, blackCaptured, materialAdvantage } = useMemo(() => {
    // depend on fen
    if (!fen) {
      return { whiteCaptured: [], blackCaptured: [], materialAdvantage: 0 };
    }
    const board = chess.board();

    const currentCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };

    let whiteValue = 0;
    let blackValue = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          currentCounts[piece.color][piece.type as 'p' | 'n' | 'b' | 'r' | 'q']++;
          const val = PIECE_VALUES[piece.type] || 0;
          if (piece.color === 'w') whiteValue += val;
          else blackValue += val;
        }
      }
    }

    // Pieces captured BY White (meaning Black pieces that were lost)
    const whiteCapt: string[] = [];
    (['q', 'r', 'b', 'n', 'p'] as const).forEach((t) => {
      const lost = START_PIECE_COUNTS[t] - currentCounts.b[t];
      for (let i = 0; i < lost; i++) whiteCapt.push(t);
    });

    // Pieces captured BY Black (meaning White pieces that were lost)
    const blackCapt: string[] = [];
    (['q', 'r', 'b', 'n', 'p'] as const).forEach((t) => {
      const lost = START_PIECE_COUNTS[t] - currentCounts.w[t];
      for (let i = 0; i < lost; i++) blackCapt.push(t);
    });

    return {
      whiteCaptured: whiteCapt,
      blackCaptured: blackCapt,
      materialAdvantage: whiteValue - blackValue,
    };
  }, [chess, fen]);

  // Legal moves for selected square
  const legalMovesForSelected = useMemo((): Move[] => {
    if (!selectedSquare || !fen) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [chess, selectedSquare, fen]);

  // Check Game Over
  const checkGameOverState = useCallback(() => {
    if (!chess.isGameOver()) return false;

    setIsGameOver(true);

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'b' : 'w';
      playChessSound('gameover', soundEnabled);
      setGameOverDetails({
        title: {
          en: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} Wins!`,
          am: `ቼክሜት! ${winner === 'w' ? 'ነጭ' : 'ጥቁር'} አሸንፏል!`,
        },
        desc: {
          en: playMode === 'vs_computer'
            ? winner === playerColor
              ? 'Outstanding victory! You outsmarted the computer opponent.'
              : 'The computer secured checkmate. Review your moves and try again!'
            : `Decisive checkmate by ${winner === 'w' ? 'White' : 'Black'}.`,
          am: playMode === 'vs_computer'
            ? winner === playerColor
              ? 'ድንቅ ድል! ኮምፒውተሩን በስልት አሸንፈዋል።'
              : 'ኮምፒውተሩ ቼክሜት አድርጓል። ስልትዎን አስተካክለው እንደገና ይሞክሩ!'
            : `${winner === 'w' ? 'ነጭ' : 'ጥቁር'} በደማቅ ቼክሜት አሸንፏል።`,
        },
        winner,
      });
      return true;
    }

    if (chess.isStalemate()) {
      playChessSound('gameover', soundEnabled);
      setGameOverDetails({
        title: { en: 'Stalemate — Draw', am: 'ስቴልሜት — አቻ' },
        desc: {
          en: 'No legal moves remaining and the king is not in check.',
          am: 'ምንም ህጋዊ እንቅስቃሴ የለም፤ ንጉሡም አልተጠቃም።',
        },
        winner: 'draw',
      });
      return true;
    }

    if (chess.isThreefoldRepetition()) {
      playChessSound('gameover', soundEnabled);
      setGameOverDetails({
        title: { en: 'Draw by Threefold Repetition', am: 'በሶስትዮሽ ድግግሞሽ አቻ' },
        desc: {
          en: 'The exact same board position occurred three times.',
          am: 'ተመሳሳይ የሰሌዳ አቀማመጥ ሦስት ጊዜ ተደግሟል።',
        },
        winner: 'draw',
      });
      return true;
    }

    if (chess.isInsufficientMaterial()) {
      playChessSound('gameover', soundEnabled);
      setGameOverDetails({
        title: { en: 'Draw — Insufficient Material', am: 'አቻ — የቁሳቁስ እጥረት' },
        desc: {
          en: 'Neither player has enough pieces left to force checkmate.',
          am: 'ሁለቱም ተጫዋቾች ቼክሜት ለማድረግ በቂ አቅም ያላቸው ቁሶች የሏቸውም።',
        },
        winner: 'draw',
      });
      return true;
    }

    if (chess.isDraw()) {
      playChessSound('gameover', soundEnabled);
      setGameOverDetails({
        title: { en: 'Game Drawn', am: 'አቻ ተጠናቋል' },
        desc: {
          en: 'Game reached a draw according to official chess rules.',
          am: 'በቼስ ህግጋት መሰረት ጨዋታው በአቻ ውጤት ተጠናቋል።',
        },
        winner: 'draw',
      });
      return true;
    }

    return false;
  }, [chess, playMode, playerColor, soundEnabled]);

  // Trigger Computer Move
  const triggerAiMove = useCallback(() => {
    const currentSession = gameSessionIdRef.current;
    setIsAiThinking(true);

    const delay = difficulty === 'easy' ? 350 : difficulty === 'medium' ? 450 : 600;

    window.setTimeout(() => {
      // Discard if session changed (restart/undo/new game)
      if (currentSession !== gameSessionIdRef.current) {
        setIsAiThinking(false);
        return;
      }

      if (chess.isGameOver()) {
        setIsAiThinking(false);
        return;
      }

      const bestMove = selectComputerMove(chess, difficulty);
      if (bestMove) {
        const moveResult = chess.move(bestMove);
        if (moveResult) {
          setFen(chess.fen());
          setLastMove({ from: moveResult.from, to: moveResult.to });
          setHistory((prev) => [
            ...prev,
            {
              san: moveResult.san,
              from: moveResult.from,
              to: moveResult.to,
              color: moveResult.color,
            },
          ]);

          // Audio
          if (chess.isCheck()) {
            playChessSound('check', soundEnabled);
          } else if (moveResult.captured) {
            playChessSound('capture', soundEnabled);
          } else {
            playChessSound('move', soundEnabled);
          }

          checkGameOverState();
        }
      }

      setIsAiThinking(false);
    }, delay);
  }, [chess, difficulty, soundEnabled, checkGameOverState]);

  // Make a player move
  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: 'q' | 'r' | 'b' | 'n') => {
      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotionPiece || 'q',
        });

        if (moveResult) {
          setFen(chess.fen());
          setSelectedSquare(null);
          setPendingPromotion(null);
          setLastMove({ from, to });
          setHistory((prev) => [
            ...prev,
            {
              san: moveResult.san,
              from: moveResult.from,
              to: moveResult.to,
              color: moveResult.color,
            },
          ]);

          // Sound
          if (chess.isCheck()) {
            playChessSound('check', soundEnabled);
          } else if (moveResult.captured) {
            playChessSound('capture', soundEnabled);
          } else {
            playChessSound('move', soundEnabled);
          }

          const gameOver = checkGameOverState();
          if (!gameOver && playMode === 'vs_computer' && chess.turn() !== playerColor) {
            triggerAiMove();
          }
        }
      } catch {
        playChessSound('illegal', soundEnabled);
      }
    },
    [chess, soundEnabled, checkGameOverState, playMode, playerColor, triggerAiMove]
  );

  // Square Click handler
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (isGameOver || isAiThinking) return;

      const turn = chess.turn();

      // If playing vs computer and not player's turn, lock inputs
      if (playMode === 'vs_computer' && turn !== playerColor) {
        return;
      }

      const pieceOnSquare = chess.get(square);

      // If no square is selected yet:
      if (!selectedSquare) {
        if (pieceOnSquare && pieceOnSquare.color === turn) {
          setSelectedSquare(square);
        }
        return;
      }

      // If clicking the currently selected square again: deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicking another friendly piece: change selection
      if (pieceOnSquare && pieceOnSquare.color === turn) {
        setSelectedSquare(square);
        return;
      }

      // Check if clicked square is a legal move destination
      const validMove = legalMovesForSelected.find((m) => m.to === square);
      if (validMove) {
        // Check for pawn promotion
        const movingPiece = chess.get(selectedSquare);
        const isPromotion =
          movingPiece?.type === 'p' &&
          ((movingPiece.color === 'w' && square[1] === '8') ||
            (movingPiece.color === 'b' && square[1] === '1'));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        executeMove(selectedSquare, square);
      } else {
        setSelectedSquare(null);
        playChessSound('illegal', soundEnabled);
      }
    },
    [chess, isGameOver, isAiThinking, playMode, playerColor, selectedSquare, legalMovesForSelected, executeMove, soundEnabled]
  );

  // Start new match
  const handleStartGame = () => {
    gameSessionIdRef.current += 1;
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setPendingPromotion(null);
    setHistory([]);
    setIsGameOver(false);
    setGameOverDetails(null);
    setIsAiThinking(false);
    setIsPlaying(true);
    setShowRestartConfirm(false);

    // Orientation follows chosen color in vs computer mode
    const initialOrientation = playMode === 'vs_computer' ? playerColor : 'w';
    setBoardOrientation(initialOrientation);

    // If player chose Black in vs computer mode, computer (White) moves first!
    if (playMode === 'vs_computer' && playerColor === 'b') {
      setIsAiThinking(true);
      const currentSession = gameSessionIdRef.current;
      window.setTimeout(() => {
        if (currentSession !== gameSessionIdRef.current) return;
        const bestMove = selectComputerMove(chess, difficulty);
        if (bestMove) {
          const moveResult = chess.move(bestMove);
          if (moveResult) {
            setFen(chess.fen());
            setLastMove({ from: moveResult.from, to: moveResult.to });
            setHistory([
              {
                san: moveResult.san,
                from: moveResult.from,
                to: moveResult.to,
                color: moveResult.color,
              },
            ]);
            playChessSound('move', soundEnabled);
          }
        }
        setIsAiThinking(false);
      }, 500);
    }
  };

  // Undo move
  const handleUndo = () => {
    if (isAiThinking || history.length === 0) return;

    gameSessionIdRef.current += 1; // cancel any pending AI moves

    if (playMode === 'vs_computer') {
      // In computer mode, undo both computer reply and player move
      // If it's currently player's turn, undo 2 plies
      if (chess.turn() === playerColor) {
        chess.undo(); // undo computer move
        chess.undo(); // undo player move
        setHistory((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
      } else {
        // Computer was about to move or just moved
        chess.undo();
        setHistory((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
      }
    } else {
      // Two-player mode: undo 1 ply
      chess.undo();
      setHistory((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
    }

    setFen(chess.fen());
    setSelectedSquare(null);
    setPendingPromotion(null);
    setIsGameOver(false);
    setGameOverDetails(null);
    setIsAiThinking(false);

    // Update last move highlight from new history
    const remainingMoves = chess.history({ verbose: true });
    if (remainingMoves.length > 0) {
      const last = remainingMoves[remainingMoves.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }

    playChessSound('move', soundEnabled);
  };

  // Resign
  const handleResign = () => {
    if (isGameOver) return;
    const currentTurn = chess.turn();
    const winner = currentTurn === 'w' ? 'b' : 'w';

    setIsGameOver(true);
    playChessSound('gameover', soundEnabled);
    setGameOverDetails({
      title: {
        en: `${currentTurn === 'w' ? 'White' : 'Black'} Resigned`,
        am: `${currentTurn === 'w' ? 'ነጭ' : 'ጥቁር'} እጅ ሰጠ`,
      },
      desc: {
        en: playMode === 'vs_computer'
          ? currentTurn === playerColor
            ? 'You resigned this match. Better fortune next game!'
            : 'The computer surrendered!'
          : `${winner === 'w' ? 'White' : 'Black'} wins by resignation.`,
        am: playMode === 'vs_computer'
          ? currentTurn === playerColor
            ? 'ጨዋታውን እጅ ሰጥተዋል። በሚቀጥለው ዙር መልካም እድል!'
            : 'ኮምፒውተሩ እጅ ሰጥቷል!'
          : `${winner === 'w' ? 'ነጭ' : 'ጥቁር'} በእጅ መስጠት አሸንፏል።`,
      },
      winner,
    });
  };

  // Board square rendering array
  const ranks = boardOrientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = boardOrientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  // Current turn indicator
  const currentTurn = chess.turn();

  // Helper text
  const statusBadge = useMemo(() => {
    if (isGameOver) {
      return {
        text: lang === 'am' ? 'ጨዋታው ተጠናቋል' : 'Game Finished',
        color: 'var(--accent-gold)',
      };
    }
    if (isAiThinking) {
      return {
        text: lang === 'am' ? 'ኮምፒውተር በማሰብ ላይ...' : 'Computer is thinking...',
        color: 'var(--accent-cyan)',
      };
    }
    if (chess.isCheck()) {
      return {
        text: lang === 'am' ? 'ቼክ! ንጉሡ ተከቧል' : 'Check! King in peril',
        color: 'var(--accent-rose)',
      };
    }
    if (playMode === 'vs_computer') {
      const isMyTurn = currentTurn === playerColor;
      return {
        text: isMyTurn
          ? lang === 'am' ? 'የእርስዎ ተራ' : 'Your Turn'
          : lang === 'am' ? 'የኮምፒውተር ተራ' : "Computer's Turn",
        color: isMyTurn ? 'var(--accent-emerald)' : 'var(--accent-purple)',
      };
    }
    return {
      text: currentTurn === 'w'
        ? lang === 'am' ? 'የነጭ ተራ' : "White's Turn"
        : lang === 'am' ? 'የጥቁር ተራ' : "Black's Turn",
      color: currentTurn === 'w' ? '#f8fafc' : '#a78bfa',
    };
  }, [isGameOver, isAiThinking, chess, currentTurn, playMode, playerColor, lang]);

  return (
    <div className="chess-game-root" role="region" aria-label="Ethiopian Grandmaster Chess">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="chess-top-bar">
        <div className="chess-title-badge">
          <Swords size={18} color="var(--accent-gold)" />
          <span className="chess-title-text">
            {lang === 'am' ? 'የኢትዮጵያ ግራንድማስተር ቼስ' : 'Ethiopian Grandmaster Chess'}
          </span>
          {isPlaying && (
            <span className="chess-mode-pill">
              {playMode === 'vs_computer'
                ? lang === 'am' ? `ከኮምፒውተር (${difficulty})` : `vs AI (${difficulty})`
                : lang === 'am' ? 'ሁለት ተጫዋቾች' : '2-Player Local'}
            </span>
          )}
        </div>

        <div className="chess-top-actions">
          <button
            type="button"
            className="chess-icon-btn"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? (lang === 'am' ? 'ድምፅ አጥፋ' : 'Mute Sound') : (lang === 'am' ? 'ድምፅ አብራ' : 'Unmute Sound')}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            className="chess-exit-btn"
            onClick={onExit}
            aria-label={lang === 'am' ? 'ከጨዋታ ውጣ' : 'Exit Game'}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Setup / Mode Selection Screen ────────────────────── */}
      {!isPlaying && (
        <div className="chess-setup-screen">
          <div className="chess-setup-hero">
            <div className="chess-hero-crown">
              <Sparkles size={24} color="var(--accent-gold)" />
            </div>
            <h2 className="chess-setup-title">
              {lang === 'am' ? 'የቼስ ፍልሚያዎን ይጀምሩ' : 'Grandmaster Chess Challenge'}
            </h2>
            <p className="chess-setup-subtitle">
              {lang === 'am'
                ? 'በታክቲክ ጥበብ የተካኑትን የኢትዮጵያ ሰንጠረዥ እና ዓለም አቀፍ የቼስ ህጎችን ይጫወቱ።'
                : 'Master tactical maneuvers, foresight, and opening gambits in the Ethiopian grandmaster arena.'}
            </p>
          </div>

          <div className="chess-setup-section">
            <label className="chess-setup-label">
              {lang === 'am' ? 'የጨዋታ አይነት ይምረጡ' : 'Choose Game Mode'}
            </label>
            <div className="chess-mode-cards">
              <button
                type="button"
                className={`chess-mode-card ${playMode === 'vs_computer' ? 'active' : ''}`}
                onClick={() => setPlayMode('vs_computer')}
              >
                <Bot size={22} color="var(--accent-purple-light)" />
                <span className="mode-card-title">
                  {lang === 'am' ? 'ከኮምፒውተር ጋር' : 'Play vs Computer'}
                </span>
                <span className="mode-card-sub">
                  {lang === 'am' ? 'ሶስት የስልት ደረጃዎች ያሉት AI' : 'Minimax engine with 3 difficulty tiers'}
                </span>
              </button>

              <button
                type="button"
                className={`chess-mode-card ${playMode === 'two_player' ? 'active' : ''}`}
                onClick={() => setPlayMode('two_player')}
              >
                <Users size={22} color="var(--accent-gold)" />
                <span className="mode-card-title">
                  {lang === 'am' ? 'ሁለት ተጫዋቾች (በአንድ መሣሪያ)' : 'Pass & Play (Local 2P)'}
                </span>
                <span className="mode-card-sub">
                  {lang === 'am' ? 'ከጓደኛዎ ጋር ተራ በተራ ይጫወቱ' : 'Play locally against a friend on one device'}
                </span>
              </button>
            </div>
          </div>

          {playMode === 'vs_computer' && (
            <>
              <div className="chess-setup-section">
                <label className="chess-setup-label">
                  {lang === 'am' ? 'የ AI ደረጃ ይምረጡ' : 'Computer Difficulty'}
                </label>
                <div className="chess-difficulty-row">
                  {(['easy', 'medium', 'hard'] as ChessDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`chess-diff-pill ${difficulty === d ? 'active ' + d : ''}`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d === 'easy' && (lang === 'am' ? 'ጀማሪ (Easy)' : 'Beginner (Easy)')}
                      {d === 'medium' && (lang === 'am' ? 'ስልታዊ (Medium)' : 'Tactician (Medium)')}
                      {d === 'hard' && (lang === 'am' ? 'ሊቅ (Hard)' : 'Grandmaster (Hard)')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chess-setup-section">
                <label className="chess-setup-label">
                  {lang === 'am' ? 'ቀለም ይምረጡ' : 'Choose Your Color'}
                </label>
                <div className="chess-color-row">
                  <button
                    type="button"
                    className={`chess-color-choice ${playerColor === 'w' ? 'active' : ''}`}
                    onClick={() => setPlayerColor('w')}
                  >
                    <span className="color-symbol white">♔</span>
                    <span>{lang === 'am' ? 'ነጭ (ቀድሞ የሚጀምር)' : 'White (Moves First)'}</span>
                  </button>
                  <button
                    type="button"
                    className={`chess-color-choice ${playerColor === 'b' ? 'active' : ''}`}
                    onClick={() => setPlayerColor('b')}
                  >
                    <span className="color-symbol black">♚</span>
                    <span>{lang === 'am' ? 'ጥቁር (ሁለተኛ)' : 'Black (Moves Second)'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="chess-start-action">
            <button
              type="button"
              className="chess-launch-button"
              onClick={handleStartGame}
            >
              <span>{lang === 'am' ? 'ጨዋታውን ጀምር' : 'Launch Match'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Active Chess Gameplay ────────────────────────────── */}
      {isPlaying && (
        <div className="chess-gameplay-container">
          {/* Main Board Arena Column */}
          <div className="chess-board-column">
            {/* Top Player Strip (Opponent) */}
            <div className="chess-player-strip top">
              <div className="player-meta">
                <span className={`player-avatar ${boardOrientation === 'w' ? 'black' : 'white'}`}>
                  {boardOrientation === 'w' ? '♚' : '♔'}
                </span>
                <div className="player-text">
                  <span className="player-name">
                    {playMode === 'vs_computer'
                      ? playerColor === 'w'
                        ? lang === 'am' ? `ኮምፒውተር (${difficulty})` : `Computer (${difficulty})`
                        : lang === 'am' ? 'እርስዎ (ጥቁር)' : 'You (Black)'
                      : boardOrientation === 'w'
                        ? lang === 'am' ? 'ተጫዋች 2 (ጥቁር)' : 'Player 2 (Black)'
                        : lang === 'am' ? 'ተጫዋች 1 (ነጭ)' : 'Player 1 (White)'}
                  </span>
                  <div className="player-captured-tray">
                    {(boardOrientation === 'w' ? blackCaptured : whiteCaptured).map((p, i) => (
                      <ChessPieceView
                        key={i}
                        type={p}
                        color={boardOrientation === 'w' ? 'w' : 'b'}
                        className="captured-piece-mini"
                      />
                    ))}
                    {boardOrientation === 'w' && materialAdvantage < 0 && (
                      <span className="material-diff">+{Math.abs(materialAdvantage)}</span>
                    )}
                    {boardOrientation === 'b' && materialAdvantage > 0 && (
                      <span className="material-diff">+{materialAdvantage}</span>
                    )}
                  </div>
                </div>
              </div>

              {((boardOrientation === 'w' && currentTurn === 'b') ||
                (boardOrientation === 'b' && currentTurn === 'w')) && (
                <span className="turn-glow-dot active" />
              )}
            </div>

            {/* 8x8 Chessboard */}
            <div className="chess-board-wrapper">
              <div className="chess-board" role="grid" aria-label="Chessboard">
                {ranks.map((rank) =>
                  files.map((file) => {
                    const square = `${file}${rank}` as Square;
                    const piece = chess.get(square);
                    const isDark =
                      ('a'.charCodeAt(0) + file.charCodeAt(0) + rank) % 2 === 1;
                    const isSelected = selectedSquare === square;
                    const isLastMoveSquare =
                      lastMove && (lastMove.from === square || lastMove.to === square);
                    const isKingInCheck = kingInCheckSquare === square;

                    // Legal move marker
                    const legalMove = legalMovesForSelected.find((m) => m.to === square);
                    const isLegalMove = Boolean(legalMove);
                    const isCapture = isLegalMove && Boolean(piece || legalMove?.flags.includes('e'));

                    return (
                      <div
                        key={square}
                        role="gridcell"
                        aria-label={`${square} ${piece ? `${piece.color} ${piece.type}` : 'empty'}`}
                        className={`chess-square ${isDark ? 'dark-sq' : 'light-sq'} ${
                          isSelected ? 'selected' : ''
                        } ${isLastMoveSquare ? 'last-move' : ''} ${
                          isKingInCheck ? 'in-check' : ''
                        } ${isLegalMove ? 'legal-dest' : ''}`}
                        onClick={() => handleSquareClick(square)}
                      >
                        {/* Algebraic coordinate labels */}
                        {((boardOrientation === 'w' && file === 'a') ||
                          (boardOrientation === 'b' && file === 'h')) && (
                          <span className="coord-rank">{rank}</span>
                        )}
                        {((boardOrientation === 'w' && rank === 1) ||
                          (boardOrientation === 'b' && rank === 8)) && (
                          <span className="coord-file">{file}</span>
                        )}

                        {/* Piece view */}
                        {piece && (
                          <ChessPieceView
                            type={piece.type}
                            color={piece.color}
                            className={`board-piece ${isSelected ? 'floating' : ''}`}
                          />
                        )}

                        {/* Legal move indicator */}
                        {isLegalMove && !isCapture && <span className="legal-dot" />}
                        {isLegalMove && isCapture && <span className="legal-capture-ring" />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pawn Promotion Modal Overlay */}
              {pendingPromotion && (
                <div className="promotion-overlay">
                  <div className="promotion-modal">
                    <h4 className="promotion-title">
                      {lang === 'am' ? 'ወታደር ማሳደግ' : 'Promote Pawn'}
                    </h4>
                    <p className="promotion-subtitle">
                      {lang === 'am'
                        ? 'ወታደርዎን የሚቀይሩበትን የላቀ ቁስ ይምረጡ፡'
                        : 'Select piece for pawn promotion:'}
                    </p>
                    <div className="promotion-pieces">
                      {(['q', 'r', 'b', 'n'] as const).map((pType) => (
                        <button
                          key={pType}
                          type="button"
                          className="promotion-piece-btn"
                          onClick={() => executeMove(pendingPromotion.from, pendingPromotion.to, pType)}
                        >
                          <ChessPieceView type={pType} color={chess.turn()} />
                          <span className="piece-name">
                            {pType === 'q' && (lang === 'am' ? 'ንግስት' : 'Queen')}
                            {pType === 'r' && (lang === 'am' ? 'ግምብ' : 'Rook')}
                            {pType === 'b' && (lang === 'am' ? 'ጳጳስ' : 'Bishop')}
                            {pType === 'n' && (lang === 'am' ? 'ፈረስ' : 'Knight')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Player Strip (Self / Player 1) */}
            <div className="chess-player-strip bottom">
              <div className="player-meta">
                <span className={`player-avatar ${boardOrientation === 'w' ? 'white' : 'black'}`}>
                  {boardOrientation === 'w' ? '♔' : '♚'}
                </span>
                <div className="player-text">
                  <span className="player-name">
                    {playMode === 'vs_computer'
                      ? playerColor === 'w'
                        ? lang === 'am' ? 'እርስዎ (ነጭ)' : 'You (White)'
                        : lang === 'am' ? 'እርስዎ (ጥቁር)' : 'You (Black)'
                      : boardOrientation === 'w'
                        ? lang === 'am' ? 'ተጫዋች 1 (ነጭ)' : 'Player 1 (White)'
                        : lang === 'am' ? 'ተጫዋች 2 (ጥቁር)' : 'Player 2 (Black)'}
                  </span>
                  <div className="player-captured-tray">
                    {(boardOrientation === 'w' ? whiteCaptured : blackCaptured).map((p, i) => (
                      <ChessPieceView
                        key={i}
                        type={p}
                        color={boardOrientation === 'w' ? 'b' : 'w'}
                        className="captured-piece-mini"
                      />
                    ))}
                    {boardOrientation === 'w' && materialAdvantage > 0 && (
                      <span className="material-diff">+{materialAdvantage}</span>
                    )}
                    {boardOrientation === 'b' && materialAdvantage < 0 && (
                      <span className="material-diff">+{Math.abs(materialAdvantage)}</span>
                    )}
                  </div>
                </div>
              </div>

              {((boardOrientation === 'w' && currentTurn === 'w') ||
                (boardOrientation === 'b' && currentTurn === 'b')) && (
                <span className="turn-glow-dot active" />
              )}
            </div>
          </div>

          {/* Right Column: Game HUD, Moves List & Controls */}
          <div className="chess-sidebar-column">
            {/* Status card */}
            <div className="chess-status-card">
              <div className="status-header">
                <span
                  className="status-dot"
                  style={{ backgroundColor: statusBadge.color }}
                />
                <span className="status-text" style={{ color: statusBadge.color }}>
                  {statusBadge.text}
                </span>
              </div>
              <div className="status-sub">
                {currentTurn === 'w'
                  ? lang === 'am' ? 'ተራ: ነጭ ♔' : 'Turn: White ♔'
                  : lang === 'am' ? 'ተራ: ጥቁር ♚' : 'Turn: Black ♚'}
                {' · '}
                {lang === 'am'
                  ? `${Math.floor(history.length / 2) + 1}ኛ እንቅስቃሴ`
                  : `Move ${Math.floor(history.length / 2) + 1}`}
              </div>
            </div>

            {/* Move History Log */}
            <div className="chess-moves-panel">
              <div className="moves-panel-title">
                {lang === 'am' ? 'የእንቅስቃሴዎች መዝገብ' : 'Notation Log'}
              </div>
              <div className="moves-scroll-list" ref={historyScrollRef}>
                {history.length === 0 ? (
                  <div className="moves-empty">
                    {lang === 'am' ? 'እንቅስቃሴዎች እዚህ ይመዘገባሉ' : 'Notation will appear here'}
                  </div>
                ) : (
                  <div className="moves-table">
                    {Array.from({ length: Math.ceil(history.length / 2) }, (_, idx) => {
                      const whiteMove = history[idx * 2];
                      const blackMove = history[idx * 2 + 1];
                      return (
                        <div key={idx} className="moves-row">
                          <span className="move-num">{idx + 1}.</span>
                          <span className="move-san white">{whiteMove?.san}</span>
                          <span className="move-san black">{blackMove?.san || ''}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Control Actions Bar */}
            <div className="chess-controls-grid">
              <button
                type="button"
                className="chess-btn-action"
                onClick={handleUndo}
                disabled={history.length === 0 || isAiThinking || isGameOver}
                title={lang === 'am' ? 'የመጨረሻውን እንቅስቃሴ መልስ' : 'Undo Move'}
              >
                <RotateCcw size={16} />
                <span>{lang === 'am' ? 'መልስ' : 'Undo'}</span>
              </button>

              <button
                type="button"
                className="chess-btn-action"
                onClick={() => setBoardOrientation((o) => (o === 'w' ? 'b' : 'w'))}
                title={lang === 'am' ? 'የሰሌዳ አቅጣጫ ቀይር' : 'Flip Board'}
              >
                <ArrowUpDown size={16} />
                <span>{lang === 'am' ? 'ገልብጥ' : 'Flip'}</span>
              </button>

              <button
                type="button"
                className="chess-btn-action danger"
                onClick={handleResign}
                disabled={isGameOver || history.length === 0}
                title={lang === 'am' ? 'እጅ ስጥ' : 'Resign'}
              >
                <Flag size={16} />
                <span>{lang === 'am' ? 'እጅ ስጥ' : 'Resign'}</span>
              </button>

              <button
                type="button"
                className="chess-btn-action"
                onClick={() => {
                  if (history.length > 0 && !isGameOver) {
                    setShowRestartConfirm(true);
                  } else {
                    handleStartGame();
                  }
                }}
                title={lang === 'am' ? 'አዲስ ጨዋታ' : 'Restart Match'}
              >
                <RotateCw size={16} />
                <span>{lang === 'am' ? 'እንደገና' : 'Restart'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restart Confirmation Modal ──────────────────────── */}
      {showRestartConfirm && (
        <div className="chess-confirm-overlay">
          <div className="chess-confirm-box">
            <ShieldAlert size={32} color="var(--accent-gold)" />
            <h3 className="confirm-title">
              {lang === 'am' ? 'ጨዋታውን እንደገና መጀመር ይፈልጋሉ?' : 'Restart Current Game?'}
            </h3>
            <p className="confirm-desc">
              {lang === 'am'
                ? 'ያለቀው ግስጋሴ ይጠፋል፤ ሰሌዳው ከአዲስ ይጀምራል።'
                : 'Current match progress will be lost and the board will reset.'}
            </p>
            <div className="confirm-buttons">
              <button
                type="button"
                className="confirm-btn cancel"
                onClick={() => setShowRestartConfirm(false)}
              >
                {lang === 'am' ? 'ይቅር' : 'Cancel'}
              </button>
              <button
                type="button"
                className="confirm-btn restart"
                onClick={handleStartGame}
              >
                {lang === 'am' ? 'አዎ፣ እንደገና ጀምር' : 'Yes, Restart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Game Over Result Modal ───────────────────────────── */}
      {isGameOver && gameOverDetails && (
        <div className="chess-result-overlay">
          <div className="chess-result-card">
            <div className="result-icon-glow">
              <Trophy size={38} color="var(--accent-gold)" />
            </div>

            <h3 className="result-headline">{gameOverDetails.title[lang]}</h3>
            <p className="result-subtext">{gameOverDetails.desc[lang]}</p>

            <div className="result-summary-stats">
              <div className="result-stat-pill">
                <span className="stat-label">{lang === 'am' ? 'አጠቃላይ እንቅስቃሴዎች' : 'Total Moves'}</span>
                <span className="stat-value">{history.length}</span>
              </div>
              <div className="result-stat-pill">
                <span className="stat-label">{lang === 'am' ? 'ውጤት' : 'Result'}</span>
                <span className="stat-value">
                  {gameOverDetails.winner === 'draw'
                    ? '½ - ½'
                    : gameOverDetails.winner === 'w'
                      ? '1 - 0'
                      : '0 - 1'}
                </span>
              </div>
            </div>

            <div className="result-modal-actions">
              <button
                type="button"
                className="result-action-btn primary"
                onClick={handleStartGame}
              >
                <RotateCw size={18} />
                <span>{lang === 'am' ? 'እንደገና ተጫወት' : 'Play Again'}</span>
              </button>
              <button
                type="button"
                className="result-action-btn secondary"
                onClick={() => setIsPlaying(false)}
              >
                <span>{lang === 'am' ? 'ወደ መነሻ ተመለስ' : 'Game Options'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
