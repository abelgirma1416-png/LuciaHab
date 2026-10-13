export type PieceColor = 'red' | 'black';

export type PieceType = 'man' | 'king';

export interface Piece {
  id: string;
  color: PieceColor;
  isKing: boolean;
}

export interface Position {
  r: number;
  c: number;
}

export interface Move {
  from: Position;
  to: Position;
  isCapture: boolean;
  capturedPos?: Position;
  promotes: boolean;
}

export type Board = (Piece | null)[][];

export type GameMode = 'vs_ai' | 'two_player';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type GameWinner = PieceColor | 'draw' | null;

export interface GameResult {
  winner: GameWinner;
  reasonEn: string;
  reasonAm: string;
}

export interface CheckersGameState {
  board: Board;
  currentTurn: PieceColor;
  selectedPos: Position | null;
  activeJumpPos: Position | null;
  lastMove: { from: Position; to: Position } | null;
  isGameOver: boolean;
  result: GameResult | null;
  redPiecesCount: number;
  blackPiecesCount: number;
  redCapturedCount: number;
  blackCapturedCount: number;
  halfMoveClock: number;
  positionHistory: string[];
}
