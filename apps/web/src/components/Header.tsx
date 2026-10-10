import React from 'react';
import type { PlayerProfile, NotificationItem } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Gamepad2, Bell, Globe, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  player: PlayerProfile;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onBrandClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  notifications,
  onOpenNotifications,
  onOpenProfile,
  onBrandClick,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="site-header" role="banner">
      {/* Brand Section */}
      <div 
        className="brand-section" 
        onClick={onBrandClick}
        role="button"
        tabIndex={0}
        aria-label="GameVerse Home"
        onKeyDown={(e) => e.key === 'Enter' && onBrandClick()}
      >
        <div className="brand-logo-icon">
          <Gamepad2 size={20} color="#fff" strokeWidth={2} />
        </div>
        <div className="brand-text-container">
          <span className="brand-name">GameVerse</span>
          <span className="brand-tagline">
            {language === 'am' ? 'የጨዋታ ማዕከል' : 'Gaming Hub'}
          </span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="header-actions">
        {/* Language Switcher */}
        <button
          type="button"
          className="lang-toggle-btn"
          onClick={toggleLanguage}
          title="Switch Language / ቋንቋ ቀይር"
          aria-label="Toggle language between English and Amharic"
        >
          <Globe size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          {language === 'en' ? 'አማ' : 'EN'}
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenNotifications}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          title={t('notifications_title')}
        >
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 && <span className="notification-dot" aria-hidden="true" />}
        </button>

        {/* Profile Pill */}
        <button
          type="button"
          className="profile-pill-btn"
          onClick={onOpenProfile}
          aria-label="Open player profile"
          title={player.displayName}
        >
          <div className="avatar-circle">
            {player.initials}
            {player.isVerifiedTelegram && (
              <span className="tg-verified-badge" title="Verified Telegram Player">
                <CheckCircle2 size={8} strokeWidth={3} />
              </span>
            )}
          </div>
          <div className="profile-pill-info">
            <span className="profile-pill-name">
              {language === 'am' ? player.displayNameAm : player.displayName}
            </span>
            <span className="profile-pill-level">Lvl {player.level}</span>
          </div>
        </button>
      </div>
    </header>
  );
};
