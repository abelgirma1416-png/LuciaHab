import React from 'react';
import { Crown } from 'lucide-react';
import type { Board, Move, Position } from './types';
import { isPlayableSquare } from './checkersEngine';

interface CheckersBoardProps {
  board: Board;
  selectedPos: Position | null;
  legalMoves: Move[];
  lastMove: { from: Position; to: Position } | null;
  activeJumpPos: Position | null;
  onSquareClick: (pos: Position) => void;
  boardFlipped?: boolean;
  animatingMove?: { from: Position; to: Position; deltaRow: number; deltaCol: number } | null;
  capturedPos?: Position | null;
  crowningPos?: Position | null;
}

export const CheckersBoard: React.FC<CheckersBoardProps> = ({
  board,
  selectedPos,
  legalMoves,
  lastMove,
  activeJumpPos,
  onSquareClick,
  boardFlipped = false,
  animatingMove = null,
  capturedPos = null,
  crowningPos = null,
}) => {
  const rowIndices = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colIndices = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  // Map destination positions of legal moves for fast lookup
  const destinationMap = new Map<string, Move>();
  legalMoves.forEach((m) => {
    destinationMap.set(`${m.to.r},${m.to.c}`, m);
  });

  return (
    <div className="checkers-board-wrapper" role="region" aria-label="Checkers Board">
      <div className="checkers-board-frame">
        <div className="checkers-board-grid">
          {rowIndices.map((r) =>
            colIndices.map((c) => {
              const playable = isPlayableSquare(r, c);
              const piece = board[r][c];
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const moveTarget = destinationMap.get(`${r},${c}`);
              const isDestination = Boolean(moveTarget);
              const isCaptureDest = moveTarget?.isCapture;
              const isLastMoveFrom = lastMove?.from.r === r && lastMove?.from.c === c;
              const isLastMoveTo = lastMove?.to.r === r && lastMove?.to.c === c;
              const isActiveJump = activeJumpPos?.r === r && activeJumpPos?.c === c;

              const squareClasses = [
                'checkers-square',
                playable ? 'square-dark' : 'square-light',
                isSelected ? 'square-selected' : '',
                isLastMoveFrom || isLastMoveTo ? 'square-last-move' : '',
                isDestination ? 'square-destination' : '',
                isCaptureDest ? 'square-capture-dest' : '',
                isActiveJump ? 'square-active-jump' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={squareClasses}
                  onClick={() => onSquareClick({ r, c })}
                  aria-label={`Square ${String.fromCharCode(65 + c)}${8 - r}${
                    piece ? `, contains ${piece.color} ${piece.isKing ? 'king' : 'piece'}` : ''
                  }`}
                  disabled={!playable}
                >
                  {/* Rank / File coordinate indicators on edges */}
                  {c === (boardFlipped ? 7 : 0) && (
                    <span className="coord-rank">{8 - r}</span>
                  )}
                  {r === (boardFlipped ? 0 : 7) && (
                    <span className="coord-file">{String.fromCharCode(65 + c)}</span>
                  )}

                  {/* Destination Highlight Indicators */}
                  {isDestination && (
                    <div
                      className={`dest-marker ${isCaptureDest ? 'dest-capture-marker' : 'dest-move-marker'}`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Checkers Piece with tactical animations */}
                  {(() => {
                    const isMoving = animatingMove && animatingMove.from.r === r && animatingMove.from.c === c;
                    const isCaptured = capturedPos && capturedPos.r === r && capturedPos.c === c;
                    const isCrowning = crowningPos && crowningPos.r === r && crowningPos.c === c;
                    const isDestOfMoving = animatingMove && animatingMove.to.r === r && animatingMove.to.c === c;

                    if (isMoving && piece) {
                      return (
                        <div
                          className={`checkers-piece piece-${piece.color} ${
                            piece.isKing ? 'piece-king' : ''
                          } checkers-animating-slide`}
                          style={
                            {
                              '--dx': animatingMove.deltaCol,
                              '--dy': animatingMove.deltaRow,
                            } as React.CSSProperties
                          }
                          aria-hidden="true"
                        >
                          <div className="piece-inner-ring">
                            <div className="piece-center-core">
                              {piece.isKing && (
                                <Crown
                                  size={20}
                                  strokeWidth={2.6}
                                  className="king-crown-icon"
                                  fill="#f59e0b"
                                  color="#fffbeb"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isCaptured && piece) {
                      return (
                        <div
                          className={`checkers-piece piece-${piece.color} ${
                            piece.isKing ? 'piece-king' : ''
                          } checkers-captured-pulse-dissolve`}
                          aria-hidden="true"
                        >
                          <div className="piece-inner-ring">
                            <div className="piece-center-core">
                              {piece.isKing && (
                                <Crown
                                  size={20}
                                  strokeWidth={2.6}
                                  className="king-crown-icon"
                                  fill="#f59e0b"
                                  color="#fffbeb"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Hide piece at destination while moving piece is sliding toward it
                    if (isDestOfMoving && piece && !isMoving) {
                      return null;
                    }

                    if (piece) {
                      return (
                        <div
                          className={`checkers-piece piece-${piece.color} ${
                            piece.isKing ? 'piece-king' : ''
                          } ${isSelected ? 'piece-selected-pulse' : ''} ${
                            isActiveJump ? 'piece-active-jumping' : ''
                          } ${isCrowning ? 'piece-crowning-celebration' : ''}`}
                          aria-hidden="true"
                        >
                          <div className="piece-inner-ring">
                            <div className="piece-center-core">
                              {piece.isKing && (
                                <Crown
                                  size={20}
                                  strokeWidth={2.6}
                                  className="king-crown-icon"
                                  fill="#f59e0b"
                                  color="#fffbeb"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
