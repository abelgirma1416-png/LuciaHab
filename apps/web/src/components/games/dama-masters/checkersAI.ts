import type {
  AIDifficulty,
  Board,
  Move,
  PieceColor,
  Position,
} from './types.ts';
import {
  countPieces,
  executeMoveOnBoard,
  getAllLegalMoves,
  getCapturesForPiece,
} from './checkersEngine.ts';

interface EvaluationContext {
  nodesCount: number;
  maxNodes: number;
  startTime: number;
  timeLimitMs: number;
  timedOut: boolean;
}

/**
 * Static board evaluation for Alpha-Beta Minimax.
 * Perspective: positive for `colorToEvaluate`, negative for opponent.
 */
export function evaluateBoard(board: Board, colorToEvaluate: PieceColor): number {
  let score = 0;
  const opponent: PieceColor = colorToEvaluate === 'red' ? 'black' : 'red';

  const { redCount, blackCount, redKings, blackKings } = countPieces(board);

  // Terminal checks
  if (colorToEvaluate === 'red' && blackCount === 0) return 100000;
  if (colorToEvaluate === 'black' && redCount === 0) return 100000;
  if (colorToEvaluate === 'red' && redCount === 0) return -100000;
  if (colorToEvaluate === 'black' && blackCount === 0) return -100000;

  // Material weights
  const MAN_VALUE = 100;
  const KING_VALUE = 185;

  const redMaterial = (redCount - redKings) * MAN_VALUE + redKings * KING_VALUE;
  const blackMaterial = (blackCount - blackKings) * MAN_VALUE + blackKings * KING_VALUE;

  score += colorToEvaluate === 'red' ? (redMaterial - blackMaterial) : (blackMaterial - redMaterial);

  // Positional and strategic weights
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isMyPiece = piece.color === colorToEvaluate;
      const multiplier = isMyPiece ? 1 : -1;

      // 1. Advancement bonus for men (encourages moving toward promotion)
      if (!piece.isKing) {
        const advancement = piece.color === 'red' ? (7 - r) * 5 : r * 5;
        score += multiplier * advancement;
      }

      // 2. Back-row defense anchor (protects against opponent crowning)
      if (piece.color === 'red' && r === 7 && !piece.isKing) {
        score += multiplier * 18;
      } else if (piece.color === 'black' && r === 0 && !piece.isKing) {
        score += multiplier * 18;
      }

      // 3. Center board presence (columns 2, 3, 4, 5, rows 2 to 5)
      if (c >= 2 && c <= 5 && r >= 2 && r <= 5) {
        score += multiplier * (piece.isKing ? 12 : 7);
      }

      // 4. Vulnerable edge penalty (pieces stuck on columns 0 or 7 have less mobility)
      if (c === 0 || c === 7) {
        score -= multiplier * 5;
      }
    }
  }

  // Mobility check (available moves)
  const myMoves = getAllLegalMoves(board, colorToEvaluate);
  const oppMoves = getAllLegalMoves(board, opponent);
  score += (myMoves.length - oppMoves.length) * 3;

  return score;
}

/**
 * Move ordering for Alpha-Beta pruning efficiency.
 * Captures first, then promotions, then central moves.
 */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    // 1. Captures first
    if (a.isCapture && !b.isCapture) return -1;
    if (!a.isCapture && b.isCapture) return 1;

    // 2. Promotion next
    if (a.promotes && !b.promotes) return -1;
    if (!a.promotes && b.promotes) return 1;

    // 3. Move towards center
    const distA = Math.abs(a.to.c - 3.5) + Math.abs(a.to.r - 3.5);
    const distB = Math.abs(b.to.c - 3.5) + Math.abs(b.to.r - 3.5);
    return distA - distB;
  });
}

/**
 * Minimax with Alpha-Beta pruning.
 */
function minimaxAlphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: PieceColor,
  activeJumpPos: Position | null,
  ctx: EvaluationContext
): number {
  ctx.nodesCount++;

  // Check budget constraints
  if (ctx.nodesCount >= ctx.maxNodes || Date.now() - ctx.startTime > ctx.timeLimitMs) {
    ctx.timedOut = true;
    return evaluateBoard(board, aiColor);
  }

  const currentTurn: PieceColor = isMaximizing
    ? aiColor
    : aiColor === 'red'
      ? 'black'
      : 'red';

  const legalMoves = getAllLegalMoves(board, currentTurn, activeJumpPos);

  // Terminal state: game over (no moves)
  if (legalMoves.length === 0) {
    return isMaximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
  }

  // Leaf node
  if (depth <= 0) {
    return evaluateBoard(board, aiColor);
  }

  const orderedMoves = orderMoves(legalMoves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      const { newBoard, crownedNow } = executeMoveOnBoard(board, move);

      // Check multi-jump continuation
      let nextIsMaximizing = false;
      let nextActiveJump: Position | null = null;

      if (move.isCapture && !crownedNow) {
        const furtherJumps = getCapturesForPiece(newBoard, move.to);
        if (furtherJumps.length > 0) {
          nextIsMaximizing = true;
          nextActiveJump = move.to;
        }
      }

      const evalScore = minimaxAlphaBeta(
        newBoard,
        depth - 1,
        alpha,
        beta,
        nextIsMaximizing,
        aiColor,
        nextActiveJump,
        ctx
      );

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Pruning
      if (ctx.timedOut) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      const { newBoard, crownedNow } = executeMoveOnBoard(board, move);

      let nextIsMaximizing = true;
      let nextActiveJump: Position | null = null;

      if (move.isCapture && !crownedNow) {
        const furtherJumps = getCapturesForPiece(newBoard, move.to);
        if (furtherJumps.length > 0) {
          nextIsMaximizing = false;
          nextActiveJump = move.to;
        }
      }

      const evalScore = minimaxAlphaBeta(
        newBoard,
        depth - 1,
        alpha,
        beta,
        nextIsMaximizing,
        aiColor,
        nextActiveJump,
        ctx
      );

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Pruning
      if (ctx.timedOut) break;
    }
    return minEval;
  }
}

/**
 * Easy AI:
 * - Legal moves only.
 * - Always honors mandatory capture (enforced by engine).
 * - Light heuristic with controlled randomness among similarly scored moves.
 */
