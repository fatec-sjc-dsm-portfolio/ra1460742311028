import { gsap, shouldAnimate } from '@/utils/gsapRegister';

export function initHeroScene(): void {
  if (!shouldAnimate()) return;

  const targets = [
    '[data-hero-eyebrow]',
    '[data-hero-title]',
    '[data-hero-sub]',
    '[data-hero-cta]',
    '[data-hero-portrait]',
  ]
    .map((sel) => document.querySelector<HTMLElement>(sel))
    .filter((el): el is HTMLElement => el !== null);

  if (targets.length === 0) return;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out', duration: 0.7 },
    onInterrupt: () => gsap.set(targets, { clearProps: 'all' }),
  });

  tl.from('[data-hero-eyebrow]',  { autoAlpha: 0, y: 12, clearProps: 'all' })
    .from('[data-hero-title]',    { autoAlpha: 0, y: 20, duration: 0.9, clearProps: 'all' }, '<0.05')
    .from('[data-hero-sub]',      { autoAlpha: 0, y: 16, clearProps: 'all' }, '<0.15')
    .from('[data-hero-cta]',      { autoAlpha: 0, y: 12, stagger: 0.08, duration: 0.5, clearProps: 'all' }, '<0.15')
    .from('[data-hero-portrait]', { autoAlpha: 0, scale: 0.96, duration: 0.9, clearProps: 'all' }, '<0');
}
