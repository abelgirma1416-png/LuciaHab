import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  RotateCcw,
  Play,
  RotateCw,
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Timer,
  Lightbulb,
  Target,
  Zap,
  BookOpen,
  Award,
} from 'lucide-react';
import { useLanguage } from '../../../context/useLanguage';
import type {
  LogicDifficulty,
  LogicGameMode,
  QuestionCountChoice,
  SessionAnswer,
} from './logicTypes';
import {
  POINTS_PER_DIFFICULTY,
  TIMED_MODE_SECONDS,
} from './logicTypes';
import { LOGIC_QUESTIONS, sampleQuestions, countByDifficulty } from './logicQuestions';
import type { LogicQuestion } from './logicTypes';
import './logicMasters.css';

// ─────────────────────────────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────────────────────────────

interface LogicMastersProps {
  onExit: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Bilingual UI strings
// ─────────────────────────────────────────────────────────────────────────────

const UI = {
  title:         { en: 'Logic Masters', am: 'ሎጂክ ማስተርስ' },
  subtitle:      { en: 'Brain Puzzle Strategy Game', am: 'የአዕምሮ ፍልሚያ ጨዋታ' },
  selectMode:    { en: 'Select Game Mode', am: 'የጨዋታ ዘዴ ምረጥ' },
  modeQuick:     { en: 'Quick Challenge', am: 'ፈጣን ፈተና' },
  modePractice:  { en: 'Practice', am: 'ልምምድ' },
  modeTimed:     { en: 'Timed Challenge', am: 'ከጊዜ ጋር ፈተና' },
  selectDiff:    { en: 'Difficulty', am: 'ደረጃ' },
  easy:          { en: 'Easy', am: 'ቀላል' },
  medium:        { en: 'Medium', am: 'መካከለኛ' },
  hard:          { en: 'Hard', am: 'ከባድ' },
  selectCount:   { en: 'Questions', am: 'የጥያቄዎች ብዛት' },
  questionsAvail:{ en: 'available for this difficulty', am: 'ለዚህ ደረጃ ዝግጁ ናቸው' },
  startGame:     { en: 'Start Game', am: 'ጨዋታ ጀምር' },
  exit:          { en: 'Exit', am: 'ውጣ' },
  restart:       { en: 'Restart', am: 'እንደገና ጀምር' },
  question:      { en: 'Question', am: 'ጥያቄ' },
  of:            { en: 'of', am: 'ከ' },
  score:         { en: 'Score', am: 'ውጤት' },
  correct:       { en: 'Correct!', am: 'ትክክል!' },
  incorrect:     { en: 'Incorrect', am: 'ስህተት' },
  explanation:   { en: 'Explanation', am: 'ማብራሪያ' },
  nextQ:         { en: 'Next Question', am: 'ቀጣይ ጥያቄ' },
  seeResults:    { en: 'See Results', am: 'ውጤት ይመልከቱ' },
  timeLeft:      { en: 'Time left', am: 'ቀሪ ጊዜ' },
  timesUp:       { en: "Time's up!", am: 'ጊዜው አልቋል!' },
  results:       { en: 'Session Complete!', am: 'ጨዋታ ተጠናቋል!' },
  totalScore:    { en: 'Total XP', am: 'ጠቅላላ XP' },
  accuracy:      { en: 'Accuracy', am: 'ትክክለኛነት' },
  correct_n:     { en: 'Correct', am: 'ትክክለኛ' },
  playAgain:     { en: 'Play Again', am: 'እንደገና ተጫወት' },
  mainMenu:      { en: 'Game Menu', am: 'ወደ ምርጫ ተመለስ' },
  reviewAnswers: { en: 'Answer Review', am: 'ትክክለኛ መልሶች' },
  answerWas:     { en: 'Correct answer', am: 'ትክክለኛ መልስ' },
  pointsNote:    {
    en: 'Points calculated locally. Server-side XP verification commits final score.',
    am: 'ነጥቦች በአካባቢ ተሰልተዋল። ይፋዊ XP ማረጋገጫ በሰርቨር ይካሄዳል።',
  },
  categoryLabels: {
    number_sequence:     { en: 'Number Sequence',       am: 'የቁጥር ቅደም ተከተል' },
    pattern_recognition: { en: 'Pattern Recognition',   am: 'ምልክቱ ቅደም ተከተል' },
    deductive_reasoning: { en: 'Deductive Reasoning',   am: 'ምክንያታዊ ድምዳሜ' },
    odd_one_out:         { en: 'Odd One Out',           am: 'ያልጣጣመ' },
    math_logic:          { en: 'Math Logic',            am: 'ሒሳባዊ አመክንዮ' },
    spatial_sequence:    { en: 'Spatial Reasoning',     am: 'ቦታዊ አመክንዮ' },
  } as Record<string, { en: string; am: string }>,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Option letter helper
// ─────────────────────────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

export const LogicMasters: React.FC<LogicMastersProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const lang = language === 'am' ? 'am' : 'en';

  // ── Setup state ────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<LogicGameMode>('quick');
  const [difficulty, setDifficulty] = useState<LogicDifficulty>('easy');
  const [questionCount, setQuestionCount] = useState<QuestionCountChoice>(10);

  // ── Session state ──────────────────────────────────────────────────────────
  const [sessionQuestions, setSessionQuestions] = useState<LogicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // ── Timer state ─────────────────────────────────────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<number | null>(null);
  const hasAwardedRef = useRef(false);

  // ── Available count for selected difficulty ────────────────────────────────
  const bankCounts = useMemo(() => countByDifficulty(), []);
  const availableCount = bankCounts[difficulty];

  // Supported question counts for the chosen difficulty
  const supportedCounts = useMemo<QuestionCountChoice[]>(() => {
    const all: QuestionCountChoice[] = [10, 20, 50];
    return all.filter((c) => c <= availableCount);
  }, [availableCount]);

  // Active question count clamped to supported options
  const activeCount: QuestionCountChoice = supportedCounts.includes(questionCount)
    ? questionCount
    : (supportedCounts[supportedCounts.length - 1] ?? 10);

  // ── Timer management ───────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishSession = useCallback(() => {
    stopTimer();
    setIsFinished(true);
  }, [stopTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const handleStartGame = useCallback(() => {
    stopTimer();
    hasAwardedRef.current = false;

    const questions = sampleQuestions(difficulty, activeCount);
    setSessionQuestions(questions);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setIsAnswered(false);
    setTotalScore(0);
    setIsFinished(false);
    setIsPlaying(true);

    if (gameMode === 'timed') {
      const secs = TIMED_MODE_SECONDS[activeCount as QuestionCountChoice] ??
                   activeCount * 30;
      setTimeRemaining(secs);
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopTimer();
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [activeCount, difficulty, gameMode, stopTimer]);

  // ── Select answer ──────────────────────────────────────────────────────────
  const handleSelectOption = useCallback(
    (option: string) => {
      if (isAnswered) return;

      const currentQ = sessionQuestions[currentIndex];
      if (!currentQ) return;

      const isCorrect = option === currentQ.correctAnswer;
      const points = isCorrect ? POINTS_PER_DIFFICULTY[difficulty] : 0;

      setSelectedOption(option);
      setIsAnswered(true);

      if (isCorrect) {
        setTotalScore((prev) => prev + points);
      }

      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQ.id,
          selectedOption: option,
          isCorrect,
          pointsEarned: points,
        },
      ]);
    },
    [currentIndex, difficulty, isAnswered, sessionQuestions]
  );

