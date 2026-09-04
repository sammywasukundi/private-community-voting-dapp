import React, { useEffect, useRef } from 'react';
import {
  HelpCircle,
  Wallet,
  ListPlus,
  Fingerprint,
  Lock,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useI18n, type TKey } from './i18n';

const STEPS: { key: TKey; Icon: typeof Wallet }[] = [
  { key: 'howItWorks.step1', Icon: Wallet },
  { key: 'howItWorks.step2', Icon: ListPlus },
  { key: 'howItWorks.step3', Icon: Fingerprint },
  { key: 'howItWorks.step4', Icon: Lock },
  { key: 'howItWorks.step5', Icon: ShieldCheck },
  { key: 'howItWorks.step6', Icon: BarChart3 },
  { key: 'howItWorks.step7', Icon: CheckCircle2 },
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

/**
 * Reveals every element carrying `data-reveal` inside `root` once it enters
 * the viewport, by toggling the `is-visible` class. One shared observer,
 * disconnected on unmount — cheap even with many steps on the page.
 */
function useScrollReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = root.current;
    if (!container) return;

    const targets = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [root]);
}

const HowItWorksPanel: React.FC = () => {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef);

  return (
    <div ref={rootRef}>
      <div className="hiw-hero">
        <span className="hiw-hero-icon">
          <HelpCircle size={26} />
        </span>
        <h2>{t('howItWorks.title')}</h2>
        <p>{t('howItWorks.intro')}</p>
      </div>

      <ol className="hiw-timeline">
        {STEPS.map(({ key, Icon }, index) => (
          <li
            key={key}
            className="hiw-step"
            data-reveal
            style={{ transitionDelay: `${Math.min(index, 5) * 70}ms` }}
          >
            <span className="hiw-step-marker">
              <Icon size={20} />
            </span>
            <div className="hiw-step-body">
              <span className="hiw-step-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p>{t(key)}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="hiw-visibility" data-reveal>
        <div className="hiw-visibility-card sees">
          <header>
            <Eye size={16} />
            {t('howItWorks.networkSeesTitle')}
          </header>
          <ul>
            {NETWORK_SEES_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>

        <div className="hiw-visibility-card hides">
          <header>
            <EyeOff size={16} />
            {t('howItWorks.networkDoesNotSeeTitle')}
          </header>
          <ul>
            {NETWORK_DOES_NOT_SEE_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="hiw-caveat">{t('howItWorks.caveat')}</p>
    </div>
  );
};

export default HowItWorksPanel;