export interface LpItem {
  readonly nome: string;
  readonly url: string;
  readonly cliente: string;
  readonly segmento: string;
  readonly descricao: string;
  readonly thumbnail: string;
  readonly cor?: string;
  readonly ano?: string;
}

export interface LpFile {
  readonly lps: readonly LpItem[];
}
