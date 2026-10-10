export type Language = 'en' | 'am';

export type GameCategory = 'all' | 'math' | 'trivia' | 'memory' | 'chess' | 'puzzle' | 'educational';

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Master';

export type GameStatus = 'available' | 'coming_soon';

export type GameSortOption = 'popular' | 'newest' | 'name_asc' | 'diff_asc' | 'diff_desc';

export interface Game {
  id: string;
  title: string;
  titleAm: string;
  description: string;
  descriptionAm: string;
  category: GameCategory;
  categoryLabel: string;
  categoryLabelAm: string;
  difficulty: GameDifficulty;
  difficultyAm: string;
  icon: string; // Icon identifier or name
  logoUrl?: string; // Optional custom artwork for the game card
  accentColor: string;
  badge?: string;
  badgeAm?: string;
  bestScore?: number;
  maxPointsReward: number;
  rating: number;
  playsCount: number;
  isFeatured?: boolean;
  status: GameStatus; // 'available' | 'coming_soon'
  createdAt: string; // ISO date string for deterministic sorting
  minDurationMinutes?: number;
  engineStatus?: string;
  engineStatusAm?: string;
  rules?: string[];
  rulesAm?: string[];
}
