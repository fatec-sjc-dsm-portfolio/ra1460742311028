import { gsap, ScrollTrigger } from '@/utils/gsapRegister';
import type Lenis from 'lenis';
import type { Experience } from '@/types/domain';
import { back as routerBack } from '@/utils/router';

let mountEl: HTMLElement | null = null;
let homeMain: HTMLElement | null = null;
let siteHeader: HTMLElement | null = null;
let lenisRef: Lenis | null = null;

function scrollToY(y: number): void {
  if (lenisRef) lenisRef.scrollTo(y, { immediate: true });
  else          window.scrollTo({ top: y, behavior: 'auto' });
}
let isOpen = false;
let lastFocused: HTMLElement | null = null;
let savedScrollY = 0;
let detailTriggers: ScrollTrigger[] = [];

export function initExperienceDetail(lenis: Lenis | null): void {
  lenisRef = lenis;
  homeMain   = document.querySelector<HTMLElement>('#home-page');
  siteHeader = document.querySelector<HTMLElement>('[data-site-header]');
  mountEl    = document.querySelector<HTMLElement>('#experience-detail-page');

  if (mountEl) {
    mountEl.innerHTML = buildSkeleton();
    mountEl.querySelector<HTMLButtonElement>('.experience-detail__back')!
      .addEventListener('click', () => routerBack());
  }

  document.addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') routerBack();
  });
}

function buildSkeleton(): string {
  return `
    <nav class="experience-detail__nav">
      <button type="button" class="experience-detail__back" aria-label="Voltar">
        <span aria-hidden="true">←</span>
        Voltar
      </button>
      <span class="experience-detail__crumbs" data-crumbs></span>
    </nav>

    <div class="experience-detail__container">
      <header class="experience-detail__intro">
        <div class="experience-detail__meta" data-reveal>
          <span class="experience-detail__period" data-period></span>
          <span class="experience-detail__model" data-model hidden></span>
          <span class="experience-detail__local" data-local></span>
        </div>
        <h1 class="experience-detail__role" data-role data-reveal></h1>
        <p class="experience-detail__company" data-company data-reveal></p>
      </header>

      <div data-body></div>
    </div>
  `;
}

function renderSection(eyebrow: string, contentHtml: string): string {
  if (!contentHtml.trim()) return '';
  return `
    <section class="experience-detail__section" data-reveal>
      <p class="experience-detail__section-eyebrow">// ${eyebrow}</p>
      ${contentHtml}
    </section>
  `;
}

function renderDeliverables(items: readonly string[] | undefined): string {
  if (!items?.length) return '';
  return `
    <ul class="experience-detail__deliverables">
      ${items.map((it) => `<li>${it}</li>`).join('')}
    </ul>
  `;
}

function renderTech(items: readonly string[] | undefined): string {
  if (!items?.length) return '';
  return `
    <ul class="experience-detail__tech">
      ${items.map((t) => `<li>${t}</li>`).join('')}
    </ul>
  `;
}

function renderCompanyLine(exp: Experience): string {
  const company = exp.url
    ? `<a href="${exp.url}" target="_blank" rel="noopener">${exp.empresa} ↗</a>`
    : exp.empresa;
  return `@ ${company}`;
}

function runReveals(): void {
  if (!mountEl) return;

  const intro = mountEl.querySelectorAll<HTMLElement>('.experience-detail__intro [data-reveal]');
  if (intro.length) {
    gsap.set(intro, { clearProps: 'all' });
    gsap.from(intro, {
      autoAlpha: 0, y: 24, stagger: 0.08,
      duration: 0.9, ease: 'expo.out', clearProps: 'all',
    });
  }

  mountEl.querySelectorAll<HTMLElement>('.experience-detail__section[data-reveal]').forEach((el) => {
    gsap.set(el, { clearProps: 'all' });
    const tween = gsap.from(el, {
      autoAlpha: 0, y: 30,
      duration: 0.9, ease: 'power3.out', clearProps: 'all',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    });
    if (tween.scrollTrigger) detailTriggers.push(tween.scrollTrigger);
  });
}

function killReveals(): void {
  if (mountEl) {
    gsap.killTweensOf(mountEl.querySelectorAll('[data-reveal], .experience-detail__section'));
    gsap.set(mountEl.querySelectorAll('[data-reveal], .experience-detail__section'),
      { clearProps: 'all' });
  }
  detailTriggers.forEach((t) => t.kill());
  detailTriggers = [];
}

export function openExperienceDetail(exp: Experience): void {
  if (!mountEl) return;

  mountEl.querySelector<HTMLElement>('[data-period]')!.innerHTML =
    `${exp.inicio} <span aria-hidden="true">→</span> ${exp.fim ?? '<strong>Atual</strong>'}`;

  const modelEl = mountEl.querySelector<HTMLElement>('[data-model]')!;
  if (exp.modelo) { modelEl.textContent = exp.modelo; modelEl.hidden = false; }
  else            { modelEl.hidden = true; }

  mountEl.querySelector<HTMLElement>('[data-local]')!.textContent = exp.local;
  mountEl.querySelector<HTMLElement>('[data-role]')!.textContent  = exp.cargo;
  mountEl.querySelector<HTMLElement>('[data-company]')!.innerHTML = renderCompanyLine(exp);
  mountEl.querySelector<HTMLElement>('[data-crumbs]')!.textContent = `Experiência · ${exp.empresa}`;

  const body = mountEl.querySelector<HTMLElement>('[data-body]')!;
  body.innerHTML = [
    renderSection('sobre',       `<p class="experience-detail__prose">${exp.descricao}</p>`),
    renderSection('entregas',    renderDeliverables(exp.conquistas)),
    renderSection('tecnologias', renderTech(exp.tecnologias)),
  ].join('');

  if (isOpen) {
    killReveals();
    scrollToY(0);
    ScrollTrigger.refresh();
    runReveals();
    return;
  }

  isOpen = true;
  lastFocused = document.activeElement as HTMLElement | null;
  savedScrollY = window.scrollY;

  if (homeMain)   homeMain.hidden = true;
  if (siteHeader) siteHeader.style.display = 'none';
  mountEl.hidden = false;

  scrollToY(0);
  ScrollTrigger.refresh();
  runReveals();

  mountEl.querySelector<HTMLButtonElement>('.experience-detail__back')!.focus();
}

export function closeExperienceDetail(): void {
  if (!isOpen || !mountEl) return;
  isOpen = false;

  killReveals();

  mountEl.hidden = true;
  if (homeMain)   homeMain.hidden = false;
  if (siteHeader) siteHeader.style.display = '';

  ScrollTrigger.refresh();
  scrollToY(savedScrollY);

  lastFocused?.focus();
}
