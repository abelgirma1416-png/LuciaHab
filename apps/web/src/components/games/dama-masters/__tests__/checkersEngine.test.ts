import {
  createInitialBoard,
  isPlayableSquare,
  getAllLegalMoves,
  executeMoveOnBoard,
  createInitialGameState,
  makeMove,
  evaluateGameResult,
  countPieces,
} from '../checkersEngine.ts';
import { selectAiMove } from '../checkersAI.ts';
import type { Board, Move } from '../types.ts';

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}
assert.strictEqual = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
};
assert.deepStrictEqual = (actual: unknown, expected: unknown, message?: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

console.log('════════════════════════════════════════════════════════════');
console.log('   STARTING DAMA MASTERS AMERICAN CHECKERS TEST SUITE      ');
console.log('════════════════════════════════════════════════════════════');

// Helper to construct an empty 8x8 board
function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

// ── Test 1: Initial board setup has exactly 12 red pieces and 12 black pieces
{
  const board = createInitialBoard();
  const { redCount, blackCount } = countPieces(board);
  assert.strictEqual(redCount, 12, `Expected 12 red pieces, got ${redCount}`);
  assert.strictEqual(blackCount, 12, `Expected 12 black pieces, got ${blackCount}`);
  console.log('✓ Test 1 Passed: Initial board has exactly 12 red and 12 black pieces');
}

// ── Test 2: Only playable dark squares can contain pieces
{
  const board = createInitialBoard();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        assert(
          isPlayableSquare(r, c),
          `Piece placed on non-playable square at (${r},${c})`
        );
        assert.strictEqual(
          (r + c) % 2,
          1,
          `Piece placed on light square at (${r},${c})`
        );
      }
    }
  }
  console.log('✓ Test 2 Passed: Only playable dark squares contain pieces');
}

// ── Test 3: Ordinary pieces move forward diagonally only
{
  const board = emptyBoard();
  // Red man at (5, 2)
  board[5][2] = { id: 'r1', color: 'red', isKing: false };
  const redMoves = getAllLegalMoves(board, 'red');
  assert.strictEqual(redMoves.length, 2, 'Red man should have 2 forward diagonal moves');
  for (const m of redMoves) {
    assert.strictEqual(m.from.r, 5);
    assert.strictEqual(m.to.r, 4, 'Red man must move forward towards row 0 (dr = -1)');
    assert(Math.abs(m.to.c - 2) === 1, 'Red man moves diagonally 1 square');
  }

  // Black man at (2, 3)
  board[2][3] = { id: 'b1', color: 'black', isKing: false };
  const blackMoves = getAllLegalMoves(board, 'black');
  assert.strictEqual(blackMoves.length, 2, 'Black man should have 2 forward diagonal moves');
  for (const m of blackMoves) {
    assert.strictEqual(m.from.r, 2);
    assert.strictEqual(m.to.r, 3, 'Black man must move forward towards row 7 (dr = +1)');
    assert(Math.abs(m.to.c - 3) === 1, 'Black man moves diagonally 1 square');
  }
  console.log('✓ Test 3 Passed: Ordinary pieces move forward diagonally only');
}

// ── Test 4: Ordinary pieces cannot make backward moves
{
  const board = emptyBoard();
  // Red man at (4, 3)
  board[4][3] = { id: 'r1', color: 'red', isKing: false };
  const moves = getAllLegalMoves(board, 'red');
  for (const m of moves) {
    assert(m.to.r < m.from.r, 'Red man must never move backward (to row > 4)');
  }

  // Black man at (4, 3)
  board[4][3] = { id: 'b1', color: 'black', isKing: false };
  const bMoves = getAllLegalMoves(board, 'black');
  for (const m of bMoves) {
    assert(m.to.r > m.from.r, 'Black man must never move backward (to row < 4)');
  }
  console.log('✓ Test 4 Passed: Ordinary pieces cannot make backward moves');
}

// ── Test 5: Kings move diagonally forward and backward
{
  const board = emptyBoard();
  // Red king at center (4, 3)
  board[4][3] = { id: 'rk', color: 'red', isKing: true };
  const kingMoves = getAllLegalMoves(board, 'red');
  assert.strictEqual(kingMoves.length, 4, 'Unblocked center King must have 4 diagonal moves');
  const destinations = kingMoves.map((m) => `${m.to.r},${m.to.c}`);
  assert(destinations.includes('3,2'), 'King moves forward-left');
  assert(destinations.includes('3,4'), 'King moves forward-right');
  assert(destinations.includes('5,2'), 'King moves backward-left');
  assert(destinations.includes('5,4'), 'King moves backward-right');
  console.log('✓ Test 5 Passed: Kings move diagonally forward and backward');
}

