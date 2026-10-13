// ─────────────────────────────────────────────────────────────────────────────
//  Logic Masters – Validation Module
// ─────────────────────────────────────────────────────────────────────────────
import type { LogicQuestion } from './logicTypes';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const VALID_CATEGORIES = [
  'number_sequence',
  'pattern_recognition',
  'deductive_reasoning',
  'odd_one_out',
  'math_logic',
  'spatial_sequence',
] as const;

export interface ValidationError {
  questionId: string;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  questionCount: number;
}

/**
 * Full structural validation of the question bank.
 * Returns all errors found; does NOT throw.
 */
export function validateQuestionBank(questions: LogicQuestion[]): ValidationResult {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  for (const q of questions) {
    const id = q.id ?? '(missing id)';

    // 1. Unique ID
    if (seenIds.has(id)) {
      errors.push({ questionId: id, error: 'Duplicate ID' });
    }
    seenIds.add(id);

    // 2. Non-empty question text
    if (!q.question || q.question.trim() === '') {
      errors.push({ questionId: id, error: 'Empty question text' });
    }
    if (!q.questionAm || q.questionAm.trim() === '') {
      errors.push({ questionId: id, error: 'Empty Amharic question text' });
    }

    // 3. Options array must have ≥ 2 entries
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push({ questionId: id, error: 'Must have at least 2 options' });
    }
    if (!Array.isArray(q.optionsAm) || q.optionsAm.length !== (q.options?.length ?? 0)) {
      errors.push({ questionId: id, error: 'optionsAm must have the same length as options' });
    }

    // 4. correctAnswer must be one of the options
    if (!q.options?.includes(q.correctAnswer)) {
      errors.push({
        questionId: id,
        error: `correctAnswer "${q.correctAnswer}" is not in options [${q.options?.join(', ')}]`,
      });
    }

    // 5. Valid difficulty
    if (!VALID_DIFFICULTIES.includes(q.difficulty as typeof VALID_DIFFICULTIES[number])) {
      errors.push({ questionId: id, error: `Invalid difficulty: ${q.difficulty}` });
    }

    // 6. Valid category
    if (!VALID_CATEGORIES.includes(q.category as typeof VALID_CATEGORIES[number])) {
      errors.push({ questionId: id, error: `Invalid category: ${q.category}` });
    }

    // 7. Non-empty explanation
    if (!q.explanation || q.explanation.trim() === '') {
      errors.push({ questionId: id, error: 'Empty explanation' });
    }
    if (!q.explanationAm || q.explanationAm.trim() === '') {
      errors.push({ questionId: id, error: 'Empty Amharic explanation' });
    }

    // 8. estimatedSeconds must be positive
    if (typeof q.estimatedSeconds !== 'number' || q.estimatedSeconds <= 0) {
      errors.push({ questionId: id, error: 'estimatedSeconds must be a positive number' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    questionCount: questions.length,
  };
}

/**
 * Throws if the bank is invalid. Use during development / test runs.
 */
export function assertBankValid(questions: LogicQuestion[]): void {
  const result = validateQuestionBank(questions);
  if (!result.valid) {
    const summary = result.errors.map((e) => `  [${e.questionId}] ${e.error}`).join('\n');
    throw new Error(`Logic Masters question bank has ${result.errors.length} error(s):\n${summary}`);
  }
}
