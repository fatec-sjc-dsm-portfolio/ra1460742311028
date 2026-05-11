import '@/utils/gsapRegister';

import { initSmoothScroll }     from '@/utils/lenis';
import { initScrollStory }      from '@/animations/scroll';
import { createProjectCard }    from '@/components/ProjectCard/ProjectCard';
import { initProjectDetail, openProjectDetail, closeProjectDetail } from '@/components/ProjectDetail/ProjectDetail';
import { initExperienceDetail, openExperienceDetail, closeExperienceDetail } from '@/components/ExperienceDetail/ExperienceDetail';
import { createCarousel }       from '@/components/Carousel/Carousel';
import { navigate, onRouteChange, slugify } from '@/utils/router';
import type { CarouselInstance } from '@/components/Carousel/Carousel';
import { createProjectsFilter, filterProjects } from '@/components/ProjectsFilter/ProjectsFilter';
import { renderSkillsGrid }     from '@/components/SkillsGrid/SkillsGrid';
import { renderExperienceList } from '@/components/ExperienceList/ExperienceList';
import { renderCertificates }   from '@/components/CertificateCard/CertificateCard';
import { initHeader }           from '@/components/Header/Header';

import type { Project } from '@/types/domain';
import { projects }     from '@/data/projects';
import { skillGroups }  from '@/data/skills';
import { experiences }  from '@/data/experiences';
import { certificates } from '@/data/certificates';

function mountProjects(): void {
  const filterMount   = document.querySelector<HTMLElement>('#projects-filter-mount');
  const carouselMount = document.querySelector<HTMLElement>('#projects-mount');
  if (!filterMount || !carouselMount) return;

  let carousel: CarouselInstance | null = null;

  function renderCarousel(list: readonly Project[]): void {
    if (carousel) carousel.destroy();
    const slides = list.map((p, i) =>
      createProjectCard(p, i, { onOpen: (proj) => navigate(`/projects/${slugify(proj.nome)}`) }),
    );
    carousel = createCarousel({ slides });
    carouselMount!.appendChild(carousel.element);
  }

  const filter = createProjectsFilter({
    projects,
    initialId: 'all',
    labelMap: {
      all:                                              'Todos',
      'Projeto Profissional · Founder':                 'Projetos Profissionais',
      'Projeto Acadêmico / Parceria Institucional':     'Projetos Acadêmicos',
    },
    onChange: (_id, filtered) => renderCarousel(filtered),
  });

  filterMount.appendChild(filter.element);
  renderCarousel(filterProjects(projects, 'all'));
}

function mountSkills(): void {
  const root = document.querySelector<HTMLElement>('#skills-grid');
  if (root) renderSkillsGrid(root, skillGroups);
}

function mountExperience(): void {
  const root = document.querySelector<HTMLElement>('#experience-list');
  if (!root) return;
  renderExperienceList(root, experiences, {
    onOpen: (slug) => navigate(`/experience/${slug}`),
  });
}

function mountCertificates(): void {
  const root = document.querySelector<HTMLElement>('#certs-grid');
  if (root) renderCertificates(root, certificates);
}

function bootstrap(): void {
  mountProjects();
  mountSkills();
  mountExperience();
  mountCertificates();

  initHeader();
  const lenis = initSmoothScroll();
  initProjectDetail(lenis);
  initExperienceDetail(lenis);
  initScrollStory();

  onRouteChange((path) => {
    const projMatch = path.match(/^\/projects\/(.+)$/);
    const expMatch  = path.match(/^\/experience\/(.+)$/);

    if (projMatch) {
      closeExperienceDetail();
      const project = projects.find((p) => slugify(p.nome) === projMatch[1]);
      if (project) openProjectDetail(project);
      else         closeProjectDetail();
      return;
    }

    if (expMatch) {
      closeProjectDetail();
      const exp = experiences.find((e) => slugify(e.empresa) === expMatch[1]);
      if (exp) openExperienceDetail(exp);
      else     closeExperienceDetail();
      return;
    }

    closeProjectDetail();
    closeExperienceDetail();
  });
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
