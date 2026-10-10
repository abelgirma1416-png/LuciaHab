import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

interface EmptyStateProps {
  searchQuery: string;
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  onReset,
}) => {
  const { language } = useLanguage();

  return (
    <div className="game-empty-state" role="status">
      <div className="empty-state-icon-box" aria-hidden="true">
        <Sparkles size={36} strokeWidth={1.5} color="var(--accent-purple-light)" />
      </div>
      <h3 className="empty-state-title">
        {language === 'am' ? 'ምንም የሚመሳሰል ጨዋታ አልተገኘም' : 'No Games Matched Your Filter'}
      </h3>
      <p className="empty-state-desc">
        {searchQuery ? (
          language === 'am' ? (
            <>
              ለ «<strong>{searchQuery}</strong>» የተገኘ ጨዋታ የለም። ፊደላትን ያረጋግጡ ወይም ሌላ ቃል ይሞክሩ።
            </>
          ) : (
            <>
              No challenges found for «<strong>{searchQuery}</strong>». Try a different keyword or category.
            </>
          )
        ) : (
          language === 'am'
            ? 'በተመረጠው ምድብ ውስጥ ጨዋታዎች በቅርቡ ይጨመራሉ።'
            : 'No games are currently listed under this category filter.'
        )}
      </p>
      <button
        type="button"
        className="btn-secondary empty-state-reset-btn"
        onClick={onReset}
        id="empty-state-reset-filters-btn"
      >
        <RefreshCw size={14} strokeWidth={2} />
        <span>{language === 'am' ? 'ሁሉንም ጨዋታዎች አሳይ' : 'Reset All Filters'}</span>
      </button>
    </div>
  );
};
