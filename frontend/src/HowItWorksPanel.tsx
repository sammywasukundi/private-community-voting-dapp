import React from 'react';
import { HelpCircle, Eye, EyeOff } from 'lucide-react';
import { useI18n, type TKey } from './i18n';

const STEP_KEYS: TKey[] = [
  'howItWorks.step1',
  'howItWorks.step2',
  'howItWorks.step3',
  'howItWorks.step4',
  'howItWorks.step5',
  'howItWorks.step6',
  'howItWorks.step7',
];

const NETWORK_SEES_KEYS: TKey[] = [
  'howItWorks.sees1',
  'howItWorks.sees2',
  'howItWorks.sees3',
];

const NETWORK_DOES_NOT_SEE_KEYS: TKey[] = [
  'howItWorks.notSees1',
  'howItWorks.notSees2',
];

const HowItWorksPanel: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="card">
      <h2>
        <HelpCircle size={18} />
        {t('howItWorks.title')}
      </h2>
      <p className="empty-hint">{t('howItWorks.intro')}</p>

      <ol style={{ margin: '0 0 var(--space-4)', paddingLeft: '1.25em', lineHeight: 1.6 }}>
        {STEP_KEYS.map((key) => (
          <li key={key} style={{ marginBottom: 'var(--space-2)' }}>
            {t(key)}
          </li>
        ))}
      </ol>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div className="result-item" style={{ textAlign: 'left', padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Eye size={16} />
            <strong>{t('howItWorks.networkSeesTitle')}</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1em', lineHeight: 1.6 }}>
            {NETWORK_SEES_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>

        <div className="result-item" style={{ textAlign: 'left', padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <EyeOff size={16} />
            <strong>{t('howItWorks.networkDoesNotSeeTitle')}</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1em', lineHeight: 1.6 }}>
            {NETWORK_DOES_NOT_SEE_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="empty-hint" style={{ marginTop: 'var(--space-4)' }}>
        {t('howItWorks.caveat')}
      </p>
    </div>
  );
};

export default HowItWorksPanel;