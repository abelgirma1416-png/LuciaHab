import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { TriviaCategory, TriviaDifficulty, TriviaQuestion } from '../data/triviaQuestions';
import { TRIVIA_QUESTIONS } from '../data/triviaQuestions';
import localApprovedData from '../data/approvedQuestions.json';

const SEEN_QUESTIONS_KEY = 'luciahab_seen_trivia_ids';

export interface TriviaFilterOptions {
  category?: TriviaCategory | 'all';
  difficulty?: TriviaDifficulty | 'all';
  subject?: string;
  total?: number;
}

// Helper to shuffle an array
const shuffle = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Retrieve seen question IDs from session storage
const getSeenQuestionIds = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SEEN_QUESTIONS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return new Set();
};

// Save newly seen questions to session storage
export const markQuestionsAsSeen = (questionIds: string[]): void => {
  try {
    const seen = getSeenQuestionIds();
    questionIds.forEach((id) => seen.add(id));
    sessionStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Fetch approved questions from Supabase with RLS.
 * Falls back to local approved questions and hardcoded questions if unavailable.
 */
export async function fetchApprovedTriviaQuestions(
  options: TriviaFilterOptions = {}
): Promise<{ questions: TriviaQuestion[]; isFromSupabase: boolean }> {
  const { category = 'all', difficulty = 'all', total = 10 } = options;

  let candidatePool: TriviaQuestion[] = [];
  let isFromSupabase = false;

  // 1. Attempt Supabase query if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('approved_questions').select('*');

      if (category !== 'all') {
        query = query.eq('category', category);
      }
      if (difficulty !== 'all') {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Map database row to TriviaQuestion
        candidatePool = data.map((row: any) => ({
          id: row.id,
          category: (row.category as TriviaCategory) || 'general_knowledge',
          difficulty: (row.difficulty as TriviaDifficulty) || 'medium',
          question: {
            en: row.question_en,
            am: row.question_am || row.question_en,
          },
          options: {
            en: Array.isArray(row.options_en) ? row.options_en : ['', '', '', ''],
            am: Array.isArray(row.options_am) ? row.options_am : row.options_en,
          },
          correctIndex: row.correct_index,
          explanation: {
            en: row.explanation_en,
            am: row.explanation_am || row.explanation_en,
          },
        }));
        isFromSupabase = true;
      }
    } catch (err) {
      console.warn('Supabase fetch failed; falling back to local question bank.', err);
    }
  }

  // 2. If Supabase pool is empty or failed, combine local approved textbook questions + existing trivia pool
  if (candidatePool.length === 0) {
    const localApproved: TriviaQuestion[] = (localApprovedData as any[]).map((item) => ({
      id: item.id,
      category: item.category as TriviaCategory,
      difficulty: item.difficulty as TriviaDifficulty,
      question: item.question,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.explanation,
    }));

    // Merge without duplicates
    const combined = [...localApproved, ...TRIVIA_QUESTIONS];
    const seenMap = new Map<string, TriviaQuestion>();
    combined.forEach((q) => {
      if (!seenMap.has(q.id)) {
        seenMap.set(q.id, q);
      }
    });

    candidatePool = Array.from(seenMap.values());
  }

  // 3. Apply Category & Difficulty filters if specified
  let filtered = candidatePool;
  if (category !== 'all') {
    filtered = filtered.filter((q) => q.category === category);
  }
  if (difficulty !== 'all') {
    filtered = filtered.filter((q) => q.difficulty === difficulty);
  }

  // 4. Exclude recently seen questions (if enough unseen questions exist)
  const seenIds = getSeenQuestionIds();
  const unseenPool = filtered.filter((q) => !seenIds.has(q.id));
  const selectionPool = unseenPool.length >= total ? unseenPool : filtered;

  // 5. Randomly pick questions without repeats
  const selected = shuffle(selectionPool).slice(0, total);

  // Mark selected as seen in this player's session
  markQuestionsAsSeen(selected.map((q) => q.id));

  return { questions: selected, isFromSupabase };
}
