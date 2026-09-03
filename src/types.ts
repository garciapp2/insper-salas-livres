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

export interface SalasResponse {
  /** false quando a agenda do Insper ainda não publicou o dia de hoje */
  atual: boolean;
  /** dia que a agenda está publicando, no formato dd/MM/yyyy */
  dataAgenda: string | null;
  /** dia de hoje em São Paulo, para comparar com dataAgenda */
  hoje: string;
  salas: SalaLivre[];
}

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
