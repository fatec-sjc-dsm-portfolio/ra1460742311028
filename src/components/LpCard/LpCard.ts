import { asset } from '@/utils/asset';
import type { LpItem } from '@/types/lp';

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

export function createLpCard(lp: LpItem, index: number): HTMLElement {
  const el = document.createElement('a');
  el.className = 'lp-card';
  el.href = lp.url;
  el.target = '_blank';
  el.rel = 'noopener';
  el.setAttribute('aria-label', `Abrir LP de ${lp.nome} em nova aba`);
  el.style.setProperty('--lp-accent', lp.cor ?? 'var(--accent)');
  el.dataset['index'] = String(index);

  const indexLabel = String(index + 1).padStart(2, '0');

  el.innerHTML = `
    <div class="lp-card__preview">
      <div class="lp-card__browser" aria-hidden="true">
        <span class="lp-card__dot"></span>
        <span class="lp-card__dot"></span>
        <span class="lp-card__dot"></span>
        <span class="lp-card__url">${escapeHtml(new URL(lp.url).host)}</span>
      </div>
      <div class="lp-card__shot-wrap">
        <img
          class="lp-card__shot"
          src="${escapeHtml(resolveImg(lp.thumbnail))}"
          alt="Pré-visualização da LP ${escapeHtml(lp.nome)}"
          loading="lazy"
          decoding="async"
        />
      </div>
      <span class="lp-card__open" aria-hidden="true">
        Abrir <span class="lp-card__open-arrow">↗</span>
      </span>
    </div>

    <div class="lp-card__body">
      <header class="lp-card__head">
        <span class="lp-card__index">${indexLabel}</span>
        <span class="lp-card__badge">${escapeHtml(lp.segmento)}</span>
      </header>

      <h3 class="lp-card__title">${escapeHtml(lp.nome)}</h3>
      <p class="lp-card__client">${escapeHtml(lp.cliente)}${lp.ano ? ` · ${escapeHtml(lp.ano)}` : ''}</p>
      <p class="lp-card__desc">${escapeHtml(lp.descricao)}</p>
    </div>
  `;

  return el;
}
