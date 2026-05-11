import type { Project } from '@/types/domain';

export interface FilterOption {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

export interface ProjectsFilterInstance {
  readonly element: HTMLElement;
  select(id: string): void;
}

interface Options {
  readonly projects: readonly Project[];
  readonly initialId?: string;
  readonly labelMap?: Readonly<Record<string, string>>;
  readonly onChange: (id: string, filtered: readonly Project[]) => void;
}

export function filterProjects(projects: readonly Project[], id: string): readonly Project[] {
  if (id === 'all') return projects;
  return projects.filter((p) => p.categoria === id);
}

function buildOptions(projects: readonly Project[]): readonly FilterOption[] {
  const counts = new Map<string, number>();
  for (const p of projects) counts.set(p.categoria, (counts.get(p.categoria) ?? 0) + 1);

  const opts: FilterOption[] = [
    { id: 'all', label: 'Todos', count: projects.length },
  ];
  // Preserve insertion order (= declaration order in projects.json).
  for (const [categoria, count] of counts) {
    opts.push({ id: categoria, label: categoria, count });
  }
  return opts;
}

export function createProjectsFilter(opts: Options): ProjectsFilterInstance {
  const { projects, initialId = 'all', labelMap, onChange } = opts;
  const options = buildOptions(projects).map((o) => ({
    ...o,
    label: labelMap?.[o.id] ?? o.label,
  }));

  const root = document.createElement('div');
  root.className = 'projects-filter';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Filtrar projetos por categoria');

  let activeId = initialId;

  options.forEach((opt) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'projects-filter__chip';
    chip.dataset['id'] = opt.id;
    chip.setAttribute('aria-pressed', String(opt.id === activeId));
    chip.innerHTML = `${opt.label} <span class="projects-filter__count">${opt.count}</span>`;
    root.appendChild(chip);
  });

  function select(id: string): void {
    if (id === activeId) return;
    activeId = id;
    root.querySelectorAll<HTMLButtonElement>('.projects-filter__chip').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.dataset['id'] === activeId));
    });
    onChange(activeId, filterProjects(projects, activeId));
  }

  root.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('.projects-filter__chip');
    if (!target?.dataset['id']) return;
    select(target.dataset['id']);
  });

  return { element: root, select };
}
