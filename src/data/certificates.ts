import raw from './certificates.json';
import type { Certificate } from '@/types/domain';

export const certificates: readonly Certificate[] = raw as unknown as readonly Certificate[];
