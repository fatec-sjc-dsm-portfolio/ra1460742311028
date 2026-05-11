import { gsap, ScrollTrigger, shouldAnimate } from '@/utils/gsapRegister';
import { initHeroScene }     from './hero';
import { initSkillsScene }   from './skills';
import { initProjectsScene } from './projects';
import { initCertsScene }    from './certs';

interface PaletteStop {
  readonly trigger: string;
  readonly color: string;
}

const PALETTE: readonly PaletteStop[] = [
  { trigger: '#hero',       color: '#0A0B0D' },
  { trigger: '#skills',     color: '#0D0F13' },
  { trigger: '#experience', color: '#0E1014' },
  { trigger: '#projects',   color: '#101216' },
  { trigger: '#certs',      color: '#0B0D11' },
  { trigger: '#contact',    color: '#0A0B0D' },
];

function initHeaderCondense(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (!header) return;

  const onScroll = (): void => {
    header.classList.toggle('is-condensed', window.scrollY > 80);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function initScrollStory(): void {
  if (!shouldAnimate()) {
    initHeaderCondense();
    return;
  }

  initHeroScene();
  initSkillsScene();
  initProjectsScene();
  initCertsScene();

  PALETTE.forEach(({ trigger, color }) => {
    const el = document.querySelector(trigger);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 50%',
      end:   'bottom 50%',
      onToggle: (self) => {
        if (self.isActive) {
          gsap.to(document.body, { backgroundColor: color, duration: 0.6, ease: 'power2.out' });
        }
      },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 20,
      duration: 0.7,
      ease: 'power3.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });

  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (header) {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'bottom top+=80',
      onToggle: (self) => header.classList.toggle('is-condensed', !self.isActive),
    });
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
  });
}
