import '@/utils/gsapRegister';

import { gsap, ScrollTrigger, prefersReducedMotion } from '@/utils/gsapRegister';
import { initSmoothScroll } from '@/utils/lenis';
import { initHeader } from '@/components/Header/Header';
import { lps } from '@/data/lps';
import { whatsappUrl, mailtoUrl, LP_CONTACT } from '@/data/lpContact';
import { asset } from '@/utils/asset';
import type { LpItem } from '@/types/lp';

/* ============================================================
   Helpers
   ============================================================ */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveImg(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return asset(src);
  return src;
}

/** Marquee cards render between 280px and 480px wide (clamp). */
const MARQUEE_SIZES = '(max-width: 720px) 320px, (max-width: 1440px) 30vw, 480px';

/** Build a "x-600.webp 600w, x.webp 960w" srcset from a base thumbnail URL. */
function buildThumbSrcset(thumbnail: string): string {
  const base = resolveImg(thumbnail);
  const small = base.replace(/\.webp$/, '-600.webp');
  return `${small} 600w, ${base} 960w`;
}

/* ============================================================
   Marquee — 2 rows, opposite directions, infinite loop
   ============================================================ */

function createMarqueeCard(lp: LpItem, eager: boolean): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'lp-marquee__card';
  a.href = lp.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', `Abrir o site de ${lp.nome} em nova aba`);
  a.style.setProperty('--lp-accent', lp.cor ?? 'var(--accent)');

  const host = (() => {
    try {
      return new URL(lp.url).host;
    } catch {
      return lp.url;
    }
  })();

  const loadAttrs = eager
    ? 'loading="eager" fetchpriority="high"'
    : 'loading="lazy" fetchpriority="low"';

  a.innerHTML = `
    <div class="lp-marquee__preview">
      <div class="lp-marquee__bar" aria-hidden="true">
        <i></i><i></i><i></i>
        <span>${escapeHtml(host)}</span>
      </div>
      <img
        class="lp-marquee__shot"
        src="${escapeHtml(resolveImg(lp.thumbnail))}"
        srcset="${escapeHtml(buildThumbSrcset(lp.thumbnail))}"
        sizes="${escapeHtml(MARQUEE_SIZES)}"
        alt="Pré-visualização do site de ${escapeHtml(lp.nome)}"
        width="960"
        height="540"
        ${loadAttrs}
        decoding="async"
      />
      <div class="lp-marquee__overlay">
        <p class="lp-marquee__overlay-seg">${escapeHtml(lp.segmento)}</p>
        <h3 class="lp-marquee__overlay-title">${escapeHtml(lp.nome)}</h3>
        <p class="lp-marquee__overlay-desc">${escapeHtml(lp.descricao)}</p>
        <span class="lp-marquee__overlay-cta">Ver site <span aria-hidden="true">↗</span></span>
      </div>
    </div>
    <div class="lp-marquee__footer">
      <span class="lp-marquee__name">${escapeHtml(lp.nome)}</span>
      <span class="lp-marquee__hint">${escapeHtml(lp.segmento)}</span>
    </div>
  `;
  return a;
}

function mountMarquee(): void {
  const root = document.querySelector<HTMLElement>('#lp-marquee');
  if (!root) return;
  root.innerHTML = '';

  const rotated = lps.length > 2
    ? [...lps.slice(2), ...lps.slice(0, 2)]
    : [...lps].reverse();

  const rows: { dir: 'left' | 'right'; items: readonly LpItem[] }[] = [
    { dir: 'left', items: lps },
    { dir: 'right', items: rotated },
  ];

  rows.forEach(({ dir, items }) => {
    const row = document.createElement('div');
    row.className = 'lp-marquee__row';
    row.dataset['direction'] = dir;

    const track = document.createElement('div');
    track.className = 'lp-marquee__track';

    // Duplicate set for seamless loop. First 2 cards eager for LCP.
    const doubled = [...items, ...items];
    doubled.forEach((lp, i) => track.appendChild(createMarqueeCard(lp, i < 2)));

    row.appendChild(track);
    root.appendChild(row);
  });
}