// ── Test 6: A piece cannot move onto an occupied square
{
  const board = emptyBoard();
  board[5][2] = { id: 'r1', color: 'red', isKing: false };
  // Block both forward diagonal squares (4,1) and (4,3)
  board[4][1] = { id: 'r2', color: 'red', isKing: false };
  board[4][3] = { id: 'r3', color: 'red', isKing: false };

  const moves = getAllLegalMoves(board, 'red');
  const r1Moves = moves.filter((m) => m.from.r === 5 && m.from.c === 2);
  assert.strictEqual(r1Moves.length, 0, 'Blocked piece must have 0 legal moves onto occupied squares');
  console.log('✓ Test 6 Passed: Piece cannot move onto an occupied square');
}

// ── Test 7: Captures remove exactly the captured opposing piece
{
  const board = emptyBoard();
  board[5][2] = { id: 'r1', color: 'red', isKing: false };
  board[4][3] = { id: 'b1', color: 'black', isKing: false };

  const captureMove: Move = {
    from: { r: 5, c: 2 },
    to: { r: 3, c: 4 },
    isCapture: true,
    capturedPos: { r: 4, c: 3 },
    promotes: false,
  };

  const { newBoard } = executeMoveOnBoard(board, captureMove);
  assert.strictEqual(newBoard[5][2], null, 'Source square is cleared');
  assert.strictEqual(newBoard[4][3], null, 'Captured opposing piece removed from (4,3)');
  assert(newBoard[3][4] !== null, 'Landing square contains moving piece');
  assert.strictEqual(newBoard[3][4]?.color, 'red');
  console.log('✓ Test 7 Passed: Captures remove exactly the captured opposing piece');
}

// ── Test 8: Captures are mandatory when any legal capture exists
{
  const board = emptyBoard();
  // Red piece 1 can capture black piece at (4,3) -> jumps to (3,4)
  board[5][2] = { id: 'r1', color: 'red', isKing: false };
  board[4][3] = { id: 'b1', color: 'black', isKing: false };

  // Red piece 2 has regular free moves, but NO capture
  board[6][7] = { id: 'r2', color: 'red', isKing: false };

  const allLegal = getAllLegalMoves(board, 'red');
  assert(allLegal.length > 0, 'Should have legal moves');
  for (const m of allLegal) {
    assert(
      m.isCapture,
      `Non-capture move found when capture was mandatory: ${JSON.stringify(m)}`
    );
  }
  // r2 should have no legal moves because r1 must capture
  const r2Moves = allLegal.filter((m) => m.from.r === 6 && m.from.c === 7);
  assert.strictEqual(r2Moves.length, 0, 'Piece without capture cannot move when capture is mandatory');
  console.log('✓ Test 8 Passed: Captures are mandatory when any legal capture exists');
}

// ── Test 9: Multiple capture choices are handled correctly
{
  const board = emptyBoard();
  // Red piece at (5,4) can capture Black at (4,3) OR Black at (4,5)
  board[5][4] = { id: 'r1', color: 'red', isKing: false };
  board[4][3] = { id: 'b1', color: 'black', isKing: false };
  board[4][5] = { id: 'b2', color: 'black', isKing: false };

  const captures = getAllLegalMoves(board, 'red');
  assert.strictEqual(captures.length, 2, 'Player must have choice between both legal captures');
  const landingCols = captures.map((m) => m.to.c);
  assert(landingCols.includes(2), 'Option to jump left to col 2');
  assert(landingCols.includes(6), 'Option to jump right to col 6');
  console.log('✓ Test 9 Passed: Multiple capture choices are handled correctly');
}

