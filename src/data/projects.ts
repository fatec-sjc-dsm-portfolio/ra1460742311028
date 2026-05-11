import raw from './projects.json';
import type { Project, ProjectsFile } from '@/types/domain';

const file = raw as unknown as ProjectsFile;

export const projects: readonly Project[] = file.projetos;
