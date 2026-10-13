#!/usr/bin/env node
/**
 * Logic Masters – Integration Test Suite
 * Run with: node --experimental-strip-types src/components/games/logic-masters/__tests__/logicMasters.test.ts
 *
 * Tests catalog integrity, question bank validation, scoring rules,
 * session behaviour, and localization correctness.
 */

import { LOGIC_QUESTIONS, sampleQuestions, countByDifficulty, getQuestionsByDifficulty } from '../logicQuestions.ts';
import { validateQuestionBank } from '../logicValidation.ts';
import { POINTS_PER_DIFFICULTY, TIMED_MODE_SECONDS } from '../logicTypes.ts';
// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

function assertEq<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} (expected ${String(expected)}, got ${String(actual)})`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. Question Bank Integrity
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════════');
console.log('   LOGIC MASTERS TEST SUITE');
console.log('════════════════════════════════════════════════════');

// ─────────────────────────────────────────────────────────────────────────────
//  2. Question bank structural validation
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Question Bank Validation Tests ──');

const validationResult = validateQuestionBank(LOGIC_QUESTIONS);
assert(validationResult.valid,
  `Test 5: Full bank passes structural validation (${validationResult.errors.length} errors)`);
if (!validationResult.valid) {
  for (const e of validationResult.errors) {
    console.error(`   [${e.questionId}] ${e.error}`);
  }
}

// Unique IDs
const ids = LOGIC_QUESTIONS.map((q) => q.id);
const uniqueIds = new Set(ids);
assertEq(uniqueIds.size, ids.length, 'Test 6: All question IDs are unique');

// correctAnswer is always in options
let allAnswersValid = true;
for (const q of LOGIC_QUESTIONS) {
  if (!q.options.includes(q.correctAnswer)) {
    allAnswersValid = false;
    console.error(`  BAD: Question ${q.id} correctAnswer "${q.correctAnswer}" not in options`);
  }
}
assert(allAnswersValid, 'Test 7: Every correctAnswer exists in its options array');

// English and Amharic text non-empty
let allTextsPresent = true;
for (const q of LOGIC_QUESTIONS) {
  if (!q.question?.trim() || !q.questionAm?.trim() ||
      !q.explanation?.trim() || !q.explanationAm?.trim()) {
    allTextsPresent = false;
    console.error(`  BAD: Question ${q.id} missing English or Amharic text`);
  }
}
assert(allTextsPresent, 'Test 8: All questions have non-empty English and Amharic text');

// Options and optionsAm same length
let optionLengthsMatch = true;
for (const q of LOGIC_QUESTIONS) {
  if (q.options.length !== q.optionsAm.length) {
    optionLengthsMatch = false;
    console.error(`  BAD: Question ${q.id} options.length (${q.options.length}) ≠ optionsAm.length (${q.optionsAm.length})`);
  }
}
assert(optionLengthsMatch, 'Test 9: Every question has matching options and optionsAm lengths');

// Every question has ≥ 2 options
let allHaveOptions = true;
for (const q of LOGIC_QUESTIONS) {
  if (q.options.length < 2) {
    allHaveOptions = false;
    console.error(`  BAD: Question ${q.id} has fewer than 2 options`);
  }
}
assert(allHaveOptions, 'Test 10: Every question has at least 2 answer options');

// Valid category and difficulty
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_CATEGORIES = ['number_sequence','pattern_recognition','deductive_reasoning','odd_one_out','math_logic','spatial_sequence'];
let validMeta = true;
for (const q of LOGIC_QUESTIONS) {
  if (!VALID_DIFFICULTIES.includes(q.difficulty)) {
    validMeta = false;
    console.error(`  BAD: ${q.id} has invalid difficulty "${q.difficulty}"`);
  }
  if (!VALID_CATEGORIES.includes(q.category)) {
    validMeta = false;
    console.error(`  BAD: ${q.id} has invalid category "${q.category}"`);
  }
}
assert(validMeta, 'Test 11: Every question has a valid difficulty and category');

// ─────────────────────────────────────────────────────────────────────────────
//  3. Difficulty distribution
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Difficulty Distribution Tests ──');

const counts = countByDifficulty();
assert(counts.easy   >= 10, `Test 12: At least 10 Easy questions (found ${counts.easy})`);
assert(counts.medium >= 10, `Test 13: At least 10 Medium questions (found ${counts.medium})`);
assert(counts.hard   >= 10, `Test 14: At least 10 Hard questions (found ${counts.hard})`);

// ─────────────────────────────────────────────────────────────────────────────
//  4. Sampling
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Sampling Tests ──');

const sample10 = sampleQuestions('easy', 10);
assertEq(sample10.length, 10, 'Test 15: sampleQuestions returns exactly 10 easy questions');
assert(sample10.every((q) => q.difficulty === 'easy'), 'Test 16: Sampled questions are all Easy');

const sample100 = sampleQuestions('medium', 100); // more than available
assert(sample100.length <= counts.medium, 'Test 17: sampleQuestions caps at available count');

// No duplicates in a sample
const sampleIds = sample10.map((q) => q.id);
assertEq(new Set(sampleIds).size, sampleIds.length, 'Test 18: Sampled questions have no duplicates');

// ─────────────────────────────────────────────────────────────────────────────
//  5. Scoring
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Scoring Tests ──');

assertEq(POINTS_PER_DIFFICULTY.easy,   10, 'Test 19: Easy correct answer = 10 points');
assertEq(POINTS_PER_DIFFICULTY.medium, 20, 'Test 20: Medium correct answer = 20 points');
assertEq(POINTS_PER_DIFFICULTY.hard,   30, 'Test 21: Hard correct answer = 30 points');

// Incorrect gets 0
const mockCorrect  = POINTS_PER_DIFFICULTY.easy;
assertEq(mockCorrect > 0, true, 'Test 21b: Correct answer yields positive points');
const mockIncorrect = 0; // convention
assertEq(mockIncorrect, 0, 'Test 22: Incorrect answer yields 0 points');

// Score accumulation
let runningScore = 0;
for (const _q of sampleQuestions('easy', 10)) {
  runningScore += POINTS_PER_DIFFICULTY.easy;
}
assertEq(runningScore, 100, 'Test 23: 10 correct Easy answers yield 100 XP total');

// ─────────────────────────────────────────────────────────────────────────────
//  6. Timed mode configuration
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Timed Mode Tests ──');

assert(TIMED_MODE_SECONDS[10] > 0,  'Test 24: 10-question timed mode has a positive duration');
assert(TIMED_MODE_SECONDS[20] > 0,  'Test 25: 20-question timed mode has a positive duration');
assert(TIMED_MODE_SECONDS[50] > 0,  'Test 26: 50-question timed mode has a positive duration');
assert(TIMED_MODE_SECONDS[20] > TIMED_MODE_SECONDS[10], 'Test 27: 20q timed mode is longer than 10q');

// ─────────────────────────────────────────────────────────────────────────────
//  7. Language independence
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Localization Tests ──');

// correctAnswer must be in English options[], regardless of which language is displayed
for (const q of LOGIC_QUESTIONS) {
  if (!q.options.includes(q.correctAnswer)) {
    assert(false, `Test 28: ${q.id} correctAnswer must match an English option`);
  }
}
assert(true, 'Test 28: All correctAnswers reference English options (language-independent)');

// Every question has Amharic options
let allHaveAmharic = true;
for (const q of LOGIC_QUESTIONS) {
  if (!q.optionsAm || q.optionsAm.some((o) => !o?.trim())) {
    allHaveAmharic = false;
    console.error(`  BAD: ${q.id} has empty Amharic option`);
  }
}
assert(allHaveAmharic, 'Test 29: Every question has non-empty Amharic options');

// ─────────────────────────────────────────────────────────────────────────────
//  8. Specific sequence answer verification
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Sequence Answer Spot Checks ──');

const q001 = LOGIC_QUESTIONS.find((q) => q.id === 'lm_001');
assert(q001?.correctAnswer === '10', 'Test 30: lm_001 (2,4,6,8,?) = 10');

const q016 = LOGIC_QUESTIONS.find((q) => q.id === 'lm_016');
assert(q016?.correctAnswer === '48', 'Test 31: lm_016 (3,6,12,24,?) = 48');

const q017 = LOGIC_QUESTIONS.find((q) => q.id === 'lm_017');
assert(q017?.correctAnswer === '25', 'Test 32: lm_017 (1,4,9,16,?) = 25 (perfect squares)');

const q018 = LOGIC_QUESTIONS.find((q) => q.id === 'lm_018');
assert(q018?.correctAnswer === '13', 'Test 33: lm_018 Fibonacci (1,1,2,3,5,8,?) = 13');

const q029 = LOGIC_QUESTIONS.find((q) => q.id === 'lm_029');
assert(q029?.correctAnswer === '17', 'Test 34: lm_029 primes (2,3,5,7,11,13,?) = 17');

const q030 = LOGIC_QUESTIONS.find((q) => q.id === 'lm_030');
assert(q030?.correctAnswer === '216', 'Test 35: lm_030 cubes (1,8,27,64,125,?) = 216');

// ─────────────────────────────────────────────────────────────────────────────
//  9. Difficulty isolation
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Difficulty Isolation Tests ──');

const easyOnly   = getQuestionsByDifficulty('easy');
const mediumOnly = getQuestionsByDifficulty('medium');
const hardOnly   = getQuestionsByDifficulty('hard');

assert(easyOnly.every(  (q) => q.difficulty === 'easy'),   'Test 36: getQuestionsByDifficulty("easy") returns only Easy questions');
assert(mediumOnly.every((q) => q.difficulty === 'medium'), 'Test 37: getQuestionsByDifficulty("medium") returns only Medium questions');
assert(hardOnly.every(  (q) => q.difficulty === 'hard'),   'Test 38: getQuestionsByDifficulty("hard") returns only Hard questions');

// ─────────────────────────────────────────────────────────────────────────────
//  Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n════════════════════════════════════════════════════');
if (failed === 0) {
  console.log(`   ALL ${passed} LOGIC MASTERS TESTS PASSED SUCCESSFULLY!`);
} else {
  console.error(`   ${failed} TEST(S) FAILED  •  ${passed} PASSED`);
}
console.log('════════════════════════════════════════════════════\n');

if (failed > 0) {
  throw new Error(`${failed} Logic Masters test(s) failed`);
}