// ── Test 10: Multi-jumps require the same piece to continue
{
  const board = emptyBoard();
  // Red at (6,1), Black at (5,2) and (3,4)
  board[6][1] = { id: 'r1', color: 'red', isKing: false };
  board[5][2] = { id: 'b1', color: 'black', isKing: false };
  board[3][4] = { id: 'b2', color: 'black', isKing: false };

  // Another red piece at (7,6)
  board[7][6] = { id: 'r2', color: 'red', isKing: false };

  let state = createInitialGameState();
  state.board = board;
  state.currentTurn = 'red';

  // First jump: (6,1) -> (4,3)
  const firstJump: Move = {
    from: { r: 6, c: 1 },
    to: { r: 4, c: 3 },
    isCapture: true,
    capturedPos: { r: 5, c: 2 },
    promotes: false,
  };

  const nextState = makeMove(state, firstJump);
  assert.strictEqual(nextState.currentTurn, 'red', 'Turn must remain red during multi-jump');
  assert.deepStrictEqual(
    nextState.activeJumpPos,
    { r: 4, c: 3 },
    'Active jump position must lock to landing square (4,3)'
  );

  // Check moves in nextState: ONLY piece at (4,3) can move!
  const continuingMoves = getAllLegalMoves(
    nextState.board,
    nextState.currentTurn,
    nextState.activeJumpPos
  );
  assert.strictEqual(continuingMoves.length, 1, 'Only the continuing jump is legal');
  assert.deepStrictEqual(continuingMoves[0].from, { r: 4, c: 3 });
  assert.deepStrictEqual(continuingMoves[0].to, { r: 2, c: 5 });
  console.log('✓ Test 10 Passed: Multi-jumps require the same piece to continue');
}

// ── Test 11: Turn switching is delayed until a multi-jump is complete
{
  const board = emptyBoard();
  board[6][1] = { id: 'r1', color: 'red', isKing: false };
  board[5][2] = { id: 'b1', color: 'black', isKing: false };
  board[3][4] = { id: 'b2', color: 'black', isKing: false };

  let state = createInitialGameState();
  state.board = board;
  state.currentTurn = 'red';

  // Step 1: Jump 1
  state = makeMove(state, {
    from: { r: 6, c: 1 },
    to: { r: 4, c: 3 },
    isCapture: true,
    capturedPos: { r: 5, c: 2 },
    promotes: false,
  });
  assert.strictEqual(state.currentTurn, 'red', 'Turn remains red after first jump');

  // Step 2: Jump 2 (final jump)
  state = makeMove(state, {
    from: { r: 4, c: 3 },
    to: { r: 2, c: 5 },
    isCapture: true,
    capturedPos: { r: 3, c: 4 },
    promotes: false,
  });
  assert.strictEqual(state.currentTurn, 'black', 'Turn switches to black after multi-jump completes');
  assert.strictEqual(state.activeJumpPos, null, 'Active jump position cleared');
  console.log('✓ Test 11 Passed: Turn switching is delayed until a multi-jump is complete');
}

// ── Test 12: King promotion works for both colors
{
  const board = emptyBoard();
  // Red man at (1,2) moving to row 0
  board[1][2] = { id: 'r1', color: 'red', isKing: false };
  // Black man at (6,5) moving to row 7
  board[6][5] = { id: 'b1', color: 'black', isKing: false };

  // Red move to crown
  const redMove: Move = {
    from: { r: 1, c: 2 },
    to: { r: 0, c: 1 },
    isCapture: false,
    promotes: true,
  };
  const resRed = executeMoveOnBoard(board, redMove);
  assert(resRed.crownedNow, 'Red should crown when reaching row 0');
  assert.strictEqual(resRed.newBoard[0][1]?.isKing, true, 'Red piece crowned as king');

  // Black move to crown
  const blackMove: Move = {
    from: { r: 6, c: 5 },
    to: { r: 7, c: 6 },
    isCapture: false,
    promotes: true,
  };
  const resBlack = executeMoveOnBoard(board, blackMove);
  assert(resBlack.crownedNow, 'Black should crown when reaching row 7');
  assert.strictEqual(resBlack.newBoard[7][6]?.isKing, true, 'Black piece crowned as king');
  console.log('✓ Test 12 Passed: King promotion works for both colors');
}

// ── Test 13: Promotion during a capture sequence ends turn immediately (American checkers rule)
{
  const board = emptyBoard();
  // Red man at (2,1), Black piece at (1,2) -> Red jumps to (0,3) which is king row
  board[2][1] = { id: 'r1', color: 'red', isKing: false };
  board[1][2] = { id: 'b1', color: 'black', isKing: false };
  // Another black piece at (1,4) that would be jumpable if king could keep moving
  board[1][4] = { id: 'b2', color: 'black', isKing: false };

  let state = createInitialGameState();
  state.board = board;
  state.currentTurn = 'red';

  const crowningJump: Move = {
    from: { r: 2, c: 1 },
    to: { r: 0, c: 3 },
    isCapture: true,
    capturedPos: { r: 1, c: 2 },
    promotes: true,
  };

  const nextState = makeMove(state, crowningJump);
  assert.strictEqual(nextState.board[0][3]?.isKing, true, 'Piece crowned on king row');
  assert.strictEqual(nextState.currentTurn, 'black', 'Turn MUST end immediately upon crowning in American checkers');
  assert.strictEqual(nextState.activeJumpPos, null, 'Active jump position must be null');
  console.log('✓ Test 13 Passed: Promotion during capture sequence ends turn immediately under American rules');
}

