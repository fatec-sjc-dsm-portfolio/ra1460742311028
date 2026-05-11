import type { Certificate, CertificateType } from '@/types/domain';
import { asset } from '@/utils/asset';

const TYPE_LABEL: Readonly<Record<CertificateType, string>> = {
  degree:        'Graduação',
  document:      'Documento',
  course:        'Curso',
  certification: 'Certificação',
  achievement:   'Conquista',
};

function resolveUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return asset(raw);
  return raw;
}

function resolveHref(c: Certificate): string | null {
  if (c.documentUrl    && c.documentUrl.trim()    !== '') return resolveUrl(c.documentUrl);
  if (c.certificateUrl && c.certificateUrl.trim() !== '') return resolveUrl(c.certificateUrl);
  return null;
}

function renderMeta(c: Certificate): string {
  const bits: string[] = [];
  if (c.hours)  bits.push(`${c.hours}h`);
  if (c.level)  bits.push(c.level);
  if (c.status) bits.push(c.status);
  return bits.length ? `<span class="cert-card__meta">${bits.join(' · ')}</span>` : '';
}

function renderSkills(c: Certificate): string {
  if (!c.skills?.length) return '';
  const visible = c.skills.slice(0, 4);
  const overflow = c.skills.length - visible.length;
  const chips = visible.map((s) => `<li>${s}</li>`).join('');
  const more  = overflow > 0 ? `<li>+${overflow}</li>` : '';
  return `<ul class="cert-card__skills">${chips}${more}</ul>`;
}

export function renderCertificates(root: HTMLElement, items: readonly Certificate[]): void {
  root.innerHTML = items.map((c) => {
    const href = resolveHref(c);
    const Tag  = href ? 'a' : 'div';
    const attrs = href
      ? `href="${href}" target="_blank" rel="noopener"`
      : '';

    return `
      <${Tag} class="cert-card" ${attrs}>
        <header class="cert-card__head">
          <span class="eyebrow">${c.date}</span>
          <span class="cert-card__type">${TYPE_LABEL[c.type]}</span>
        </header>
        <h3>${c.title}</h3>
        <p class="cert-card__institution">${c.institution}</p>
        ${renderMeta(c)}
        ${renderSkills(c)}
      </${Tag}>
    `;
  }).join('');
}
