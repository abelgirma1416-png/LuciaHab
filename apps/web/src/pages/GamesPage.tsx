import React, { useState, useMemo } from 'react';
import type { Game, GameCategory, GameSortOption } from '../types/game';
import { useLanguage } from '../context/useLanguage';
import { GameSearch } from '../components/GameSearch';
import { CategoryFilter } from '../components/CategoryFilter';
import { GameSort } from '../components/GameSort';
import { GameCard } from '../components/GameCard';
import { EmptyState } from '../components/EmptyState';
import { Gamepad2 } from 'lucide-react';

interface GamesPageProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Master: 4,
};

export const GamesPage: React.FC<GamesPageProps> = ({ games, onSelectGame }) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [currentSort, setCurrentSort] = useState<GameSortOption>('popular');

  // Compute category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<GameCategory, number> = {
      all: games.length,
      math: 0,
      trivia: 0,
      memory: 0,
      chess: 0,
      educational: 0,
      puzzle: 0,
    };
    games.forEach((game) => {
      if (counts[game.category] !== undefined) {
        counts[game.category]++;
      }
    });
    return counts;
  }, [games]);

  // Combined Search + Category Filter + Sort
  const processedGames = useMemo(() => {
    // 1. Filter by category
    let result = games.filter((game) => {
      if (selectedCategory === 'all') return true;
      return game.category === selectedCategory;
    });

    // 2. Filter by search query (title + titleAm + description + descriptionAm)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((game) => {
        return (
          game.title.toLowerCase().includes(q) ||
          game.titleAm.includes(q) ||
          game.description.toLowerCase().includes(q) ||
          game.descriptionAm.includes(q)
        );
      });
    }

    // 3. Sort using real data fields
    result = [...result].sort((a, b) => {
      switch (currentSort) {
        case 'popular':
          // Sort by plays count (highest first)
          return b.playsCount - a.playsCount;
        case 'newest':
          // Sort by createdAt ISO timestamp (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name_asc': {
          // Alphabetical by title
          const nameA = language === 'am' ? a.titleAm : a.title;
          const nameB = language === 'am' ? b.titleAm : b.title;
          return nameA.localeCompare(nameB);
        }
        case 'diff_asc':
          // Easy -> Medium -> Hard -> Master
          return (DIFFICULTY_ORDER[a.difficulty] || 0) - (DIFFICULTY_ORDER[b.difficulty] || 0);
        case 'diff_desc':
          // Master -> Hard -> Medium -> Easy
          return (DIFFICULTY_ORDER[b.difficulty] || 0) - (DIFFICULTY_ORDER[a.difficulty] || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [games, selectedCategory, searchQuery, currentSort, language]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentSort('popular');
  };

  return (
    <main className="gameverse-page games-discovery-page" id="main-content">
      {/* 1. Page Header */}
      <header className="games-page-hero">
        <div className="games-page-title-group">
          <div className="games-header-tag-row">
            <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Gamepad2 size={12} strokeWidth={2.5} />
              <span>{games.length} {language === 'am' ? 'የተዘጋጁ ጨዋታዎች' : 'Available Titles'}</span>
            </span>
            <span className="badge badge-cyan">
              {language === 'am' ? 'የአዕምሮ ብቃት' : 'Cognitive Arcade'}
            </span>
          </div>

          <h1 className="games-page-main-title">
            {language === 'am' ? 'ጨዋታዎችን ያስሱ' : 'Explore Games'}
          </h1>
          <p className="games-page-subtitle">
            {language === 'am'
              ? 'ቀጣዩን ፈተናዎን ይምረጡ፤ በአዕምሮ ፍጥነት፣ በኢትዮጵያ ታሪክ ጥያቄዎችና በቼስ ስልት የደረጃ ሰንጠረዡን ይምሩ።'
              : 'Discover your next challenge. Sharpen mental agility with math sprints, cultural trivia, and chess mastery.'}
          </p>
        </div>

        {/* 2. Search Input */}
        <GameSearch
          value={searchQuery}
          onChange={setSearchQuery}
          totalGames={games.length}
        />
      </header>

      {/* 3. Category Filter Tabs */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* 4. Sort Bar and Count Indicator */}
      <GameSort
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        resultCount={processedGames.length}
      />

      {/* 5. Games Grid or Empty State */}
      {processedGames.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          onReset={handleResetFilters}
        />
      ) : (
        <section aria-label="Game catalog list" className="games-catalog-grid">
          {processedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelectGame={onSelectGame}
            />
          ))}
        </section>
      )}
    </main>
  );
};
