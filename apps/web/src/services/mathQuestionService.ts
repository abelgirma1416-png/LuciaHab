import mathEasyQuestions from '../data/math_easy.json';
import mathMediumQuestions from '../data/math_medium.json';
import mathHardQuestions from '../data/math_hard.json';
import fallbackQuestionsRaw from '../data/mathQuestions.json';

export type MathDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionCountChoice = 10 | 20 | 50;

export interface MathQuestionItem {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerLetter?: string;
  correctIndex?: number;
  explanation?: string;
  topic?: string;
  area?: string;
  difficulty: MathDifficulty;
  targetTimeSeconds?: number;
  gradeLevel?: string;
  sourcePage?: number;
  isVerified?: boolean;
}

export interface GameQuestion {
  id: string;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  area: string;
  difficulty: MathDifficulty;
  questionNumber?: number;
  sourcePage?: number;
}

export interface DifficultyConfig {
  id: MathDifficulty;
  labelEn: string;
  labelAm: string;
  badgeEn: string;
  badgeAm: string;
  descriptionEn: string;
  descriptionAm: string;
  accentColor: string;
  basePoints: number;
  secondsPerQuestion: number;
}

export const DIFFICULTY_CONFIGS: Record<MathDifficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    labelEn: 'Easy — Beginner',
    labelAm: 'ቀላል — ጀማሪ',
    badgeEn: 'EASY',
    badgeAm: 'ቀላል',
    descriptionEn: 'Basic arithmetic, place value, simple fractions & everyday word problems.',
    descriptionAm: 'መሰረታዊ ስሌቶች፣ የቁጥር ቦታ ዋጋ፣ ቀላል ክፍልፋዮች እና ዕለታዊ የሒሳብ ጥያቄዎች።',
    accentColor: '#10b981',
    basePoints: 50,
    secondsPerQuestion: 8,
  },
  medium: {
    id: 'medium',
    labelEn: 'Medium — Intermediate',
    labelAm: 'መካከለኛ — ሁለተኛ ደረጃ',
    badgeEn: 'MEDIUM',
    badgeAm: 'መካከለኛ',
    descriptionEn: 'Multi-step arithmetic, percentages, ratios, decimals, introductory algebra & geometry.',
    descriptionAm: 'ባለብዙ-ደረጃ ስሌት፣ ፐርሰንት፣ ንፅፅር፣ አስርዮሽ፣ አልጀብራ እና ጂኦሜትሪ።',
    accentColor: '#f59e0b',
    basePoints: 75,
    secondsPerQuestion: 12,
  },
  hard: {
    id: 'hard',
    labelEn: 'Hard — Advanced',
    labelAm: 'ከባድ — የላቀ',
    badgeEn: 'HARD',
    badgeAm: 'ከባድ',
    descriptionEn: 'University & competition-level calculus, algebra, topology, logic & applied math.',
    descriptionAm: 'የዩኒቨርሲቲና የውድድር ደረጃ ካልኩለስ፣ ከፍተኛ አልጀብራ፣ ቶፖሎጂ እና አፕላይድ ሒሳብ።',
    accentColor: '#f43f5e',
    basePoints: 100,
    secondsPerQuestion: 18,
  },
};

/**
 * Validates that an individual question item meets all schema and gameplay integrity requirements:
 * 1. Non-empty question prompt
 * 2. Exactly four answer options
 * 3. Four distinct options (no duplicate text)
 * 4. A non-empty correct answer matching one of the four options
 * 5. Matches the designated difficulty tier (prevents mixing)
 */
export function validateQuestionItem(q: GameQuestion, expectedDifficulty?: MathDifficulty): boolean {
  if (!q || !q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
    return false;
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return false;
  }
  const cleanOptions = q.options.map((opt) => String(opt).trim());
  if (cleanOptions.some((opt) => opt.length === 0)) {
    return false;
  }
  const uniqueOptions = new Set(cleanOptions.map((opt) => opt.toLowerCase()));
  if (uniqueOptions.size !== 4) {
    return false;
  }
  const trimmedAnswer = String(q.answer).trim();
  if (trimmedAnswer.length === 0) {
    return false;
  }
  const matchesOption = cleanOptions.some((opt) => opt === trimmedAnswer);
  if (!matchesOption) {
    return false;
  }
  if (expectedDifficulty && q.difficulty !== expectedDifficulty) {
    return false;
  }
  return true;
}

/**
 * Safely maps a raw MathQuestionItem into the unified GameQuestion schema.
 */
export function mapToGameQuestion(item: Partial<MathQuestionItem>, fallbackDiff: MathDifficulty = 'easy'): GameQuestion {
  const options = Array.isArray(item.options) && item.options.length === 4
    ? item.options.map(String)
    : ['0', '1', '2', '3'];

  return {
    id: String(item.id || `math_${Math.random().toString(36).substring(2, 7)}`),
    text: String(item.question || '0 + 0 = ?'),
    options,
    answer: String(item.correctAnswer ?? options[0]),
    explanation: String(item.explanation || 'Solution not provided.'),
    topic: String(item.topic || 'General Mathematics'),
    area: String(item.area || 'Foundations'),
    difficulty: (['easy', 'medium', 'hard'].includes(String(item.difficulty))
      ? item.difficulty
      : fallbackDiff) as MathDifficulty,
    questionNumber: item.questionNumber,
    sourcePage: item.sourcePage,
  };
}

