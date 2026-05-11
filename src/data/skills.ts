import type { SkillGroup } from '@/types/domain';

export const skillGroups: readonly SkillGroup[] = [
  {
    label: 'Frontend',
    items: [
      { name: 'React',      icon: 'react' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Vite',       icon: 'vite' },
      { name: 'GSAP',       icon: 'greensock' },
      { name: 'Tailwind',   icon: 'tailwindcss' },
    ],
  },
  {
    label: 'Backend',
    items: [
      { name: 'Node.js',    icon: 'nodedotjs' },
      { name: 'Express',    icon: 'express' },
      { name: 'Python',     icon: 'python' },
      { name: 'Flask',      icon: 'flask' },
      { name: 'MongoDB',    icon: 'mongodb' },
      { name: 'PostgreSQL', icon: 'postgresql' },
    ],
  },
  {
    label: 'DevOps',
    items: [
      { name: 'Docker',         icon: 'docker' },
      { name: 'AWS',            icon: '/icons/aws.svg' },
      { name: 'Linux',          icon: 'linux' },
      { name: 'Firebase',       icon: 'firebase' },
      { name: 'Stripe',         icon: 'stripe' },
      { name: 'Git',            icon: 'git' },
      { name: 'GitHub Actions', icon: 'githubactions' },
    ],
  },
];
