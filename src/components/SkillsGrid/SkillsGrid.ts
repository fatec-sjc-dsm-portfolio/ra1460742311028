import type { SkillGroup } from '@/types/domain';

const SIMPLEICONS_CDN = 'https://cdn.simpleicons.org';

function resolveIconUrl(icon: string): string {
  if (/^https?:\/\//.test(icon)) return icon;
  if (icon.startsWith('/'))      return icon;
  return `${SIMPLEICONS_CDN}/${icon}`;
}

export function renderSkillsGrid(root: HTMLElement, groups: readonly SkillGroup[]): void {
  root.innerHTML = groups.map((g) => `
    <div class="skill-row">
      <h3>${g.label}</h3>
      <ul>
        ${g.items.map((s) => `
          <li>
            <span class="skill-row__name">
              <img class="skill-row__icon"
                   src="${resolveIconUrl(s.icon)}"
                   alt=""
                   loading="lazy"
                   decoding="async"
                   width="20" height="20" />
              ${s.name}
            </span>
            <span class="skill-row__bullet" aria-hidden="true"></span>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}
