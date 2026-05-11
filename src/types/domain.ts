export interface Project {
  readonly categoria: string;
  readonly nome: string;
  readonly descricao: string;
  readonly tecnologias: Readonly<Record<string, string>>;
  readonly repositorio: string;
  readonly semestre?: string;
  readonly professor_parceiro?: string;
  readonly problema?: string;
  readonly solucao?: string;
  readonly desafios?: string;
  readonly demoUrl?: string;
  readonly contribuicoes_pessoais?: string;
  readonly hard_skills?: Readonly<Record<string, string>>;
  readonly imagens?: readonly ProjectImage[];
}

export interface ProjectImage {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
}

export interface ProjectsFile {
  readonly projetos: readonly Project[];
}

export type CertificateType =
  | 'degree'
  | 'document'
  | 'course'
  | 'certification'
  | 'achievement';

export interface Certificate {
  readonly id: number;
  readonly title: string;
  readonly institution: string;
  readonly date: string;
  readonly type: CertificateType;
  readonly description: string;
  readonly skills?: readonly string[];
  readonly certificateUrl?: string;
  readonly documentUrl?: string;
  readonly hours?: number;
  readonly status?: string;
  readonly level?: string;
}

export type ExperienceModel =
  | 'CLT'
  | 'PJ'
  | 'Estágio'
  | 'Trainee'
  | 'Freelance'
  | 'Founder';

export interface Experience {
  readonly empresa: string;
  readonly cargo: string;
  readonly inicio: string;
  readonly fim: string | null;
  readonly local: string;
  readonly modelo?: ExperienceModel;
  readonly descricao: string;
  readonly conquistas?: readonly string[];
  readonly tecnologias?: readonly string[];
  readonly url?: string;
  readonly logo?: string;
}

export interface SkillItem {
  readonly name: string;
  readonly icon: string;
}

export interface SkillGroup {
  readonly label: 'Frontend' | 'Backend' | 'DevOps';
  readonly items: readonly SkillItem[];
}
