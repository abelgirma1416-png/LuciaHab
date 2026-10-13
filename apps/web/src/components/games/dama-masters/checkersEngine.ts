import type {
  Board,
  CheckersGameState,
  GameResult,
  Move,
  Piece,
  PieceColor,
  Position,
} from './types.ts';

/**
 * Standard 8x8 American Checkers playable square check.
 * Only dark squares where (r + c) % 2 === 1 are playable.
 */
export function isPlayableSquare(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8 && (r + c) % 2 === 1;
}

/**
 * Creates the initial 8x8 checkers board with 12 Red and 12 Black pieces.
 * Red starts at rows 5-7 (bottom) and moves towards row 0.
 * Black starts at rows 0-2 (top) and moves towards row 7.
 */
export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isPlayableSquare(r, c)) {
        if (r < 3) {
          board[r][c] = {
            id: `b_${r}_${c}`,
            color: 'black',
            isKing: false,
          };
        } else if (r > 4) {
          board[r][c] = {
            id: `r_${r}_${c}`,
            color: 'red',
            isKing: false,
          };
        }
      }
    }
  }

  return board;
}

/**
 * Clone board deeply for immutable state transitions.
 */
export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((piece) => (piece ? { ...piece } : null))
  );
}

/**
 * Serialize board state to a concise string for repetition tracking.
 */
export function serializeBoardState(board: Board, turn: PieceColor): string {
  let str = `${turn}:`;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isPlayableSquare(r, c)) {
        const piece = board[r][c];
        if (!piece) {
          str += '.';
        } else if (piece.color === 'red') {
          str += piece.isKing ? 'R' : 'r';
        } else {
          str += piece.isKing ? 'B' : 'b';
        }
      }
    }
  }
  return str;
}

/**
 * Gets allowed diagonal step directions for a piece.
 * Red man: dr = -1 (upwards)
 * Black man: dr = +1 (downwards)
 * King: dr = -1 and +1 (both directions)
 */
function getStepDirections(piece: Piece): Array<{ dr: number; dc: number }> {
  if (piece.isKing) {
    return [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];
  }

  if (piece.color === 'red') {
    return [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
    ];
  }

  return [
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 },
  ];
}

/**
 * Check if landing on destination causes king promotion for a man.
 * Red crowns at row 0; Black crowns at row 7.
 */
export function checkWillPromote(piece: Piece, targetRow: number): boolean {
  if (piece.isKing) return false;
  if (piece.color === 'red' && targetRow === 0) return true;
  if (piece.color === 'black' && targetRow === 7) return true;
  return false;
}

/**
 * Finds all legal capture jumps available for a specific piece at `pos`.
 */
export function getCapturesForPiece(board: Board, pos: Position): Move[] {
  const piece = board[pos.r][pos.c];
  if (!piece) return [];

  const moves: Move[] = [];
  const dirs = getStepDirections(piece);

  for (const { dr, dc } of dirs) {
    const midR = pos.r + dr;
    const midC = pos.c + dc;
    const landR = pos.r + dr * 2;
    const landC = pos.c + dc * 2;

    if (isPlayableSquare(landR, landC) && board[landR][landC] === null) {
      if (isPlayableSquare(midR, midC)) {
        const jumpedPiece = board[midR][midC];
        if (jumpedPiece && jumpedPiece.color !== piece.color) {
          moves.push({
            from: { r: pos.r, c: pos.c },
            to: { r: landR, c: landC },
            isCapture: true,
            capturedPos: { r: midR, c: midC },
            promotes: checkWillPromote(piece, landR),
          });
        }
      }
    }
  }

  return moves;
}

/**
 * Finds all regular (non-capture) 1-step moves for a specific piece at `pos`.
 */
export function getNonCapturesForPiece(board: Board, pos: Position): Move[] {
  const piece = board[pos.r][pos.c];
  if (!piece) return [];

  const moves: Move[] = [];
  const dirs = getStepDirections(piece);

  for (const { dr, dc } of dirs) {
    const nextR = pos.r + dr;
    const nextC = pos.c + dc;

    if (isPlayableSquare(nextR, nextC) && board[nextR][nextC] === null) {
      moves.push({
        from: { r: pos.r, c: pos.c },
        to: { r: nextR, c: nextC },
        isCapture: false,
        promotes: checkWillPromote(piece, nextR),
      });
    }
  }

  return moves;
}

/**
 * Computes all legal moves for the current turn obeying American Checkers rules:
 * 1. If an active jump sequence is ongoing (multi-jump), ONLY the active piece can move, and it must capture.
 * 2. If any piece on the board has a legal capture, capture is MANDATORY for all pieces.
 * 3. Non-capturing moves are only returned if NO captures exist.
 */
