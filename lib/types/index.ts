/**
 * TypeScript types for Câmara API responses
 * Based on the official API documentation at https://dadosabertos.camara.leg.br/api/v2
 */

// Deputy types
export interface Deputy {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email?: string;
}

export interface DeputyDetails extends Deputy {
  nomeCivil: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  dataFalecimento?: string;
  ufNascimento: string;
  municipioNascimento: string;
  escolaridade: string;
  ultimoStatus: DeputyStatus;
}

export interface DeputyStatus {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  data: string;
  nomeEleitoral: string;
  gabinete: {
    nome: string;
    predio: string;
    sala: string;
    andar: string;
    telefone: string;
    email: string;
  };
  situacao: string;
  condicaoEleitoral: string;
  descricaoStatus: string;
}

export interface DeputyExpense {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  codTipoDocumento: number;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
}

export interface DeputySpeech {
  dataHoraInicio: string;
  dataHoraFim: string;
  urlTexto: string;
  transcricao: string;
  keywords: string;
  sumario: string;
  uriEvento?: string;
  faseEvento?: {
    titulo: string;
    dataHoraInicio: string;
    dataHoraFim: string;
  };
}

// Proposition types
export interface Proposition {
  id: number;
  uri: string;
  siglaTipo: string;
  codTipo: number;
  numero: number;
  ano: number;
  ementa: string;
}

export interface PropositionDetails extends Proposition {
  dataApresentacao: string;
  uriOrgaoNumerador: string;
  statusProposicao: PropositionStatus;
  uriAutores: string;
  descricaoTipo: string;
  ementaDetalhada: string;
  keywords: string;
  uriPropPrincipal?: string;
  uriPropAnterior?: string;
  uriPropPosterior?: string;
  urlInteiroTeor: string;
  urnFinal?: string;
  texto?: string;
  justificativa?: string;
}

export interface PropositionStatus {
  dataHora: string;
  sequencia: number;
  siglaOrgao: string;
  uriOrgao: string;
  uriUltimoRelator?: string;
  regime: string;
  descricaoTramitacao: string;
  codTipoTramitacao: string;
  descricaoSituacao: string;
  codSituacao: number;
  despacho?: string;
  url?: string;
  ambito: string;
}

// Voting types
export interface Voting {
  id: string;
  uri: string;
  data: string;
  dataHoraRegistro: string;
  siglaOrgao: string;
  uriOrgao: string;
  uriEvento?: string;
  proposicaoObjeto: string;
  uriProposicaoObjeto: string;
  descricao: string;
  aprovacao: number;
}

export interface VotingDetails extends Voting {
  ultimaAberturaVotacao: {
    dataHoraInicio: string;
    dataHoraFim: string;
    descricao: string;
  };
  votosSim: number;
  votosNao: number;
  votosOutros: number;
}

// Event types
export interface Event {
  id: number;
  uri: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
  situacao: string;
  descricaoTipo: string;
  descricao: string;
  localExterno?: string;
  orgaos: Array<{
    id: number;
    uri: string;
    sigla: string;
    nome: string;
    apelido: string;
  }>;
}

// Committee types
export interface Committee {
  id: number;
  uri: string;
  sigla: string;
  nome: string;
  apelido: string;
  codTipoOrgao: number;
  tipoOrgao: string;
  nomePublicacao: string;
}

// Party types
export interface Party {
  id: number;
  sigla: string;
  nome: string;
  uri: string;
}

// Pagination types
export interface PaginationLink {
  rel: 'self' | 'first' | 'last' | 'next' | 'previous';
  href: string;
}

export interface PaginatedResponse<T> {
  dados: T[];
  links: PaginationLink[];
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  links?: PaginationLink[];
  status: number;
  headers: Record<string, string>;
}
