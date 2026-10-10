import React from 'react';
import type {
  PlayerProfile,
  PlayerStats as PlayerStatsType,
  Game,
  DailyChallenge as DailyChallengeType,
  LeaderboardEntry,
  Achievement,
} from '../types';
import { Hero } from '../components/Hero';
import { PlayerStats } from '../components/PlayerStats';
import { FeaturedGames } from '../components/FeaturedGames';
import { DailyChallenge } from '../components/DailyChallenge';
import { LeaderboardPreview } from '../components/LeaderboardPreview';
import { AchievementsSection } from '../components/AchievementsSection';

interface HomePageProps {
  player: PlayerProfile;
  stats: PlayerStatsType;
  featuredGames: Game[];
  dailyChallenge: DailyChallengeType;
  leaderboardEntries: LeaderboardEntry[];
  achievements: Achievement[];
  onSelectGame: (game: Game) => void;
  onViewAllGames: () => void;
  onViewFullLeaderboard: () => void;
  onStartChallenge: (challenge: DailyChallengeType) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  player,
  stats,
  featuredGames,
  dailyChallenge,
  leaderboardEntries,
  achievements,
  onSelectGame,
  onViewAllGames,
  onViewFullLeaderboard,
  onStartChallenge,
}) => {
  return (
    <main className="gameverse-page" id="main-content">
      {/* 1. Welcome Hero */}
      <Hero
        player={player}
        dailyChallenge={dailyChallenge}
        onPlayNow={() => onSelectGame(featuredGames[0])}
        onViewChallenge={() => onStartChallenge(dailyChallenge)}
      />

      {/* 2. Player Performance Statistics */}
      <PlayerStats stats={stats} />

      {/* 3. Daily Challenge Feature Section */}
      <DailyChallenge
        challenge={dailyChallenge}
        onStartChallenge={onStartChallenge}
      />

      {/* 4. Featured Games Grid */}
      <FeaturedGames
        games={featuredGames}
        onSelectGame={onSelectGame}
        onViewAllGames={onViewAllGames}
      />

      {/* 5. Leaderboard Quick Preview */}
      <LeaderboardPreview
        entries={leaderboardEntries}
        onViewFullLeaderboard={onViewFullLeaderboard}
      />

      {/* 6. Achievements and Milestones */}
      <AchievementsSection achievements={achievements} />
    </main>
  );
};