  // ── Advance to next question ────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= sessionQuestions.length) {
      finishSession();
    } else {
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [currentIndex, finishSession, sessionQuestions.length]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stopTimer();
    setIsPlaying(false);
    setIsFinished(false);
  }, [stopTimer]);

  // ── Exit ──────────────────────────────────────────────────────────────────
  const handleExit = useCallback(() => {
    stopTimer();
    onExit();
  }, [onExit, stopTimer]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentQ = sessionQuestions[currentIndex] ?? null;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = answers.length > 0
    ? Math.round((correctCount / answers.length) * 100)
    : 0;
  const progressPct = sessionQuestions.length > 0
    ? ((currentIndex + (isAnswered ? 1 : 0)) / sessionQuestions.length) * 100
    : 0;

  const timerWarning = timeRemaining < 60 && timeRemaining > 30;
  const timerDanger  = timeRemaining <= 30;

  // ── Render Setup Screen ────────────────────────────────────────────────────
  if (!isPlaying) {
    return (
      <div className="lm-container" role="main" aria-label="Logic Masters">
        {/* Header */}
        <header className="lm-header">
          <div className="lm-header-brand">
            <div className="lm-brand-icon" aria-hidden="true">
              <Lightbulb size={18} color="#06b6d4" />
            </div>
            <div>
              <h2 className="lm-title">{UI.title[lang]}</h2>
              <span className="lm-mode-chip">{UI.subtitle[lang]}</span>
            </div>
          </div>
          <div className="lm-header-controls">
            <button
              type="button"
              className="lm-control-btn lm-exit-btn"
              onClick={handleExit}
              title={UI.exit[lang]}
              aria-label="Exit Logic Masters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* Setup body */}
        <div className="lm-setup-card">
          {/* Hero */}
          <div className="lm-hero-box">
            <div className="lm-hero-icon-ring" aria-hidden="true">
              <Lightbulb size={28} color="#06b6d4" fill="rgba(6,182,212,0.2)" />
            </div>
            <h3 className="lm-hero-title">{UI.title[lang]}</h3>
            <p className="lm-hero-desc">{UI.subtitle[lang]}</p>
            <div className="lm-stat-pills">
              <span className="lm-stat-pill">
                {LOGIC_QUESTIONS.length}{lang === 'am' ? ' ጥያቄዎች' : ' Questions'}
              </span>
              <span className="lm-stat-pill">
                {lang === 'am' ? '6 ምድቦች' : '6 Categories'}
              </span>
              <span className="lm-stat-pill">
                {lang === 'am' ? '3 ደረጃዎች' : '3 Difficulty Levels'}
              </span>
            </div>
          </div>

          {/* Mode */}
          <div className="lm-section">
            <label className="lm-section-label">{UI.selectMode[lang]}</label>
            <div className="lm-toggle-row">
              {(['quick', 'practice', 'timed'] as LogicGameMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`lm-toggle-btn ${gameMode === m ? 'active' : ''}`}
                  onClick={() => setGameMode(m)}
                  id={`lm-mode-${m}`}
                >
                  {m === 'quick'    && <Zap size={14} />}
                  {m === 'practice' && <BookOpen size={14} />}
                  {m === 'timed'    && <Timer size={14} />}
                  {UI[m === 'quick' ? 'modeQuick' : m === 'practice' ? 'modePractice' : 'modeTimed'][lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="lm-section">
            <label className="lm-section-label">{UI.selectDiff[lang]}</label>
            <div className="lm-toggle-row">
              {(['easy', 'medium', 'hard'] as LogicDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`lm-toggle-btn ${difficulty === d ? `active diff-${d}` : ''}`}
                  onClick={() => setDifficulty(d)}
                  id={`lm-diff-${d}`}
                >
                  {UI[d][lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div className="lm-section">
            <label className="lm-section-label">{UI.selectCount[lang]}</label>
            <div className="lm-toggle-row">
              {([10, 20, 50] as QuestionCountChoice[]).map((c) => {
                const isSupported = supportedCounts.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={`lm-toggle-btn ${activeCount === c && isSupported ? 'active' : ''}`}
                    onClick={() => isSupported && setQuestionCount(c)}
                    disabled={!isSupported}
                    id={`lm-count-${c}`}
                    title={!isSupported ? `Not enough ${difficulty} questions` : undefined}
                    style={!isSupported ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="lm-count-note">
              {availableCount} {UI.questionsAvail[lang]}
            </p>
          </div>

          {/* Start */}
          <button
            type="button"
            className="lm-start-btn"
            onClick={handleStartGame}
            id="lm-start-btn"
          >
            <Play size={18} fill="#fff" />
            {UI.startGame[lang]}
          </button>
        </div>
      </div>
    );
  }

  // ── Render Results Screen ──────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="lm-container" role="main" aria-label="Logic Masters Results">
        <header className="lm-header">
          <div className="lm-header-brand">
            <div className="lm-brand-icon" aria-hidden="true">
              <Trophy size={18} color="#fbbf24" />
            </div>
            <div>
              <h2 className="lm-title">{UI.results[lang]}</h2>
              <span className="lm-mode-chip">{UI[difficulty][lang]}</span>
            </div>
          </div>
          <button
            type="button"
            className="lm-control-btn lm-exit-btn"
            onClick={handleExit}
            aria-label="Exit"
          >
            <RotateCcw size={16} />
          </button>
        </header>

        <div className="lm-results-view">
          {/* Trophy card */}
          <div className="lm-result-hero">
            <div className="lm-result-trophy-ring" aria-hidden="true">
              <Trophy size={32} color="#f59e0b" />
            </div>
            <h3 className="lm-result-title">{UI.results[lang]}</h3>
            <p className="lm-result-subtitle">
              {UI[difficulty][lang]} · {sessionQuestions.length} {lang === 'am' ? 'ጥያቄዎች' : 'Questions'}
            </p>
          </div>

          {/* Score cards */}
          <div className="lm-score-display">
            <div className="lm-score-card">
              <span className="lm-score-card-label">{UI.totalScore[lang]}</span>
              <span className="lm-score-card-value xp">+{totalScore}</span>
            </div>
            <div className="lm-score-card">
              <span className="lm-score-card-label">{UI.accuracy[lang]}</span>
              <span className="lm-score-card-value acc">{accuracy}%</span>
            </div>
            <div className="lm-score-card">
              <span className="lm-score-card-label">{UI.correct_n[lang]}</span>
              <span className="lm-score-card-value">
                {correctCount}/{sessionQuestions.length}
              </span>
            </div>
          </div>

          {/* Review section */}
          {answers.length > 0 && (
            <div className="lm-review-section">
              <p className="lm-review-title">
                <BookOpen size={14} />
                {UI.reviewAnswers[lang]}
              </p>
              {sessionQuestions.map((q, idx) => {
                const ans = answers[idx];
                if (!ans) return null;
                const qText = lang === 'am' ? q.questionAm : q.question;
                const expl  = lang === 'am' ? q.explanationAm : q.explanation;
                return (
                  <div
                    key={q.id}
                    className={`lm-review-item ${ans.isCorrect ? 'was-correct' : 'was-incorrect'}`}
                  >
                    <p className="lm-review-q-text">
                      {idx + 1}. {qText}
                    </p>
                    {!ans.isCorrect && (
                      <p className="lm-review-answer">
                        {UI.answerWas[lang]}: <span>{q.correctAnswer}</span>
                      </p>
                    )}
                    <p className="lm-review-expl">{expl}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* XP notice */}
          <p className="lm-xp-notice">{UI.pointsNote[lang]}</p>

          {/* Actions */}
          <div className="lm-result-actions">
            <button
              type="button"
              className="lm-action-btn secondary"
              onClick={() => { stopTimer(); setIsPlaying(false); setIsFinished(false); }}
            >
              <Award size={15} />
              {UI.mainMenu[lang]}
            </button>
            <button
              type="button"
              className="lm-action-btn primary"
              onClick={handleStartGame}
            >
              <RotateCw size={15} />
              {UI.playAgain[lang]}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Gameplay Screen ─────────────────────────────────────────────────
  if (!currentQ) return null;

  const qText  = lang === 'am' ? currentQ.questionAm  : currentQ.question;
  const opts   = lang === 'am' ? currentQ.optionsAm   : currentQ.options;
  const expl   = lang === 'am' ? currentQ.explanationAm : currentQ.explanation;
  const catLbl = UI.categoryLabels[currentQ.category]?.[lang] ?? currentQ.category;

  const getOptionClass = (_opt: string, idx: number): string => {
    const engOpt = currentQ.options[idx]; // canonical key
    if (!isAnswered) {
      return selectedOption === engOpt ? 'selected' : '';
    }
    if (engOpt === currentQ.correctAnswer) {
      return 'correct';
    }
    if (selectedOption === engOpt) {
      return 'incorrect';
    }
    return '';
  };

  return (
    <div className="lm-container" role="main" aria-label="Logic Masters — Playing">
      {/* Header */}
      <header className="lm-header">
        <div className="lm-header-brand">
          <div className="lm-brand-icon" aria-hidden="true">
            <Target size={18} color="#06b6d4" />
          </div>
          <div>
            <h2 className="lm-title">{UI.title[lang]}</h2>
            <span className="lm-mode-chip">
              {UI[difficulty][lang]}
            </span>
          </div>
        </div>
        <div className="lm-header-controls">
          <button
            type="button"
            className="lm-control-btn"
            onClick={handleRestart}
            title={UI.restart[lang]}
            aria-label="Restart"
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            className="lm-control-btn lm-exit-btn"
            onClick={handleExit}
            title={UI.exit[lang]}
            aria-label="Exit"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <div className="lm-play-view">
        {/* Progress bar */}
        <div>
          <div className="lm-progress-bar-track" role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={sessionQuestions.length}
          >
            <div className="lm-progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="lm-progress-meta">
            <span>
              {UI.question[lang]} {currentIndex + 1} {UI.of[lang]} {sessionQuestions.length}
            </span>
            <div className="lm-score-badge">
              <Zap size={12} />
              {totalScore} XP
            </div>
          </div>
        </div>

        {/* Timer (timed mode) */}
        {gameMode === 'timed' && (
          <div className="lm-timer-bar">
            <Timer size={14} color={timerDanger ? '#ef4444' : timerWarning ? '#f59e0b' : '#06b6d4'} />
            <span>{UI.timeLeft[lang]}:</span>
            <span className={`lm-timer-value ${timerDanger ? 'danger' : timerWarning ? 'warning' : ''}`}>
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Question meta */}
        <div className="lm-q-meta">
          <span className={`lm-q-chip cat`}>{catLbl}</span>
          <span className={`lm-q-chip diff-${currentQ.difficulty}`}>{UI[currentQ.difficulty][lang]}</span>
        </div>

        {/* Question card */}
        <div className="lm-question-card">
          <p className="lm-question-text" id="lm-question-text">
            {qText}
          </p>
        </div>

        {/* Options */}
        <div className="lm-options-grid" role="group" aria-labelledby="lm-question-text">
          {opts.map((opt, idx) => {
            const engOpt = currentQ.options[idx];
            const cls    = getOptionClass(opt, idx);
            return (
              <button
                key={engOpt}
                type="button"
                className={`lm-option-btn ${cls}`}
                onClick={() => handleSelectOption(engOpt)}
                disabled={isAnswered}
                aria-pressed={selectedOption === engOpt}
                id={`lm-option-${idx}`}
              >
                <span className="lm-option-letter" aria-hidden="true">
                  {LETTERS[idx]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div
            className={`lm-feedback-box ${selectedOption === currentQ.correctAnswer ? 'correct-fb' : 'incorrect-fb'}`}
            role="alert"
          >
            <div className="lm-feedback-header">
              {selectedOption === currentQ.correctAnswer ? (
                <>
                  <CheckCircle2 size={16} color="#4ade80" />
                  <span className="lm-feedback-correct-lbl">{UI.correct[lang]}</span>
                  <span style={{ color: '#4ade80', marginLeft: 'auto', fontSize: '0.8rem' }}>
                    +{POINTS_PER_DIFFICULTY[difficulty]} XP
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={16} color="#f87171" />
                  <span className="lm-feedback-incorrect-lbl">{UI.incorrect[lang]}</span>
                </>
              )}
            </div>
            <p className="lm-feedback-explanation">{expl}</p>
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <button
            type="button"
            className="lm-next-btn"
            onClick={handleNextQuestion}
            id="lm-next-btn"
          >
            {currentIndex + 1 < sessionQuestions.length
              ? <><ChevronRight size={16} />{UI.nextQ[lang]}</>
              : <><Trophy size={16} />{UI.seeResults[lang]}</>
            }
          </button>
        )}
      </div>
    </div>
  );
};
