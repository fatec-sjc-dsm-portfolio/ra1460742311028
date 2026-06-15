import raw from './lps.json';
import type { LpFile, LpItem } from '@/types/lp';

const file = raw as unknown as LpFile;

export const lps: readonly LpItem[] = file.lps;
