import React from 'react';
import { useLanguage } from '../context/useLanguage';

export const RewardsPage: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <main className="gameverse-page">
      <div className="section-title-wrap">
        <h1 style={{ fontSize: '1.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎁</span> {t('nav_rewards')}
        </h1>
        <p className="section-subtitle">
          {language === 'am' ? 'የወደፊት የሽልማት ማዕከል' : 'Future Rewards & Redemption Vault'}
        </p>
      </div>

      {/* Honest Placeholder Card */}
      <div className="placeholder-view">
        <div className="placeholder-icon">🪙</div>
        <div className="placeholder-status-tag">
          {language === 'am' ? 'በግንባታ ሂደት ላይ / Roadmap Phase 2' : 'Under Active Architecture / Phase 2 Roadmap'}
        </div>
        <h2 className="placeholder-title">
          {language === 'am' ? 'የሽልማት ስርዓቱ በቅርቡ ይፋ ይሆናል' : 'Verified Rewards System Coming Soon'}
        </h2>
        <p className="placeholder-desc">
          {language === 'am'
            ? 'አሁን የሚያገኟቸው ነጥቦች (XP) የጨዋታ ብቃትና የደረጃ ማሳያ ናቸው። እውነተኛ ሽልማቶች የህግ፣ የፋይናንስ እና የተጠቃሚ ማንነት ማረጋገጫ ሲጠናቀቅ ይጀመራሉ።'
            : 'Points currently earned represent in-game achievement score (XP). A legitimate reward vault requires escrow funding, regulatory clearance, and server-side anti-fraud verification before launch.'}
        </p>

        {/* Security & Regulatory Transparency Box */}
        <div
          style={{
            maxWidth: '520px',
            textAlign: 'left',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--surface-glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
            marginTop: '8px',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>
            ⚖️ Compliance & Security Notice:
          </div>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Ordinary gameplay XP is separated from future redeemable prize credits.</li>
            <li>No real-money promises are made prior to authorized payment gateway integration.</li>
            <li>All reward triggers will require server-validated match proofs.</li>
          </ul>
        </div>
      </div>
    </main>
  );
};
