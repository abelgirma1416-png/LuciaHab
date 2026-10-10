import React from 'react';
import type { PlayerProfile, PlayerStats } from '../types';
import { useLanguage } from '../context/useLanguage';
import { User, ShieldCheck, X } from 'lucide-react';

interface ProfileModalProps {
  player: PlayerProfile;
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  player,
  stats,
  isOpen,
  onClose,
}) => {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  const displayName = language === 'am' ? player.displayNameAm : player.displayName;
  const tier = language === 'am' ? player.tierAm : player.tier;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="modal-content-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} strokeWidth={2} color="var(--accent-purple-light)" />
            <h3 id="profile-modal-title" style={{ fontSize: '1.2rem', color: '#fff' }}>
              {t('nav_profile')}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('close')}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--surface-2)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-glass-border)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {player.initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                {displayName}
              </span>
              {player.isVerifiedTelegram && (
                <span
                  style={{
                    background: '#0088cc',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                  title="Authenticated via Telegram WebApp initData"
                >
                  ✓ TG Verified
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-purple-light)' }}>
              {tier} • Level {player.level}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              User ID: {player.id} • {player.telegramHandle}
            </span>
          </div>
        </div>

        {/* Quick Stats Grid in Modal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-glass-border)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{t('stat_total_points')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {stats.totalPoints.toLocaleString()} XP
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-glass-border)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{t('stat_global_rank')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
              #{stats.leaderboardRank}
            </div>
          </div>
        </div>

        {/* Architectural Security Notice */}
        <div
          style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            lineHeight: '1.45',
            background: 'rgba(168, 85, 247, 0.08)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} strokeWidth={2} color="var(--accent-purple-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Security & Identity Protocol:</strong>
            <br />
            In production, identity is validated via Telegram <code>initData</code> hash comparison on the backend before matching against Supabase PostgreSQL row policies.
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
