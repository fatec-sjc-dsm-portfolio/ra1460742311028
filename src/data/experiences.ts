import raw from './experiences.json';
import type { Experience } from '@/types/domain';

export const experiences: readonly Experience[] = raw as unknown as readonly Experience[];
