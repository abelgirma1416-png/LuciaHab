import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

interface GameSearchProps {
  value: string;
  onChange: (value: string) => void;
  totalGames: number;
}

export const GameSearch: React.FC<GameSearchProps> = ({
  value,
  onChange,
  totalGames,
}) => {
  const { language } = useLanguage();

  return (
    <div className="game-search-wrapper" role="search">
      <div className="game-search-input-box">
        <Search
          size={18}
          strokeWidth={2}
          className="game-search-icon"
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            language === 'am'
              ? `ከ ${totalGames} ጨዋታዎች መካከል ርዕስ ወይም ዝርዝር ይፈልጉ...`
              : `Search ${totalGames} games by title or description...`
          }
          className="game-search-input"
          aria-label={language === 'am' ? 'ጨዋታዎችን ይፈልጉ' : 'Search games'}
          id="game-catalog-search-input"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="game-search-clear-btn"
            aria-label={language === 'am' ? 'ፍለጋውን አጽዳ' : 'Clear search query'}
            title={language === 'am' ? 'አጽዳ' : 'Clear'}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};
