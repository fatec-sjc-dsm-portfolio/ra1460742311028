import { gsap } from '@/utils/gsapRegister';
import type { Experience } from '@/types/domain';
import { slugify } from '@/utils/router';

const MAX_STACK_CHIPS = 5;

interface Options {
  onOpen?: (slug: string) => void;
}

function renderPeriod(exp: Experience): string {
  const end = exp.fim ?? '<strong>Atual</strong>';
  return `${exp.inicio} <span aria-hidden="true">→</span> ${end}`;
}

function plainSummary(exp: Experience): string {
  return exp.descricao.replace(/<[^>]+>/g, '');
}

function renderCard(exp: Experience): string {
  const slug = slugify(exp.empresa);
  const stack = exp.tecnologias?.slice(0, MAX_STACK_CHIPS) ?? [];
  return `
    <div class="experience-card"
         role="button"
         tabindex="0"
         data-experience-slug="${slug}"
         aria-label="Ver entregas em ${exp.empresa}">
      <header class="experience-card__head">
        <span class="experience-card__period">${renderPeriod(exp)}</span>
        ${exp.modelo ? `<span class="experience-card__model">${exp.modelo}</span>` : ''}
      </header>

      <div class="experience-card__body">
        <h3 class="experience-card__role">${exp.cargo}</h3>
        <p class="experience-card__company">@ ${exp.empresa}</p>
        <p class="experience-card__local">${exp.local}</p>
        <p class="experience-card__summary">${plainSummary(exp)}</p>
      </div>

      ${stack.length ? `<ul class="experience-card__stack">${stack.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}

      <p class="experience-card__hint">
        Ver entregas
        <span aria-hidden="true">→</span>
      </p>
    </div>
  `;
}

export function renderExperienceList(
  root: HTMLElement,
  items: readonly Experience[],
  opts: Options = {},
): void {
  if (!items.length) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = items.map(renderCard).join('');

  root.querySelectorAll<HTMLElement>('.experience-card').forEach((el) => {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    el.addEventListener('pointerenter', () => {
      gsap.to(el, { y: -6, duration: 0.4, overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { y: 0, duration: 0.6, overwrite: 'auto' });
    });

    const open = (): void => {
      const slug = el.dataset['experienceSlug'];
      if (slug) opts.onOpen?.(slug);
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}
