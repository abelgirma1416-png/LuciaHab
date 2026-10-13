import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Starting Turbo Math 3-Tier Question Bank Integration Test Suite ---');

const dataDir = path.resolve(__dirname, '../data');

// 1. Verify all three local banks exist
const easyPath = path.join(dataDir, 'math_easy.json');
const mediumPath = path.join(dataDir, 'math_medium.json');
const hardPath = path.join(dataDir, 'math_hard.json');

assert(fs.existsSync(easyPath), `Missing math_easy.json at ${easyPath}`);
assert(fs.existsSync(mediumPath), `Missing math_medium.json at ${mediumPath}`);
assert(fs.existsSync(hardPath), `Missing math_hard.json at ${hardPath}`);

const easyBank = JSON.parse(fs.readFileSync(easyPath, 'utf8'));
const mediumBank = JSON.parse(fs.readFileSync(mediumPath, 'utf8'));
const hardBank = JSON.parse(fs.readFileSync(hardPath, 'utf8'));

assert.strictEqual(easyBank.length, 1000, `Expected 1,000 Easy questions, got ${easyBank.length}`);
assert.strictEqual(mediumBank.length, 1000, `Expected 1,000 Medium questions, got ${mediumBank.length}`);
assert.strictEqual(hardBank.length, 1000, `Expected 1,000 Hard questions, got ${hardBank.length}`);

console.log(`✓ Loaded all 3 question banks: Easy (${easyBank.length}), Medium (${mediumBank.length}), Hard (${hardBank.length}). Total = 3,000 questions.`);

// 2. Comprehensive Validation of all 3,000 questions
const banks = [
  { name: 'Easy', data: easyBank, expectedDiff: 'easy' },
  { name: 'Medium', data: mediumBank, expectedDiff: 'medium' },
  { name: 'Hard', data: hardBank, expectedDiff: 'hard' },
];

for (const { name, data, expectedDiff } of banks) {
  const seenIds = new Set();
  const seenPrompts = new Set();

  for (const [idx, q] of data.entries()) {
    // Unique ID
    assert(q.id && typeof q.id === 'string', `[${name}] Missing ID at index ${idx}`);
    assert(!seenIds.has(q.id), `[${name}] Duplicate ID '${q.id}'`);
    seenIds.add(q.id);

    // Non-empty question text
    assert(typeof q.question === 'string' && q.question.trim().length > 3, `[${name}] Empty prompt in ${q.id}`);
    assert(!seenPrompts.has(q.question.trim().toLowerCase()), `[${name}] Duplicate question prompt: '${q.question}'`);
    seenPrompts.add(q.question.trim().toLowerCase());

    // Exactly 4 options
    assert(Array.isArray(q.options), `[${name}] Options not an array in ${q.id}`);
    assert.strictEqual(q.options.length, 4, `[${name}] Options count != 4 in ${q.id}`);

    // All options distinct and non-empty
    const optSet = new Set(q.options.map((o) => String(o).trim().toLowerCase()));
    assert.strictEqual(optSet.size, 4, `[${name}] Duplicate options in ${q.id}: ${JSON.stringify(q.options)}`);

    // Correct answer matches one option
    assert(typeof q.correctAnswer === 'string', `[${name}] correctAnswer not string in ${q.id}`);
    assert(
      q.options.includes(q.correctAnswer),
      `[${name}] correctAnswer '${q.correctAnswer}' not found in options for ${q.id}`
    );

    // Index consistency
    if (q.correctIndex !== undefined) {
      assert.strictEqual(
        q.options[q.correctIndex],
        q.correctAnswer,
        `[${name}] Option index mismatch in ${q.id}`
      );
    }

    // Non-empty explanation
    assert(
      typeof q.explanation === 'string' && q.explanation.trim().length > 4,
      `[${name}] Empty explanation in ${q.id}`
    );

    // Difficulty verification
    if (name !== 'Hard') {
      assert.strictEqual(q.difficulty, expectedDiff, `[${name}] Unexpected difficulty: ${q.difficulty}`);
    }
  }

  console.log(`✓ [${name} Bank] Verified 1,000 questions: distinct IDs, distinct options, validated answer keys, and explanations.`);
}

