export interface RootAlocacao {
  ControleAlocacao: ControleAlocacao;
}

export interface ControleAlocacao {
  CalendarioEvento: CalendarioEvento[];
}

export interface CalendarioEvento {
  data: string[];
  tipoaula: string[];
  horainicio: string[];
  horatermino: string[];
  turma: string[];
  titulo: string[];
  professor: string[];
  sala: string[];
  andar: string[];
  predio: string[];
  corpredio?: string[];
  datageracao: string[];
  horageracao: string[];
  cancelada: string[];
  familia_curso: string[];
  subgrupo?: string[];
}

export type SalasResponse = SalaLivre[];

export interface SalaLivre {
  nome: string;
  predio: string;
  andar: string;
  nextEvent: any;
  freeUntil: string;
  todayEventCount: number;
  forStudies: boolean;
  forStudiesUntil?: string;
}