export function getAllLegalMoves(
  board: Board,
  turn: PieceColor,
  activeJumpPos: Position | null = null
): Move[] {
  // If in the middle of a multi-jump sequence:
  if (activeJumpPos) {
    const piece = board[activeJumpPos.r][activeJumpPos.c];
    if (piece && piece.color === turn) {
      return getCapturesForPiece(board, activeJumpPos);
    }
    return [];
  }

  // 1. Scan board for any available captures
  const allCaptures: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        const captures = getCapturesForPiece(board, { r, c });
        if (captures.length > 0) {
          allCaptures.push(...captures);
        }
      }
    }
  }

  // Mandatory capture rule: If captures exist, only captures are legal!
  if (allCaptures.length > 0) {
    return allCaptures;
  }

  // 2. Otherwise, collect all regular non-capturing moves
  const allNonCaptures: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        const regular = getNonCapturesForPiece(board, { r, c });
        if (regular.length > 0) {
          allNonCaptures.push(...regular);
        }
      }
    }
  }

  return allNonCaptures;
}

/**
 * Filter legal moves for a specifically selected piece square.
 */
export function getLegalMovesForSelection(
  board: Board,
  pos: Position,
  turn: PieceColor,
  activeJumpPos: Position | null = null
): Move[] {
  const piece = board[pos.r][pos.c];
  if (!piece || piece.color !== turn) return [];

  // In active multi-jump, only the active jumping piece can be selected
  if (activeJumpPos && (pos.r !== activeJumpPos.r || pos.c !== activeJumpPos.c)) {
    return [];
  }

  const allLegal = getAllLegalMoves(board, turn, activeJumpPos);
  return allLegal.filter((m) => m.from.r === pos.r && m.from.c === pos.c);
}

/**
 * Count active pieces on the board.
 */
export function countPieces(board: Board): {
  redCount: number;
  blackCount: number;
  redKings: number;
  blackKings: number;
} {
  let redCount = 0;
  let blackCount = 0;
  let redKings = 0;
  let blackKings = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        if (p.color === 'red') {
          redCount++;
          if (p.isKing) redKings++;
        } else {
          blackCount++;
          if (p.isKing) blackKings++;
        }
      }
    }
  }

  return { redCount, blackCount, redKings, blackKings };
}

/**
 * Executes a move on the board, updating positions, removing jumped pieces,
 * and crowning when reaching the back rank.
 * Returns the updated board and whether the moving piece was crowned on this move.
 */
export function executeMoveOnBoard(
  board: Board,
  move: Move
): { newBoard: Board; crownedNow: boolean } {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.r][move.from.c];
  if (!piece) {
    throw new Error(`No piece at source square ${move.from.r},${move.from.c}`);
  }

  // Remove piece from source
  newBoard[move.from.r][move.from.c] = null;

  // Remove captured opponent piece
  if (move.isCapture && move.capturedPos) {
    newBoard[move.capturedPos.r][move.capturedPos.c] = null;
  }

  // Crown check
  let crownedNow = false;
  if (move.promotes && !piece.isKing) {
    piece.isKing = true;
    crownedNow = true;
  }

  // Place piece on destination
  newBoard[move.to.r][move.to.c] = piece;

  return { newBoard, crownedNow };
}

/**
 * Evaluates the game state for win, loss, or draw.
 */
export function evaluateGameResult(
  board: Board,
  nextTurn: PieceColor,
  halfMoveClock: number,
  positionHistory: string[]
): GameResult | null {
  const { redCount, blackCount } = countPieces(board);

  // 1. Elimination win
  if (redCount === 0) {
    return {
      winner: 'black',
      reasonEn: 'Black wins! All Red pieces eliminated.',
      reasonAm: 'ጥቁር አሸንፏል! ሁሉም የቀይ ጠጠሮች ተይዘዋል።',
    };
  }
  if (blackCount === 0) {
    return {
      winner: 'red',
      reasonEn: 'Red wins! All Black pieces eliminated.',
      reasonAm: 'ቀይ አሸንፏል! ሁሉም የጥቁር ጠጠሮች ተይዘዋል።',
    };
  }

  // 2. Trapped / No legal moves win (stalemate in American checkers is a loss for player with no moves)
  const legalMoves = getAllLegalMoves(board, nextTurn);
  if (legalMoves.length === 0) {
    const winner: PieceColor = nextTurn === 'red' ? 'black' : 'red';
    return {
      winner,
      reasonEn: `${winner === 'red' ? 'Red' : 'Black'} wins! ${nextTurn === 'red' ? 'Red' : 'Black'} has no legal moves.`,
      reasonAm: `${winner === 'red' ? 'ቀይ' : 'ጥቁር'} አሸንፏል! ${nextTurn === 'red' ? 'ቀይ' : 'ጥቁር'} ምንም እንቅስቃሴ የለውም።`,
    };
  }

  // 3. Draw: 40 full moves (80 half-moves) without capture or man advancement
  if (halfMoveClock >= 80) {
    return {
      winner: 'draw',
      reasonEn: 'Game declared a draw by the 40-move rule (no progress made).',
      reasonAm: 'በ40 እንቅስቃሴዎች ደንብ ጨዋታው አቻ ተጠናቋል (ምንም ግስጋሴ የለም)።',
    };
  }

  // 4. Draw: Threefold repetition
  const currentHash = serializeBoardState(board, nextTurn);
  const repetitions = positionHistory.filter((h) => h === currentHash).length;
  if (repetitions >= 3) {
    return {
      winner: 'draw',
      reasonEn: 'Draw by threefold position repetition.',
      reasonAm: 'ተመሳሳይ የቦታ ድግግሞሽ በ3 ጊዜ በመከሰቱ አቻ ተጠናቋል።',
    };
  }

  return null;
}