function selectEasyMove(board: Board, aiColor: PieceColor, activeJumpPos: Position | null): Move {
  const legalMoves = getAllLegalMoves(board, aiColor, activeJumpPos);
  if (legalMoves.length === 0) throw new Error('No legal moves for AI');
  if (legalMoves.length === 1) return legalMoves[0];

  // If moves are captures, pick one (can randomize among captures)
  if (legalMoves[0].isCapture) {
    const scoredCaptures = legalMoves.map((m) => {
      const { newBoard } = executeMoveOnBoard(board, m);
      return { move: m, score: evaluateBoard(newBoard, aiColor) + (Math.random() * 40 - 20) };
    });
    scoredCaptures.sort((a, b) => b.score - a.score);
    return scoredCaptures[0].move;
  }

  // Light evaluation with intentional softness / noise
  const scoredMoves = legalMoves.map((m) => {
    const { newBoard } = executeMoveOnBoard(board, m);
    // Add noise (+/- 60) so easy AI makes casual moves without being totally erratic
    const noise = Math.random() * 120 - 60;
    return { move: m, score: evaluateBoard(newBoard, aiColor) + noise };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

/**
 * Medium AI:
 * - Depth 3 Alpha-Beta search.
 * - Good tactical awareness, avoids obvious blunders.
 */
function selectMediumMove(board: Board, aiColor: PieceColor, activeJumpPos: Position | null): Move {
  const legalMoves = getAllLegalMoves(board, aiColor, activeJumpPos);
  if (legalMoves.length === 0) throw new Error('No legal moves for AI');
  if (legalMoves.length === 1) return legalMoves[0];

  const ctx: EvaluationContext = {
    nodesCount: 0,
    maxNodes: 12000,
    startTime: Date.now(),
    timeLimitMs: 400,
    timedOut: false,
  };

  const orderedMoves = orderMoves(legalMoves);
  let bestMove = orderedMoves[0];
  let maxScore = -Infinity;

  for (const move of orderedMoves) {
    const { newBoard, crownedNow } = executeMoveOnBoard(board, move);

    let nextIsMaximizing = false;
    let nextActiveJump: Position | null = null;

    if (move.isCapture && !crownedNow) {
      const furtherJumps = getCapturesForPiece(newBoard, move.to);
      if (furtherJumps.length > 0) {
        nextIsMaximizing = true;
        nextActiveJump = move.to;
      }
    }

    const score = minimaxAlphaBeta(
      newBoard,
      2, // Search 2 more plies (total 3)
      -Infinity,
      Infinity,
      nextIsMaximizing,
      aiColor,
      nextActiveJump,
      ctx
    );

    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Hard AI:
 * - Depth 5 Alpha-Beta search with move ordering and time budget.
 * - Deep positional knowledge, forced wins, king promotion defense.
 */
function selectHardMove(board: Board, aiColor: PieceColor, activeJumpPos: Position | null): Move {
  const legalMoves = getAllLegalMoves(board, aiColor, activeJumpPos);
  if (legalMoves.length === 0) throw new Error('No legal moves for AI');
  if (legalMoves.length === 1) return legalMoves[0];

  const ctx: EvaluationContext = {
    nodesCount: 0,
    maxNodes: 35000,
    startTime: Date.now(),
    timeLimitMs: 800,
    timedOut: false,
  };

  const orderedMoves = orderMoves(legalMoves);
  let bestMove = orderedMoves[0];
  let maxScore = -Infinity;

  for (const move of orderedMoves) {
    const { newBoard, crownedNow } = executeMoveOnBoard(board, move);

    let nextIsMaximizing = false;
    let nextActiveJump: Position | null = null;

    if (move.isCapture && !crownedNow) {
      const furtherJumps = getCapturesForPiece(newBoard, move.to);
      if (furtherJumps.length > 0) {
        nextIsMaximizing = true;
        nextActiveJump = move.to;
      }
    }

    const score = minimaxAlphaBeta(
      newBoard,
      4, // Search 4 more plies (total 5)
      -Infinity,
      Infinity,
      nextIsMaximizing,
      aiColor,
      nextActiveJump,
      ctx
    );

    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }

    if (ctx.timedOut) break;
  }

  return bestMove;
}

/**
 * Primary sync AI move selector.
 */
export function selectAiMove(
  board: Board,
  aiColor: PieceColor,
  difficulty: AIDifficulty,
  activeJumpPos: Position | null = null
): Move {
  switch (difficulty) {
    case 'easy':
      return selectEasyMove(board, aiColor, activeJumpPos);
    case 'medium':
      return selectMediumMove(board, aiColor, activeJumpPos);
    case 'hard':
      return selectHardMove(board, aiColor, activeJumpPos);
    default:
      return selectMediumMove(board, aiColor, activeJumpPos);
  }
}

/**
 * Safe asynchronous AI move executor with cancellation token.
 * Prevents UI freezes and avoids applying stale AI calculations after restarts.
 */
export async function getAiMoveAsync(
  board: Board,
  aiColor: PieceColor,
  difficulty: AIDifficulty,
  activeJumpPos: Position | null,
  sessionId: number,
  getCurrentSessionId: () => number
): Promise<Move | null> {
  // Pacing delay (300ms) for natural feel
  await new Promise((resolve) => setTimeout(resolve, 300));

  // If game was restarted or changed while waiting:
  if (sessionId !== getCurrentSessionId()) {
    return null;
  }

  const move = selectAiMove(board, aiColor, difficulty, activeJumpPos);

  // Re-verify session validity after computation:
  if (sessionId !== getCurrentSessionId()) {
    return null;
  }

  return move;
}