// Pre-process and categorize question banks at module load without cross-pollination
const EASY_QUESTIONS: GameQuestion[] = Array.isArray(mathEasyQuestions) && mathEasyQuestions.length > 0
  ? (mathEasyQuestions as unknown as MathQuestionItem[]).map((q) => mapToGameQuestion(q, 'easy'))
  : [];

const MEDIUM_QUESTIONS: GameQuestion[] = Array.isArray(mathMediumQuestions) && mathMediumQuestions.length > 0
  ? (mathMediumQuestions as unknown as MathQuestionItem[]).map((q) => mapToGameQuestion(q, 'medium'))
  : [];

const HARD_QUESTIONS: GameQuestion[] = Array.isArray(mathHardQuestions) && mathHardQuestions.length > 0
  ? (mathHardQuestions as unknown as MathQuestionItem[]).map((q) => mapToGameQuestion(q, 'hard'))
  : (fallbackQuestionsRaw as unknown as MathQuestionItem[]).map((q) => mapToGameQuestion(q, 'hard'));

const BANKS: Record<MathDifficulty, GameQuestion[]> = {
  easy: EASY_QUESTIONS,
  medium: MEDIUM_QUESTIONS,
  hard: HARD_QUESTIONS,
};

/**
 * Get question count in each difficulty bank.
 */
export function getBankCounts(): Record<MathDifficulty, number> {
  return {
    easy: BANKS.easy.length,
    medium: BANKS.medium.length,
    hard: BANKS.hard.length,
  };
}

/**
 * Total questions across all 3 difficulty tiers.
 */
export function getQuestionBankCount(): number {
  return BANKS.easy.length + BANKS.medium.length + BANKS.hard.length;
}

/**
 * Check if the Easy question bank is loaded and available.
 */
export function isEasyBankAvailable(): boolean {
  return BANKS.easy.length > 0;
}

/**
 * Get all questions for a given difficulty.
 */
export function getQuestionsByDifficulty(diff: MathDifficulty): readonly GameQuestion[] {
  return BANKS[diff] || [];
}

/**
 * Calculates initial total time in seconds for a game session based on difficulty and question count.
 * Configured generously so questions can be read and solved without unfair time pressure.
 */
export function calculateSessionTimer(difficulty: MathDifficulty, count: QuestionCountChoice = 20): number {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const totalSeconds = count * cfg.secondsPerQuestion;
  const minSeconds = count === 10 ? 60 : count === 20 ? 120 : 240;
  return Math.max(minSeconds, totalSeconds);
}

/**
 * Helper to shuffle options inside a question while tracking the correct answer.
 */
function shuffleQuestionOptions(q: GameQuestion): GameQuestion {
  const options = [...q.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    ...q,
    options,
  };
}

/**
 * Select a curated list of randomized, non-duplicate questions strictly for the chosen difficulty.
 * - In Easy mode, ONLY questions from the Easy bank are used. Medium and Hard are NEVER mixed in.
 * - If the Easy question bank does not exist or has 0 questions, throws an error rather than substituting hard questions.
 * - Every selected question is validated for four distinct options and a valid matching answer.
 */
export function createSessionQuestionSet(
  difficulty: MathDifficulty = 'easy',
  count: QuestionCountChoice = 20
): GameQuestion[] {
  // If Easy mode is requested, explicitly verify the Easy question bank is present
  if (difficulty === 'easy') {
    if (!EASY_QUESTIONS || EASY_QUESTIONS.length === 0) {
      throw new Error(
        'Easy question bank (math_easy.json) does not exist or contains no questions. Existing hard questions will not be substituted for Easy mode.'
      );
    }
  }

  const bank = BANKS[difficulty];
  if (!bank || bank.length === 0) {
    throw new Error(`No questions available in ${difficulty} question bank.`);
  }

  // Filter bank to only validated questions strictly belonging to this difficulty
  const validCandidates = bank.filter((q) => validateQuestionItem(q, difficulty));

  if (validCandidates.length < count) {
    throw new Error(
      `Insufficient valid questions in ${difficulty} bank: requested ${count}, valid available ${validCandidates.length}.`
    );
  }

  // Fisher-Yates shuffle to ensure random selection of unique questions
  const shuffled = [...validCandidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Slice exactly requested count and randomize answer options
  const selected = shuffled.slice(0, count).map(shuffleQuestionOptions);

  // Strict post-selection assertions
  for (const q of selected) {
    if (q.difficulty !== difficulty) {
      throw new Error(`Integrity error: question ${q.id} with difficulty '${q.difficulty}' mixed into '${difficulty}' session.`);
    }
    if (!validateQuestionItem(q, difficulty)) {
      throw new Error(`Integrity error: question ${q.id} failed four-option or valid correct answer check.`);
    }
  }

  return selected;
}

/**
 * Compatibility helper for existing callers. Strictly respects difficulty without cross-mixing.
 */
export function getNextMathQuestion(
  difficultyLevel: number,
  usedIds: Set<string>
): GameQuestion {
  const diff: MathDifficulty = difficultyLevel <= 1 ? 'easy' : difficultyLevel === 2 ? 'medium' : 'hard';
  const pool = BANKS[diff];
  if (!pool || pool.length === 0) {
    if (diff === 'easy') {
      throw new Error('Easy question bank is missing. Medium or Hard questions will not be substituted.');
    }
    throw new Error(`No questions available in ${diff} bank.`);
  }
  const unused = pool.filter((q) => !usedIds.has(q.id) && validateQuestionItem(q, diff));
  const candidate = unused.length > 0
    ? unused[Math.floor(Math.random() * unused.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  return shuffleQuestionOptions(candidate);
}