/**
 * Initializes a full CheckersGameState object.
 */
export function createInitialGameState(): CheckersGameState {
  const board = createInitialBoard();
  const hash = serializeBoardState(board, 'red');

  return {
    board,
    currentTurn: 'red',
    selectedPos: null,
    activeJumpPos: null,
    lastMove: null,
    isGameOver: false,
    result: null,
    redPiecesCount: 12,
    blackPiecesCount: 12,
    redCapturedCount: 0,
    blackCapturedCount: 0,
    halfMoveClock: 0,
    positionHistory: [hash],
  };
}

/**
 * Core game turn step handler. Validates, applies move, handles multi-jumps,
 * crowns, turns, and game-over conditions.
 */
export function makeMove(
  state: CheckersGameState,
  move: Move
): CheckersGameState {
  if (state.isGameOver) return state;

  // Validate that the move is in current legal moves
  const legalMoves = getAllLegalMoves(
    state.board,
    state.currentTurn,
    state.activeJumpPos
  );
  const isLegal = legalMoves.some(
    (m) =>
      m.from.r === move.from.r &&
      m.from.c === move.from.c &&
      m.to.r === move.to.r &&
      m.to.c === move.to.c
  );

  if (!isLegal) {
    throw new Error('Illegal move attempted');
  }

  // Execute on board
  const { newBoard, crownedNow } = executeMoveOnBoard(state.board, move);

  // Update piece counts
  const { redCount, blackCount } = countPieces(newBoard);
  const redCaptured = 12 - blackCount;
  const blackCaptured = 12 - redCount;

  // Half-move clock reset condition: capture or man move resets clock
  const isManMove = !state.board[move.from.r][move.from.c]?.isKing;
  const newHalfMoveClock =
    move.isCapture || isManMove ? 0 : state.halfMoveClock + 1;

  // Check multi-jump continuation:
  // Under American checkers rules:
  // "A piece that reaches the king row during a capture sequence becomes a king,
  // and its turn ends immediately under standard American checkers rules."
  if (move.isCapture && !crownedNow) {
    const furtherJumps = getCapturesForPiece(newBoard, move.to);
    if (furtherJumps.length > 0) {
      // The same piece MUST continue capturing!
      return {
        ...state,
        board: newBoard,
        selectedPos: move.to,
        activeJumpPos: move.to,
        lastMove: { from: move.from, to: move.to },
        redPiecesCount: redCount,
        blackPiecesCount: blackCount,
        redCapturedCount: redCaptured,
        blackCapturedCount: blackCaptured,
        halfMoveClock: newHalfMoveClock,
      };
    }
  }

  // Turn is complete: switch player
  const nextTurn: PieceColor = state.currentTurn === 'red' ? 'black' : 'red';
  const newHash = serializeBoardState(newBoard, nextTurn);
  const newHistory = [...state.positionHistory, newHash];

  // Evaluate win/draw
  const result = evaluateGameResult(
    newBoard,
    nextTurn,
    newHalfMoveClock,
    newHistory
  );

  return {
    board: newBoard,
    currentTurn: nextTurn,
    selectedPos: null,
    activeJumpPos: null,
    lastMove: { from: move.from, to: move.to },
    isGameOver: result !== null,
    result,
    redPiecesCount: redCount,
    blackPiecesCount: blackCount,
    redCapturedCount: redCaptured,
    blackCapturedCount: blackCaptured,
    halfMoveClock: newHalfMoveClock,
    positionHistory: newHistory,
  };
}
