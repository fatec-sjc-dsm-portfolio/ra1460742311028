import { gsap, ScrollTrigger } from '@/utils/gsapRegister';
import type Lenis from 'lenis';
import type { Project, ProjectImage } from '@/types/domain';
import { back as routerBack } from '@/utils/router';
import { asset } from '@/utils/asset';

function resolveImgSrc(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return asset(src);
  return src;
}

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

export function initProjectDetail(lenis: Lenis | null): void {
  lenisRef = lenis;
  homeMain   = document.querySelector<HTMLElement>('#home-page');
  siteHeader = document.querySelector<HTMLElement>('[data-site-header]');
  mountEl    = document.querySelector<HTMLElement>('#project-detail-page');

  if (mountEl) {
    mountEl.innerHTML = buildSkeleton();
    mountEl.querySelector<HTMLButtonElement>('.project-detail__back')!
      .addEventListener('click', () => routerBack());
  }

  document.addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') routerBack();
  });
}

function buildSkeleton(): string {
  return `
    <nav class="project-detail__nav">
      <button type="button" class="project-detail__back" aria-label="Voltar para projetos">
        <span class="project-detail__back-arrow" aria-hidden="true">←</span>
        Voltar
      </button>
      <span class="project-detail__crumbs" data-crumbs></span>
    </nav>

    <div class="project-detail__container">
      <header class="project-detail__intro">
        <div class="project-detail__meta" data-reveal>
          <span class="project-detail__role" data-role></span>
          <span class="project-detail__badge" data-badge hidden></span>
        </div>
        <h1 id="project-detail-title" class="project-detail__title" data-title data-reveal></h1>
        <p class="project-detail__lede" data-lede data-reveal></p>
        <p class="project-detail__sub" data-sub data-reveal hidden></p>
      </header>

      <div data-gallery-mount></div>

      <div data-body></div>

      <footer class="project-detail__cta-row" data-footer></footer>
    </div>
  `;
}

function pickBadgeLabel(cat: string): string | null {
  if (/founder/i.test(cat))                          return 'Founder';
  if (/acad[êe]mico|institucional|fatec/i.test(cat)) return 'FATEC · API';
  return null;
}

function renderSection(eyebrow: string, contentHtml: string): string {
  if (!contentHtml.trim()) return '';
  return `
    <section class="project-detail__section" data-reveal>
      <p class="project-detail__section-eyebrow">// ${eyebrow}</p>
      ${contentHtml}
    </section>
  `;
}

function renderProse(text: string | undefined): string {
  if (!text) return '';
  return `<p class="project-detail__section-prose">${text}</p>`;
}

function renderTechGrid(record: Readonly<Record<string, string>> | undefined): string {
  if (!record) return '';
  return `
    <div class="project-detail__tech-grid">
      ${Object.entries(record).map(([k, v]) => `
        <dl class="project-detail__tech-card">
          <dt>${k}</dt>
          <dd>${v}</dd>
        </dl>
      `).join('')}
    </div>
  `;
}

function renderFooter(project: Project): string {
  const buttons: string[] = [];
  const repo = project.repositorio?.trim();
  if (repo && repo.toLowerCase() !== 'private') {
    buttons.push(`<a class="btn btn--ghost" href="${repo}" target="_blank" rel="noopener">Ver repositório →</a>`);
  }
  if (project.demoUrl) {
    buttons.push(`<a class="btn btn--primary" href="${project.demoUrl}" target="_blank" rel="noopener">Ver plataforma →</a>`);
  }
  return buttons.join('');
}

function buildHeroGallery(images: readonly ProjectImage[]): HTMLElement | null {
  if (!images.length) return null;

  const root = document.createElement('section');
  root.className = 'project-detail__gallery';
  root.setAttribute('aria-label', 'Galeria de imagens do projeto');
  root.setAttribute('data-reveal', '');

  const frame = document.createElement('div');
  frame.className = 'project-detail__gallery-frame';

  images.forEach((img, i) => {
    const slide = document.createElement('figure');
    slide.className = 'project-detail__gallery-slide' + (i === 0 ? ' is-active' : '');
    slide.innerHTML = `
      <img src="${resolveImgSrc(img.src)}" alt="${img.alt}"
           loading="${i === 0 ? 'eager' : 'lazy'}"
           decoding="async"
           ${i === 0 ? 'fetchpriority="high"' : ''} />
      ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
    `;
    frame.appendChild(slide);
  });
  root.appendChild(frame);

  if (images.length < 2) return root;

  // Arrows inside the frame
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'project-detail__gallery-arrow project-detail__gallery-arrow--prev';
  prevBtn.setAttribute('aria-label', 'Imagem anterior');
  prevBtn.textContent = '←';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'project-detail__gallery-arrow project-detail__gallery-arrow--next';
  nextBtn.setAttribute('aria-label', 'Próxima imagem');
  nextBtn.textContent = '→';

  frame.append(prevBtn, nextBtn);

  // Controls row
  const controls = document.createElement('div');
  controls.className = 'project-detail__gallery-controls';

  const dotsEl = document.createElement('div');
  dotsEl.className = 'project-detail__gallery-dots';
  dotsEl.setAttribute('role', 'tablist');

  const counterEl = document.createElement('p');
  counterEl.className = 'project-detail__gallery-counter';

  images.forEach((img, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'project-detail__gallery-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Mostrar ${img.caption ?? `imagem ${i + 1}`}`);
    dot.dataset['index'] = String(i);
    dotsEl.appendChild(dot);
  });

  controls.append(dotsEl, counterEl);
  root.appendChild(controls);

  // Wire navigation
  const slides = frame.querySelectorAll<HTMLElement>('.project-detail__gallery-slide');
  let idx = 0;

  function go(n: number): void {
    idx = ((n % images.length) + images.length) % images.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    dotsEl.querySelectorAll<HTMLButtonElement>('.project-detail__gallery-dot').forEach((d, i) => {
      d.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });
    const total = String(images.length).padStart(2, '0');
    const cur   = String(idx + 1).padStart(2, '0');
    counterEl.innerHTML = `<strong>${cur}</strong> / ${total}`;
  }

  prevBtn.addEventListener('click', () => go(idx - 1));
  nextBtn.addEventListener('click', () => go(idx + 1));
  dotsEl.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>('.project-detail__gallery-dot');
    if (!t?.dataset['index']) return;
    go(Number(t.dataset['index']));
  });

  go(0);
  return root;
}

