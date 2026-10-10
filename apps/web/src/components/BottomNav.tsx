import React from 'react';
import type { TabKey } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Home, Gamepad2, Trophy, Gift, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

interface NavItemConfig {
  key: TabKey;
  Icon: React.ElementType;
  labelKey: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { key: 'home', Icon: Home, labelKey: 'nav_home' },
  { key: 'games', Icon: Gamepad2, labelKey: 'nav_games' },
  { key: 'leaderboard', Icon: Trophy, labelKey: 'nav_leaderboard' },
  { key: 'rewards', Icon: Gift, labelKey: 'nav_rewards' },
  { key: 'profile', Icon: User, labelKey: 'nav_profile' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav-container" aria-label="Main Navigation">
      <div className="bottom-nav-bar">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`nav-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.key)}
              id={`nav-tab-${item.key}`}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-tab-icon" aria-hidden="true">
                <item.Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
              </span>
              <span className="nav-tab-label">{t(item.labelKey)}</span>
              {isActive && <span className="nav-tab-active-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
