import React from 'react';
import { CHESS_PIECE_SVGS } from './pieceSvgs';

interface ChessPieceViewProps {
  type: string;
  color: 'w' | 'b';
  className?: string;
  style?: React.CSSProperties;
}

export const ChessPieceView: React.FC<ChessPieceViewProps> = ({ type, color, className, style }) => {
  const key = `${color}${type.toUpperCase()}`;
  const svgHtml = CHESS_PIECE_SVGS[key];

  if (!svgHtml) {
    return null;
  }

  return (
    <span
      className={`chess-piece-svg ${className || ''}`}
      style={style}
      aria-label={`${color === 'w' ? 'White' : 'Black'} ${type}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};