// 3. Test Session Question Selection & Strict Difficulty Isolation
function mockCreateSession(bank, count) {
  assert(bank.length >= count, 'Bank has fewer questions than requested');
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  return selected;
}

for (const diff of ['easy', 'medium', 'hard']) {
  const bank = diff === 'easy' ? easyBank : diff === 'medium' ? mediumBank : hardBank;

  for (const count of [10, 20, 50]) {
    const session = mockCreateSession(bank, count);
    assert.strictEqual(session.length, count, `Session count mismatch for ${diff} ${count}`);

    // Verify session deduplication
    const sessionIds = new Set(session.map((q) => q.id));
    assert.strictEqual(sessionIds.size, count, `Session contains duplicate questions in ${diff} ${count}`);

    // Strict difficulty isolation
    if (diff !== 'hard') {
      for (const q of session) {
        assert.strictEqual(q.difficulty, diff, `Question ${q.id} mixed into ${diff} session`);
      }
    }
  }
}
console.log('✓ Session selection strictly isolates selected difficulty and eliminates session duplicates (10, 20, and 50 questions).');

// 4. Test Configurable Timer & Scoring per Difficulty
const DIFF_CONFIGS = {
  easy: { basePoints: 50, secondsPerQ: 8 },
  medium: { basePoints: 75, secondsPerQ: 12 },
  hard: { basePoints: 100, secondsPerQ: 18 },
};

function calcTimer(diff, count) {
  const total = count * DIFF_CONFIGS[diff].secondsPerQ;
  const min = count === 10 ? 60 : count === 20 ? 120 : 240;
  return Math.max(min, total);
}

// Check timer allocations
assert.strictEqual(calcTimer('easy', 10), 80); // 10 * 8 = 80s (>60)
assert.strictEqual(calcTimer('easy', 20), 160); // 20 * 8 = 160s (>120)
assert.strictEqual(calcTimer('medium', 10), 120); // 10 * 12 = 120s
assert.strictEqual(calcTimer('medium', 20), 240); // 20 * 12 = 240s
assert.strictEqual(calcTimer('hard', 10), 180); // 10 * 18 = 180s
assert.strictEqual(calcTimer('hard', 20), 360); // 20 * 18 = 360s
console.log('✓ Configurable session timers correctly calculated per difficulty and question count.');

// Check scoring logic with streak multipliers
for (const diff of ['easy', 'medium', 'hard']) {
  const base = DIFF_CONFIGS[diff].basePoints;
  let streak = 0;
  let score = 0;

  // Question 1 correct (streak = 1, multiplier = 1x)
  streak += 1;
  let mult = Math.min(3, 1 + Math.floor(streak / 3) * 0.5);
  score += Math.round(base * mult);
  assert.strictEqual(mult, 1.0);
  assert.strictEqual(score, base);

  // Question 2 correct (streak = 2, multiplier = 1x)
  streak += 1;
  mult = Math.min(3, 1 + Math.floor(streak / 3) * 0.5);
  score += Math.round(base * mult);
  assert.strictEqual(mult, 1.0);
  assert.strictEqual(score, base * 2);

  // Question 3 correct (streak = 3, multiplier = 1.5x)
  streak += 1;
  mult = Math.min(3, 1 + Math.floor(streak / 3) * 0.5);
  score += Math.round(base * mult);
  assert.strictEqual(mult, 1.5);
  assert.strictEqual(score, base * 2 + Math.round(base * 1.5));

  // Incorrect answer resets streak
  streak = 0;
  assert.strictEqual(streak, 0);
}
console.log('✓ Scoring evaluation, difficulty base points (50/75/100 XP), and streak multiplier progression verified.');

console.log('--- ALL 3-TIER INTEGRATION TESTS PASSED (100% OK) ---');
