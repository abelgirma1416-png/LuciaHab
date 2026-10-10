import React, { useState } from 'react';
import type { Language } from '../types';
import { LanguageContext } from './LanguageContextDefinition';

const UI_STRINGS: Record<string, { en: string; am: string }> = {
  // Navigation
  nav_home: { en: 'Home', am: 'መነሻ' },
  nav_games: { en: 'Games', am: 'ጨዋታዎች' },
  nav_leaderboard: { en: 'Leaderboard', am: 'ደረጃዎች' },
  nav_rewards: { en: 'Rewards', am: 'ሽልማቶች' },
  nav_profile: { en: 'Profile', am: 'መገለጫ' },

  // Header & Badges
  beta_tag: { en: 'BETA', am: 'ሙከራ' },
  dev_mock_tag: { en: 'DEV MOCK DATA', am: 'የሙከራ መረጃ' },
  telegram_ready: { en: 'Telegram WebApp Ready', am: 'ቴሌግራም ዝግጁ' },
  notifications_title: { en: 'Notifications', am: 'ማሳወቂያዎች' },
  mark_all_read: { en: 'Mark all as read', am: 'ሁሉንም እንዳነበቡ ምልክት አድርግ' },
  no_notifications: { en: 'No unread notifications', am: 'ምንም ያልተነበበ ማሳወቂያ የለም' },

  // Hero
  greeting_morning: { en: 'Good morning', am: 'እንደምን አደሩ' },
  greeting_afternoon: { en: 'Welcome back', am: 'እንኳን ደህና መጡ' },
  hero_title_sub: { en: 'Premier Brain & Tactical Gaming Hub', am: 'የአዕምሮና የስልት ጨዋታዎች ማዕከል' },
  hero_cta_play: { en: 'Play Now', am: 'አሁን ይጫወቱ' },
  hero_cta_challenge: { en: 'Daily Quest', am: 'የቀን ተልዕኮ' },

  // Stats
  stat_total_points: { en: 'Total Points', am: 'ጠቅላላ ነጥብ' },
  stat_games_played: { en: 'Games Played', am: 'የተጫወቷቸው' },
  stat_global_rank: { en: 'Global Rank', am: 'የአለም ደረጃ' },
  stat_daily_streak: { en: 'Day Streak', am: 'የቀናት ተከታታይ' },
  stat_win_rate: { en: 'Win Rate', am: 'የማሸነፍ መጠን' },

  // Sections
  featured_games_title: { en: 'Featured Games', am: 'ተመራጭ ጨዋታዎች' },
  featured_games_desc: { en: 'High-octane cognitive challenges crafted for keen minds.', am: 'ለፈጣንና ንቁ አዕምሮ የተዘጋጁ ተወዳጅ ጨዋታዎች።' },
  daily_challenge_title: { en: 'Daily Challenge', am: 'የቀኑ ፈተና' },
  daily_challenge_badge: { en: 'Expires in 6h', am: 'በ6 ሰዓት ውስጥ ያልቃል' },
  leaderboard_preview_title: { en: 'Top Champions', am: 'ከፍተኛ ደረጃ ተጫዋቾች' },
  leaderboard_preview_desc: { en: 'Global Telegram & Web rankings. Updated in real-time.', am: 'የዓለም አቀፍ ደረጃ ሰንጠረዥ በቅጽበት የሚታደስ።' },
  achievements_title: { en: 'Achievements & Milestones', am: 'ስኬቶች እና ደረጃዎች' },
  achievements_desc: { en: 'Track earned accolades and battle ribbons.', am: 'ያገኙትን ክብርና ሜዳሊያዎች እዚህ ይመልከቱ።' },

  // Actions
  view_all_games: { en: 'View All Games', am: 'ሁሉንም ጨዋታዎች እይ' },
  view_full_leaderboard: { en: 'View Full Leaderboard', am: 'ሙሉውን ደረጃ ሰንጠረዥ እይ' },
  play_button: { en: 'Play', am: 'ተጫወት' },
  play_game: { en: 'Play Game', am: 'ጨዋታ ጀምር' },
  exit_game: { en: 'Exit Game', am: 'ከጨዋታ ውጣ' },
  restart_game: { en: 'Restart Game', am: 'እንደገና ጀምር' },
  game_score: { en: 'Score', am: 'ውጤት' },
  time_left: { en: 'Time Left', am: 'የቀረ ሰዓት' },
  streak_bonus: { en: 'Streak', am: 'ተከታታይ' },
  game_over_title: { en: 'Time is Up! Game Over', am: 'ጊዜው አልቋል! ጨዋታው ተጠናቋል' },
  final_score_label: { en: 'Final Score', am: 'የመጨረሻ ውጤት' },
  accuracy_label: { en: 'Accuracy', am: 'ትክክለኛነት' },
  start_challenge: { en: 'Start Challenge', am: 'ፈተናውን ጀምር' },
  challenge_in_progress: { en: 'In Progress', am: 'በሂደት ላይ' },
  challenge_completed: { en: 'Completed', am: 'ተጠናቋል' },
  close: { en: 'Close', am: 'ዝጋ' },

  // Security & Disclaimers
  mock_data_notice: {
    en: '⚡ Note: In development mode. Real data will securely sync from Supabase PostgreSQL with server-side validation.',
    am: '⚡ ማስታወሻ፡ በሙከራ ሂደት ላይ። ትክክለኛው ውጤት በሱፓቤዝ ዳታቤዝ እና በአስተማማኝ ሰርቨር የተረጋገጠ ይሆናል።',
  },
  rewards_disclaimer: {
    en: 'Points earned represent in-game achievement score. Monetary reward redemption is subject to verified identity and local compliance.',
    am: 'የተሰበሰበው ነጥብ የጨዋታ ልምድና ስኬት ማሳያ ነው። ሽልማት አሰጣጥ በተረጋገጡ የህግና የደህንነት ደንቦች መሰረት ተግባራዊ ይሆናል።',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  const t = (key: string): string => {
    const entry = UI_STRINGS[key];
    if (!entry) return key;
    return entry[language] || entry.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
