import type {
  Game,
  PlayerProfile,
  PlayerStats,
  DailyChallenge,
  LeaderboardEntry,
  Achievement,
  NotificationItem,
} from '../types';

/**
 * DEVELOPMENT MOCK DATA
 * 
 * Note on Architecture & Security:
 * In production, player statistics, leaderboard ranks, and points are fetched
 * directly from Supabase PostgreSQL tables (e.g. `players`, `game_sessions`, `scores`)
 * protected by Row Level Security (RLS).
 * 
 * Scores and points are NEVER trusted directly from the client. They are verified
 * by backend validation endpoints or serverless functions before being committed.
 */

export const MOCK_PLAYER_PROFILE: PlayerProfile = {
  id: 'usr_dev_89412',
  username: 'dawit_gamer',
  displayName: 'Dawit Solomon',
  displayNameAm: 'ዳዊት ሰሎሞን',
  initials: 'DS',
  tier: 'Grandmaster Elite',
  tierAm: 'ታላቅ አዋቂ ሊግ',
  level: 18,
  isVerifiedTelegram: true,
  telegramHandle: '@dawit_s',
};

export const MOCK_PLAYER_STATS: PlayerStats = {
  totalPoints: 14850,
  gamesPlayed: 142,
  leaderboardRank: 14,
  totalPlayers: 2840,
  dailyStreakDays: 5,
  weeklyWinRate: 78,
  completedChallengesCount: 26,
  isMockData: true,
};

import { GAME_CATALOG } from './games';

export const FEATURED_GAMES: Game[] = GAME_CATALOG;

export const MOCK_DAILY_CHALLENGE: DailyChallenge = {
  id: 'daily_ch_2026_10_09',
  title: 'Mind Sprint Blitz: 10 Flawless Answers',
  titleAm: 'ፈጣን አዕምሮ፡ 10 እንከን አልባ መልሶች',
  gameId: 'ethiopian-mind-sprint-trivia',
  gameTitle: 'Ethiopian Mind Sprint Trivia',
  instructions: 'Answer 10 consecutive Ethiopian cultural trivia questions in under 90 seconds without a strike.',
  instructionsAm: 'በ90 ሰከንድ ውስጥ 10 የኢትዮጵያ ባህልና ታሪክ ጥያቄዎችን ሳትሳሳቱ በተከታታይ መልሱ።',
  rewardPoints: 250,
  status: 'in_progress',
  currentProgress: 6,
  targetProgress: 10,
  expiresInHours: 6,
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    id: 'usr_top_1',
    displayName: 'Almaz Ayana_Pro',
    initials: 'AA',
    score: 38400,
    gamesWon: 184,
    tier: 'Legendary',
  },
  {
    rank: 2,
    id: 'usr_top_2',
    displayName: 'Kenenisa_Speed',
    initials: 'KB',
    score: 34150,
    gamesWon: 162,
    tier: 'Legendary',
  },
  {
    rank: 3,
    id: 'usr_top_3',
    displayName: 'Selamawit.T',
    initials: 'ST',
    score: 31800,
    gamesWon: 147,
    tier: 'Grandmaster',
  },
  {
    rank: 4,
    id: 'usr_top_4',
    displayName: 'Abebe_Bikila',
    initials: 'AB',
    score: 29500,
    gamesWon: 139,
    tier: 'Grandmaster',
  },
  {
    rank: 5,
    id: 'usr_top_5',
    displayName: 'Tewodros_Strategist',
    initials: 'TS',
    score: 27200,
    gamesWon: 125,
    tier: 'Diamond',
  },
  {
    rank: 14,
    id: 'usr_dev_89412',
    displayName: 'Dawit Solomon (You)',
    initials: 'DS',
    score: 14850,
    gamesWon: 74,
    tier: 'Grandmaster Elite',
    isCurrentPlayer: true,
  },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_arithmetic_ace',
    title: 'Lightning Calculator',
    titleAm: 'የመብረቅ ስሌት አዋቂ',
    description: 'Solve 20 arithmetic equations under 45 seconds in Turbo Math.',
    descriptionAm: 'በቱርቦ ሒሳብ ውስጥ በ45 ሰከንድ 20 ስሌቶችን በትክክል አጠናቋል።',
    icon: '⚡',
    category: 'math',
    unlocked: true,
    unlockedAt: 'Yesterday',
    progress: 20,
    maxProgress: 20,
    xpReward: 300,
  },
  {
    id: 'ach_ethio_historian',
    title: 'Lalibela Scholar',
    titleAm: 'የላሊበላ ሊቅ',
    description: 'Score 100% accuracy on Axum and Lalibela trivia modules.',
    descriptionAm: 'በአክሱምና ላሊበላ ታሪክ ጥያቄዎች ላይ 100% ትክክለኛ ውጤት ያስመዝግቡ።',
    icon: '📜',
    category: 'trivia',
    unlocked: true,
    unlockedAt: '3 days ago',
    progress: 10,
    maxProgress: 10,
    xpReward: 450,
  },
  {
    id: 'ach_memory_architect',
    title: 'Matrix Mastermind',
    titleAm: 'የማትሪክስ መሪ',
    description: 'Reach stage 12 in Heritage Memory Matrix without any memory lifeline.',
    descriptionAm: 'በቅርስ ማትሪክስ ጨዋታ ያለ ምንም እርዳታ ደረጃ 12 ድረስ ይድረሱ።',
    icon: '🧠',
    category: 'memory',
    unlocked: false,
    progress: 8,
    maxProgress: 12,
    xpReward: 500,
  },
  {
    id: 'ach_chess_tactician',
    title: 'Senterej Prodigy',
    titleAm: 'የሰንጠረዥ ባለሙያ',
    description: 'Solve 50 Grandmaster tactical chess puzzles.',
    descriptionAm: '50 የቼስ ስልታዊ እንቆቅልሾችን ፈትተው ያጠናቅቁ።',
    icon: '👑',
    category: 'chess',
    unlocked: false,
    progress: 34,
    maxProgress: 50,
    xpReward: 750,
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Weekend Grand Prix Announced',
    titleAm: 'የሳምንቱ መጨረሻ ታላቅ ውድድር',
    message: 'Ethiopian Mind Sprint tournament kicks off this Saturday. Top 3 win exclusive trophy badges!',
    messageAm: 'የኢትዮጵያ አዕምሮ ውድድር ቅዳሜ ይጀምራል። አሸናፊዎች ልዩ የክብር ባጅ ያገኛሉ!',
    timestamp: '15m ago',
    isRead: false,
    type: 'announcement',
  },
  {
    id: 'notif_2',
    title: 'Daily Streak Maintained',
    titleAm: 'የቀን ተከታታይነት ተጠብቋል',
    message: 'You have logged in 5 days straight. Daily multiplier is now 1.25x for all challenges.',
    messageAm: 'ለ5 ተከታታይ ቀናት ተሳትፈዋል። የቀን ማባዣዎ አሁን 1.25 እጥፍ ሆኗል!',
    timestamp: '3h ago',
    isRead: false,
    type: 'reward',
  },
  {
    id: 'notif_3',
    title: 'Security & Platform Update',
    titleAm: 'የደህንነትና የሲስተም መረጃ',
    message: 'Backend anti-cheat and score verification engine active. Fair play guaranteed.',
    messageAm: 'የውጤት ማረጋገጫ ሲስተም በስራ ላይ ይገኛል። ፍትሃዊ ውድድር የተረጋገጠ ነው።',
    timestamp: '1d ago',
    isRead: true,
    type: 'system',
  },
];
