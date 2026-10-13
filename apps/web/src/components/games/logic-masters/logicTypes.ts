// ─────────────────────────────────────────────────────────────────────────────
//  Logic Masters – Shared Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type LogicDifficulty = 'easy' | 'medium' | 'hard';

export type LogicCategory =
  | 'number_sequence'
  | 'pattern_recognition'
  | 'deductive_reasoning'
  | 'odd_one_out'
  | 'math_logic'
  | 'spatial_sequence';

export type LogicGameMode = 'quick' | 'practice' | 'timed';

export type QuestionCountChoice = 10 | 20 | 50;

// ─────────────────────────────────────────────────────────────────────────────
//  Question Schema
// ─────────────────────────────────────────────────────────────────────────────

export interface LogicQuestion {
  /** Stable unique identifier, e.g. "lm_001" */
  id: string;
  category: LogicCategory;
  difficulty: LogicDifficulty;
  /** English question text */
  question: string;
  /** Amharic question text */
  questionAm: string;
  /** English answer options, must have ≥ 2 entries (normally 4) */
  options: string[];
  /** Amharic answer options, same order as options */
  optionsAm: string[];
  /**
   * The exact value of the correct option (matches one of options[]).
   * This is in English; comparison is done against options[], not optionsAm[].
   */
  correctAnswer: string;
  /** English explanation of why the answer is correct */
  explanation: string;
  /** Amharic explanation */
  explanationAm: string;
  /** Suggested seconds to answer (design guide only) */
  estimatedSeconds: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Session / Scoring
// ─────────────────────────────────────────────────────────────────────────────

export const POINTS_PER_DIFFICULTY: Record<LogicDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
};

export const TIMED_MODE_SECONDS: Record<QuestionCountChoice, number> = {
  10: 300,  // 5 minutes
  20: 540,  // 9 minutes
  50: 1200, // 20 minutes
};

export interface SessionAnswer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface LogicSession {
  mode: LogicGameMode;
  difficulty: LogicDifficulty;
  questions: LogicQuestion[];
  answers: SessionAnswer[];
  /** Current 0-based index */
  currentIndex: number;
  totalScore: number;
  /** null while playing; set when session ends */
  finishedAt: Date | null;
}
