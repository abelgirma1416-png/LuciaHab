import React from 'react';
import type { GameCategory } from '../types/game';
import { useLanguage } from '../context/useLanguage';
import {
  Gamepad2,
  Calculator,
  Brain,
  Layers,
  Crown,
  BookOpen,
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: GameCategory;
  onSelectCategory: (category: GameCategory) => void;
  categoryCounts: Record<GameCategory, number>;
}

interface CategoryItem {
  key: GameCategory;
  labelEn: string;
  labelAm: string;
  Icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  { key: 'all', labelEn: 'All Games', labelAm: 'ሁሉም ጨዋታዎች', Icon: Gamepad2 },
  { key: 'math', labelEn: 'Mathematics', labelAm: 'ሒሳብ', Icon: Calculator },
  { key: 'trivia', labelEn: 'Trivia', labelAm: 'ጥያቄና መልስ', Icon: Brain },
  { key: 'memory', labelEn: 'Memory', labelAm: 'ማስታወስ', Icon: Layers },
  { key: 'chess', labelEn: 'Strategy', labelAm: 'ስልት', Icon: Crown },
  { key: 'educational', labelEn: 'Educational', labelAm: 'ትምህርታዊ', Icon: BookOpen },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const { language } = useLanguage();

  return (
    <nav className="category-filter-nav" aria-label="Game categories filter">
      <div className="category-filter-scroll">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          const count = categoryCounts[cat.key] || 0;
          const label = language === 'am' ? cat.labelAm : cat.labelEn;

          return (
            <button
              key={cat.key}
              type="button"
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.key)}
              id={`cat-filter-${cat.key}`}
              aria-pressed={isActive}
            >
              <cat.Icon
                size={15}
                strokeWidth={isActive ? 2.5 : 1.75}
                className="category-pill-icon"
                aria-hidden="true"
              />
              <span className="category-pill-label">{label}</span>
              <span className="category-pill-count" aria-label={`${count} games`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