function runReveals(): void {
  if (!mountEl) return;

  const introTargets = mountEl.querySelectorAll<HTMLElement>('.project-detail__intro [data-reveal]');
  if (introTargets.length) {
    gsap.set(introTargets, { clearProps: 'all' });
    gsap.from(introTargets, {
      autoAlpha: 0,
      y: 24,
      stagger: 0.08,
      duration: 0.9,
      ease: 'expo.out',
      clearProps: 'all',
    });
  }

  const gallery = mountEl.querySelector<HTMLElement>('.project-detail__gallery');
  if (gallery) {
    gsap.set(gallery, { clearProps: 'all' });
    gsap.from(gallery, {
      autoAlpha: 0,
      y: 30,
      duration: 1.0,
      ease: 'expo.out',
      delay: 0.1,
      clearProps: 'all',
    });
  }

  // Sections — scroll-linked reveals (matches home pattern).
  const sectionEls = mountEl.querySelectorAll<HTMLElement>('.project-detail__section[data-reveal]');
  sectionEls.forEach((el) => {
    gsap.set(el, { clearProps: 'all' });
    const tween = gsap.from(el, {
      autoAlpha: 0,
      y: 30,
      duration: 0.9,
      ease: 'power3.out',
      clearProps: 'all',
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
    gsap.killTweensOf(mountEl.querySelectorAll('[data-reveal]'));
    gsap.killTweensOf(mountEl.querySelectorAll('.project-detail__section'));
    gsap.set(mountEl.querySelectorAll('[data-reveal], .project-detail__section'),
      { clearProps: 'all' });
  }
  detailTriggers.forEach((t) => t.kill());
  detailTriggers = [];
}

export function openProjectDetail(project: Project): void {
  if (!mountEl) return;

  // Populate
  mountEl.querySelector<HTMLElement>('[data-role]')!.textContent  = project.categoria;
  mountEl.querySelector<HTMLElement>('[data-title]')!.textContent = project.nome;
  mountEl.querySelector<HTMLElement>('[data-lede]')!.textContent  = project.descricao;
  mountEl.querySelector<HTMLElement>('[data-crumbs]')!.textContent = `Projetos · ${project.nome}`;

  const badgeEl = mountEl.querySelector<HTMLElement>('[data-badge]')!;
  const badge = pickBadgeLabel(project.categoria);
  if (badge) { badgeEl.textContent = badge; badgeEl.hidden = false; }
  else       { badgeEl.hidden = true; }

  const subEl = mountEl.querySelector<HTMLElement>('[data-sub]')!;
  const subBits: string[] = [];
  if (project.semestre)            subBits.push(project.semestre);
  if (project.professor_parceiro)  subBits.push(project.professor_parceiro);
  if (subBits.length) {
    subEl.textContent = subBits.join(' · ');
    subEl.hidden = false;
  } else {
    subEl.hidden = true;
  }

  // Hero gallery
  const galleryMount = mountEl.querySelector<HTMLElement>('[data-gallery-mount]')!;
  galleryMount.innerHTML = '';
  const gallery = buildHeroGallery(project.imagens ?? []);
  if (gallery) galleryMount.appendChild(gallery);

  // Body sections
  const body = mountEl.querySelector<HTMLElement>('[data-body]')!;
  body.innerHTML = [
    renderSection('problema',     renderProse(project.problema)),
    renderSection('solução',      renderProse(project.solucao)),
    renderSection('desafios',     renderProse(project.desafios)),
    renderSection('tecnologias',  renderTechGrid(project.tecnologias)),
    renderSection('contribuições',renderProse(project.contribuicoes_pessoais)),
    renderSection('hard skills',  renderTechGrid(project.hard_skills)),
  ].join('');

  mountEl.querySelector<HTMLElement>('[data-footer]')!.innerHTML = renderFooter(project);

  if (isOpen) {
    killReveals();
    scrollToY(0);
    ScrollTrigger.refresh();
    runReveals();
    return;
  }

  // First open — swap visible layer.
  isOpen = true;
  lastFocused = document.activeElement as HTMLElement | null;
  savedScrollY = window.scrollY;

  if (homeMain)   homeMain.hidden = true;
  if (siteHeader) siteHeader.style.display = 'none';
  mountEl.hidden = false;

  // Scroll to top + recompute trigger positions for the new layout.
  scrollToY(0);
  ScrollTrigger.refresh();
  runReveals();

  mountEl.querySelector<HTMLButtonElement>('.project-detail__back')!.focus();
}

export function closeProjectDetail(): void {
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
