import React from 'react';
import {
  Calculator,
  Brain,
  Layers,
  Crown,
  BookOpen,
  Cpu,
  Gamepad2,
} from 'lucide-react';

interface GameIconProps {
  iconName: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({
  iconName,
  size = 24,
  strokeWidth = 2,
  color,
  className,
}) => {
  switch (iconName.toLowerCase()) {
    case 'calculator':
    case 'math':
      return <Calculator size={size} strokeWidth={strokeWidth} color={color} className={className} />;
    case 'brain':
    case 'trivia':
      return <Brain size={size} strokeWidth={strokeWidth} color={color} className={className} />;
    case 'layers':
    case 'braincircuit':
    case 'memory':
      return <Layers size={size} strokeWidth={strokeWidth} color={color} className={className} />;
    case 'crown':
    case 'chess':
    case 'checkers':
    case 'dama':
      return <Crown size={size} strokeWidth={strokeWidth} color={color} className={className} />;
    case 'bookopen':
    case 'book':
    case 'educational':
      return <BookOpen size={size} strokeWidth={strokeWidth} color={color} className={className} />;
    case 'cpu':
    case 'puzzle':
      return <Cpu size={size} strokeWidth={strokeWidth} color={color} className={className} />;
    default:
      return <Gamepad2 size={size} strokeWidth={strokeWidth} color={color} className={className} />;
  }
};
