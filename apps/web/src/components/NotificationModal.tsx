import React from 'react';
import type { NotificationItem } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Bell, Check, X } from 'lucide-react';

interface NotificationModalProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
}) => {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notif-modal-title">
      <div className="modal-content-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} strokeWidth={2} color="var(--accent-purple-light)" />
            <h3 id="notif-modal-title" style={{ fontSize: '1.2rem', color: '#fff' }}>
              {t('notifications_title')}
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

        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            {t('no_notifications')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notif) => {
              const title = language === 'am' ? notif.titleAm : notif.title;
              const msg = language === 'am' ? notif.messageAm : notif.message;

              return (
                <div
                  key={notif.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: notif.isRead ? 'rgba(255, 255, 255, 0.03)' : 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid',
                    borderColor: notif.isRead ? 'var(--surface-glass-border)' : 'rgba(168, 85, 247, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                      {title}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {notif.timestamp}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {msg}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={onMarkAllRead}
          >
            <Check size={14} strokeWidth={2.5} />
            {t('mark_all_read')}
          </button>
        </div>
      </div>
    </div>
  );
};