function initMarquee(): void {
  if (prefersReducedMotion()) return;

  const rows = Array.from(document.querySelectorAll<HTMLElement>('.lp-marquee__row'));
  const tweens: gsap.core.Tween[] = [];

  const setup = (): void => {
    // Kill previous tweens
    tweens.forEach((t) => t.kill());
    tweens.length = 0;

    rows.forEach((row) => {
      const track = row.querySelector<HTMLElement>('.lp-marquee__track');
      if (!track) return;

      const dir = row.dataset['direction'] === 'right' ? 'right' : 'left';
      const halfWidth = track.scrollWidth / 2;
      if (!halfWidth || !Number.isFinite(halfWidth)) return;

      const speedPxPerSec = 50;
      const duration = halfWidth / speedPxPerSec;

      gsap.set(track, { x: dir === 'left' ? 0 : -halfWidth });

      const tween = gsap.to(track, {
        x: dir === 'left' ? -halfWidth : 0,
        duration,
        ease: 'none',
        repeat: -1,
      });
      tweens.push(tween);

      const pause = (): void => { tween.pause(); };
      const play  = (): void => { tween.play(); };

      row.addEventListener('mouseenter', pause);
      row.addEventListener('mouseleave', play);
      row.addEventListener('focusin', pause);
      row.addEventListener('focusout', play);
    });
  };

  setup();

  // Re-measure on resize (debounced)
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    if (resizeTimer != null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(setup, 250);
  });
}

/* ============================================================
   Wire static UI
   ============================================================ */

function wireContactLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-wa-link]').forEach((a) => {
    a.href = whatsappUrl();
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-mail-link]').forEach((a) => {
    a.href = mailtoUrl();
  });
  document.querySelectorAll<HTMLElement>('[data-lp-count]').forEach((el) => {
    el.textContent = String(lps.length).padStart(2, '0');
  });
  document.querySelectorAll<HTMLElement>('[data-wa-text]').forEach((el) => {
    el.textContent = `+55 ${LP_CONTACT.whatsapp.slice(2, 4)} ${LP_CONTACT.whatsapp.slice(4, 9)}-${LP_CONTACT.whatsapp.slice(9)}`;
  });
}

/* ============================================================
   Hero copy reveal (load-time, no scroll)
   ============================================================ */

function revealHeroCopy(): gsap.core.Timeline | null {
  const els = document.querySelectorAll<HTMLElement>('.lp-hero__inner [data-reveal]');
  if (!els.length) return null;
  if (prefersReducedMotion()) {
    // Keep inline opacity:1 so the `.js [data-reveal] { opacity: 0 }` CSS
    // rule can't re-hide elements after we clear properties.
    gsap.set(els, { autoAlpha: 1, y: 0, clearProps: 'transform' });
    return null;
  }
  const tl = gsap.timeline();
  tl.fromTo(
    els,
    { autoAlpha: 0, y: 18 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.07,
      // Critical: do NOT clear opacity/visibility. The `.js [data-reveal]`
      // rule in lp.css sets opacity:0 to avoid pre-JS flash. If we clear
      // the inline `opacity:1` GSAP sets, the CSS rule reactivates and the
      // hero disappears. Clear only transform so the parallax can take over.
      clearProps: 'transform',
    },
  );
  return tl;
}

/* ============================================================
   Pillars cinematic reveal (once, IO)
   ============================================================ */

interface CounterRef {
  el: HTMLElement;
  target: number;
  prefix: string;
  suffix: string;
}