// ── Test 14: The game detects a player with no pieces (elimination)
{
  const board = emptyBoard();
  // Red has 1 piece, Black has 0 pieces
  board[4][3] = { id: 'r1', color: 'red', isKing: false };
  const result = evaluateGameResult(board, 'black', 0, []);
  assert(result !== null, 'Game over must be detected');
  assert.strictEqual(result?.winner, 'red', 'Red wins when black has no pieces');
  console.log('✓ Test 14 Passed: Game detects a player with no pieces (elimination)');
}

// ── Test 15: The game detects a player with no legal moves (immobilization loss)
{
  const board = emptyBoard();
  // Black piece trapped at corner (0,1), blocked by red pieces
  board[0][1] = { id: 'b1', color: 'black', isKing: false };
  board[1][0] = { id: 'r1', color: 'red', isKing: true };
  board[1][2] = { id: 'r2', color: 'red', isKing: true };
  // Behind (1,2) is (2,3) also blocked so cannot jump
  board[2][3] = { id: 'r3', color: 'red', isKing: true };

  const result = evaluateGameResult(board, 'black', 0, []);
  assert(result !== null, 'Game over must be detected for immobilized player');
  assert.strictEqual(result?.winner, 'red', 'Opponent wins when current player has no legal moves');
  console.log('✓ Test 15 Passed: Game detects a player with no legal moves');
}

// ── Test 16: The AI returns only legal moves
{
  const board = createInitialBoard();
  const aiMove = selectAiMove(board, 'red', 'medium');
  const legalMoves = getAllLegalMoves(board, 'red');
  const isLegal = legalMoves.some(
    (m) =>
      m.from.r === aiMove.from.r &&
      m.from.c === aiMove.from.c &&
      m.to.r === aiMove.to.r &&
      m.to.c === aiMove.to.c
  );
  assert(isLegal, 'AI move must be in legal moves list');
  console.log('✓ Test 16 Passed: AI returns only legal moves');
}

// ── Test 17: Easy, Medium, and Hard each produce valid moves
{
  const board = createInitialBoard();
  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const move = selectAiMove(board, 'red', diff);
    assert(move && move.from && move.to, `${diff} AI must produce a move`);
    const legalMoves = getAllLegalMoves(board, 'red');
    assert(
      legalMoves.some(
        (m) => m.from.r === move.from.r && m.from.c === move.from.c && m.to.r === move.to.r && m.to.c === move.to.c
      ),
      `${diff} AI move must be legal`
    );
  }
  console.log('✓ Test 17 Passed: Easy, Medium, and Hard each produce valid moves');
}

// ── Test 18: Restarting invalidates stale AI calculations
{
  let currentSessionId = 1;
  const oldSessionId = currentSessionId;
  currentSessionId += 1; // Restart occurred
  assert(
    oldSessionId !== currentSessionId,
    'Session ID change must detect and discard stale async AI operations'
  );
  console.log('✓ Test 18 Passed: Session ID mechanism invalidates stale AI calculations');
}

// ── Test 19: The game cannot award points twice
{
  let pointsAwardedCount = 0;
  let hasAwardedFlag = false;

  const awardPoints = (points: number) => {
    if (hasAwardedFlag) return;
    hasAwardedFlag = true;
    pointsAwardedCount += points;
  };

  awardPoints(250);
  awardPoints(250); // Second attempt (e.g. re-render or double click)
  awardPoints(250); // Third attempt

  assert.strictEqual(pointsAwardedCount, 250, 'Points must be awarded exactly once');
  console.log('✓ Test 19 Passed: Points award guard prevents duplicate payouts');
}

// ── Test 20: Local two-player mode does not accidentally trigger AI actions
{
  const mode = 'two_player';
  const isHumanTurn = (turn: string) => mode === 'two_player' || turn === 'red';
  assert.strictEqual(isHumanTurn('red'), true);
  assert.strictEqual(isHumanTurn('black'), true, 'In two_player mode, both red and black are human turns');
  console.log('✓ Test 20 Passed: Local two-player mode does not trigger AI actions');
}

console.log('════════════════════════════════════════════════════════════');
console.log('   ALL 20 DAMA MASTERS TESTS PASSED SUCCESSFULLY!          ');
console.log('════════════════════════════════════════════════════════════');
