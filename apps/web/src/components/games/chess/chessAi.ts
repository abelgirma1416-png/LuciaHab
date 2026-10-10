import { Chess } from 'chess.js';
import type { Move } from 'chess.js';

export type ChessDifficulty = 'easy' | 'medium' | 'hard';

// Material base values
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional piece-square tables (from White's perspective; rank 0 is 8th rank, rank 7 is 1st rank)
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

const PST_MAP: Record<string, number[][]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

/**
 * Static evaluation function.
 * Returns score from White's perspective (+ means White is winning).
 */
export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -999999 : 999999;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type] || 0;
      const table = PST_MAP[piece.type];
      const pstVal = table
        ? piece.color === 'w'
          ? table[r][c]
          : table[7 - r][c]
        : 0;

      const totalPieceVal = baseVal + pstVal;

      if (piece.color === 'w') {
        score += totalPieceVal;
      } else {
        score -= totalPieceVal;
      }
    }
  }

  return score;
}

/**
 * Minimax with Alpha-Beta pruning
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

/**
 * Select the best move for the current turn based on chosen difficulty.
 */
export function selectComputerMove(
  chess: Chess,
  difficulty: ChessDifficulty
): Move | null {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const isWhite = chess.turn() === 'w';

  // 1. Easy Mode: Casual player, mostly random with slight capture/check preference
  if (difficulty === 'easy') {
    // 30% chance to pick a capture or check if available
    const tactical = legalMoves.filter((m) => m.captured || m.san.includes('+') || m.san.includes('#'));
    if (tactical.length > 0 && Math.random() < 0.35) {
      return tactical[Math.floor(Math.random() * tactical.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // 2. Medium Mode: 1-ply tactical evaluation with small noise for variety
  if (difficulty === 'medium') {
    const scoredMoves = legalMoves.map((m) => {
      chess.move(m);
      const score = evaluateBoard(chess);
      chess.undo();
      // Add slight noise (+- 20 centipawns)
      const noise = (Math.random() - 0.5) * 40;
      return { move: m, score: isWhite ? score + noise : -score + noise };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    // Take the best move (or pick among top 2 if close)
    const topMoves = scoredMoves.slice(0, Math.min(2, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  // 3. Hard Mode: Depth-3 Minimax with Alpha-Beta pruning
  let bestMove: Move = legalMoves[0];
  let bestScore = isWhite ? -Infinity : Infinity;

  // Prioritize captures and checks for faster pruning
  const sortedMoves = [...legalMoves].sort((a, b) => {
    const scoreA = (a.captured ? 10 : 0) + (a.san.includes('+') ? 5 : 0);
    const scoreB = (b.captured ? 10 : 0) + (b.san.includes('+') ? 5 : 0);
    return scoreB - scoreA;
  });

  for (const move of sortedMoves) {
    chess.move(move);
    // Immediate mate check
    if (chess.isCheckmate()) {
      chess.undo();
      return move;
    }

    const evalVal = minimax(chess, 2, -Infinity, Infinity, !isWhite);
    chess.undo();

    if (isWhite) {
      if (evalVal > bestScore) {
        bestScore = evalVal;
        bestMove = move;
      }
    } else {
      if (evalVal < bestScore) {
        bestScore = evalVal;
        bestMove = move;
      }
    }
  }

  return bestMove;
}