function initPillars(): void {
  const container = document.querySelector<HTMLElement>('.lp-pillars');
  const pillars = Array.from(document.querySelectorAll<HTMLElement>('.lp-pillar'));
  if (!container || !pillars.length) return;

  const counters: (CounterRef | null)[] = pillars.map((p) => {
    const el = p.querySelector<HTMLElement>('[data-counter]');
    if (!el) return null;
    const target = Number(el.dataset['counter']);
    const prefix = el.dataset['prefix'] ?? '';
    const suffix = el.dataset['suffix'] ?? '';
    if (Number.isNaN(target)) return null;
    return { el, target, prefix, suffix };
  });

  if (prefersReducedMotion()) {
    counters.forEach((c) => {
      if (c) c.el.textContent = `${c.prefix}${c.target}${c.suffix}`;
    });
    return;
  }

  counters.forEach((c) => {
    if (c) c.el.textContent = `${c.prefix}0${c.suffix}`;
  });
  const values = pillars
    .map((p) => p.querySelector<HTMLElement>('.lp-pillar__value'))
    .filter((v): v is HTMLElement => v !== null);

  gsap.set(pillars, { autoAlpha: 0, y: 32 });
  gsap.set(values, { clipPath: 'inset(0 100% 0 0)' });

  const io = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();

        const tl = gsap.timeline();
        pillars.forEach((p, i) => {
          const valueEl = p.querySelector<HTMLElement>('.lp-pillar__value');
          const counter = counters[i];
          const base = i * 0.14;

          tl.to(p, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, base);

          if (valueEl) {
            tl.to(valueEl, {
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.8,
              ease: 'expo.out',
            }, base + 0.18);
          }

          if (counter) {
            const state = { v: 0 };
            tl.to(state, {
              v: counter.target,
              duration: 1.0,
              ease: 'power2.out',
              onUpdate: () => {
                counter.el.textContent = `${counter.prefix}${Math.round(state.v)}${counter.suffix}`;
              },
              onComplete: () => {
                counter.el.textContent = `${counter.prefix}${counter.target}${counter.suffix}`;
              },
            }, base + 0.18);
          }
        });
      }
    },
    { threshold: 0.25 },
  );
  io.observe(container);
}

/* ============================================================
   Hero parallax (after load reveal)
   ============================================================ */

function initHeroParallax(): void {
  if (prefersReducedMotion()) return;
  const heroEl = document.querySelector<HTMLElement>('.lp-hero');
  if (!heroEl) return;
  const triggerCfg = {
    trigger: heroEl,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.6,
  };
  // fromTo with explicit yPercent: 0 start state + immediateRender: false
  // prevents GSAP from flashing the elements at the end state on creation
  // (which was hiding the hero off-screen until first scroll).
  const parallax = (selector: string, yPercent: number): void => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    gsap.fromTo(
      target,
      { yPercent: 0 },
      { yPercent, ease: 'none', immediateRender: false, scrollTrigger: triggerCfg },
    );
  };
  parallax('.lp-hero__eyebrow', -45);
  parallax('.lp-hero__title',   -15);
  parallax('.lp-hero__lede',    -25);
  parallax('.lp-hero__cta',     -30);
  parallax('.lp-hero__metrics', -55);
  ScrollTrigger.refresh();
}

/* ============================================================
   Bootstrap
   ============================================================ */

function bootstrap(): void {
  mountMarquee();
  wireContactLinks();
  initHeader();
  initSmoothScroll();

  const loadTl = revealHeroCopy();
  initPillars();
  initMarquee();

  // Hand off the hero transform from reveal -> parallax cleanly.
  // Use onComplete so parallax sees the final (settled) state and not
  // an in-flight transform from the reveal stagger.
  if (loadTl) {
    loadTl.eventCallback('onComplete', initHeroParallax);
  } else {
    initHeroParallax();
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function startBootstrap(): void {
  if (document.fonts?.ready) {
    document.fonts.ready.then(bootstrap);
  } else {
    bootstrap();
  }
}

if (document.readyState === 'complete') {
  startBootstrap();
} else {
  window.addEventListener('load', startBootstrap, { once: true });
}
