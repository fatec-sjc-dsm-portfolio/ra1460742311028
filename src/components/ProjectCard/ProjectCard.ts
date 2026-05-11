import { gsap } from '@/utils/gsapRegister';
import type { Project } from '@/types/domain';

const MAX_STACK_CHIPS = 4;

function resolveHref(project: Project): { href: string; label: string } | null {
  const repo = project.repositorio?.trim();
  if (repo && repo.toLowerCase() !== 'private') {
    return { href: repo, label: 'Ver repositório' };
  }
  if (project.demoUrl) {
    return { href: project.demoUrl, label: 'Ver plataforma' };
  }
  return null;
}

function pickBadge(project: Project): string | null {
  const cat = project.categoria;
  if (/founder/i.test(cat))                            return 'Founder';
  if (/acad[êe]mico|institucional|fatec/i.test(cat))   return 'FATEC · API';
  return null;
}

interface CardOptions {
  onOpen?: (project: Project) => void;
}

export function createProjectCard(project: Project, index: number, opts: CardOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'project-card';
  el.dataset['projectIndex'] = String(index);
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `Ver detalhes do projeto ${project.nome}`);

  const indexLabel = String(index + 1).padStart(2, '0');
  const badgeLabel = pickBadge(project);
  const badge = badgeLabel
    ? `<span class="project-card__badge">${badgeLabel}</span>`
    : '';

  const stackKeys = Object.keys(project.tecnologias).slice(0, MAX_STACK_CHIPS);
  const stackHTML = stackKeys.map((s) => `<li>${s}</li>`).join('');

  const cta = resolveHref(project);
  const ctaHTML = cta
    ? `<a class="project-card__cta" href="${cta.href}" target="_blank" rel="noopener">
         ${cta.label} <span aria-hidden="true">→</span>
       </a>`
    : '';

  el.innerHTML = `
    <header class="project-card__head">
      <span class="project-card__index">${indexLabel}</span>
      ${badge}
    </header>

    <div class="project-card__body">
      <p class="project-card__role mono">${project.categoria}</p>
      <h3 class="project-card__title">${project.nome}</h3>
      <p class="project-card__desc">${project.descricao}</p>
    </div>

    <ul class="project-card__stack">${stackHTML}</ul>

    ${ctaHTML}

    <p class="project-card__hint">Clique para ver detalhes</p>
  `;

  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.project-card__cta')) return;
    opts.onOpen?.(project);
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      opts.onOpen?.(project);
    }
  });

  const hasHover = window.matchMedia?.('(hover: hover)').matches ?? false;
  if (hasHover) {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });

    el.addEventListener('pointerenter', () => {
      gsap.to(el, { y: -8, duration: 0.4, overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { y: 0, duration: 0.6, overwrite: 'auto' });
    });
  }

  return el;
}
