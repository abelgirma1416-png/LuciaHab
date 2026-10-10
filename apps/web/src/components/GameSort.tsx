import React from 'react';
import type { GameSortOption } from '../types/game';
import { useLanguage } from '../context/useLanguage';
import { ArrowUpDown } from 'lucide-react';

interface GameSortProps {
  currentSort: GameSortOption;
  onSortChange: (sort: GameSortOption) => void;
  resultCount: number;
}

export const GameSort: React.FC<GameSortProps> = ({
  currentSort,
  onSortChange,
  resultCount,
}) => {
  const { language } = useLanguage();

  return (
    <div className="game-sort-container">
      <div className="game-sort-count-badge">
        <span className="count-number">{resultCount}</span>
        <span className="count-label">
          {language === 'am' ? 'ጨዋታዎች ተገኝተዋል' : resultCount === 1 ? 'game found' : 'games found'}
        </span>
      </div>

      <div className="game-sort-select-box">
        <ArrowUpDown size={14} strokeWidth={2} className="sort-icon" aria-hidden="true" />
        <label htmlFor="game-sort-select" className="sr-only">
          {language === 'am' ? 'ደርድር' : 'Sort games'}
        </label>
        <select
          id="game-sort-select"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as GameSortOption)}
          className="game-sort-select"
          aria-label={language === 'am' ? 'በምን ቅደም ተከተል ይደረደር' : 'Sort by'}
        >
          <option value="popular">
            {language === 'am' ? 'በተወዳጅነት (Popular)' : 'Most Popular'}
          </option>
          <option value="newest">
            {language === 'am' ? 'አዲስ የተጨመሩ (Newest)' : 'Newest Releases'}
          </option>
          <option value="name_asc">
            {language === 'am' ? 'ስም: ከ A እስከ Z (Name: A–Z)' : 'Name: A to Z'}
          </option>
          <option value="diff_asc">
            {language === 'am' ? 'ደረጃ: ከቀላል ወደ ከባድ' : 'Difficulty: Easy to Hard'}
          </option>
          <option value="diff_desc">
            {language === 'am' ? 'ደረጃ: ከከባድ ወደ ቀላል' : 'Difficulty: Hard to Easy'}
          </option>
        </select>
      </div>
    </div>
  );
};
