import React, { useState } from 'react';
import type { Achievement } from '../types';
import { useLanguage } from '../context/useLanguage';
import { Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
}) => {
  const { language, t } = useLanguage();
  const [showDemoEmptyState, setShowDemoEmptyState] = useState(false);

  const displayList = showDemoEmptyState ? [] : achievements;

  return (
    <section aria-labelledby="achievements-heading">
      <div className="section-header-block">
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 id="achievements-heading" className="section-title">
              <Award size={18} strokeWidth={2} color="var(--accent-gold)" />
              {t('achievements_title')}
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              {language === 'am' ? 'የሙከራ ስኬቶች' : 'Demo Medals'}
            </span>
          </div>
          <p className="section-subtitle">{t('achievements_desc')}</p>
        </div>

        {/* Interactive toggle to test zero achievements empty state */}
        <button
          type="button"
          className="section-action-btn"
          onClick={() => setShowDemoEmptyState(!showDemoEmptyState)}
          title="Toggle empty state view for UI validation"
          id="toggle-empty-state-btn"
        >
          {showDemoEmptyState ? 'Show Milestones' : 'Test Empty State'}
        </button>
      </div>

      {displayList.length === 0 ? (
        <div className="empty-state-card" role="status">
          <Award size={44} strokeWidth={1.5} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>
            {language === 'am' ? 'እስካሁን የተመዘገበ ስኬት የለም' : 'No Achievements Earned Yet'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
            {language === 'am'
              ? 'የዕለት ተልዕኮዎችን በማጠናቀቅና ጨዋታዎችን በማሸነፍ የመጀመሪያውን ሜዳሊያ ያግኙ!'
              : 'Complete daily challenges and triumph in cognitive matches to unlock your first honors.'}
          </p>
        </div>
      ) : (
        <div className="achievements-grid">
          {displayList.map((ach) => {
            const title = language === 'am' ? ach.titleAm : ach.title;
            const desc = language === 'am' ? ach.descriptionAm : ach.description;
            const percent = Math.round((ach.progress / ach.maxProgress) * 100);

            return (
              <div
                key={ach.id}
                className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon-box" aria-hidden="true">
                  <Sparkles size={20} strokeWidth={2} color={ach.unlocked ? 'var(--accent-gold)' : 'var(--text-dim)'} />
                </div>

                <div className="achievement-info">
                  <div className="achievement-header">
                    <span className="achievement-title">{title}</span>
                    <span className="achievement-reward">+{ach.xpReward} XP</span>
                  </div>

                  <p className="achievement-desc">{desc}</p>

                  <div className="achievement-progress-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      <span>
                        {ach.unlocked 
                          ? (
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={11} strokeWidth={2.5} />
                                {language === 'am' ? `የተከፈተ (${ach.unlockedAt})` : `Unlocked (${ach.unlockedAt})`}
                              </span>
                            )
                          : (
                              <span style={{ color: 'var(--accent-purple-light)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Lock size={11} strokeWidth={2} />
                                {language === 'am' ? 'በሂደት ላይ' : 'In Progress'}
                              </span>
                            )}
                      </span>
                      <span>{ach.progress}/{ach.maxProgress} ({percent}%)</span>
                    </div>

                    <div className="progress-track" style={{ height: '6px' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percent}%`,
                          background: ach.unlocked
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : 'linear-gradient(90deg, #a855f7, #c084fc)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
