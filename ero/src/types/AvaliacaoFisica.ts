export type ObjetivoAvaliacao =
  | 'EMAGRECIMENTO'
  | 'GANHO_MASSA_MUSCULAR'
  | 'DEFINICAO_MUSCULAR'
  | 'MANUTENCAO_PESO'
  | 'SAUDE_BEM_ESTAR'
  | 'REABILITACAO'
  | 'PERFORMANCE_ESPORTIVA'

export type PontoMedicao =
  | 'PESCOCO'
  | 'OMBRO'
  | 'TORAX'
  | 'CINTURA'
  | 'ABDOMEN'
  | 'QUADRIL'
  | 'BRACO_ESQUERDO'
  | 'BRACO_DIREITO'
  | 'ANTEBRACO_ESQUERDO'
  | 'ANTEBRACO_DIREITO'
  | 'COXA_ESQUERDA'
  | 'COXA_DIREITA'
  | 'PANTURRILHA_ESQUERDA'
  | 'PANTURRILHA_DIREITA'

export const OBJETIVO_LABELS: Record<ObjetivoAvaliacao, string> = {
  EMAGRECIMENTO:        'Emagrecimento',
  GANHO_MASSA_MUSCULAR: 'Ganho de Massa Muscular',
  DEFINICAO_MUSCULAR:   'Definição Muscular',
  MANUTENCAO_PESO:      'Manutenção do Peso',
  SAUDE_BEM_ESTAR:      'Saúde e Bem-Estar',
  REABILITACAO:         'Reabilitação',
  PERFORMANCE_ESPORTIVA:'Performance Esportiva',
}

export const PONTO_LABELS: Record<PontoMedicao, string> = {
  PESCOCO:             'Pescoço',
  OMBRO:               'Ombro',
  TORAX:               'Tórax',
  CINTURA:             'Cintura',
  ABDOMEN:             'Abdômen',
  QUADRIL:             'Quadril',
  BRACO_ESQUERDO:      'Braço Esquerdo',
  BRACO_DIREITO:       'Braço Direito',
  ANTEBRACO_ESQUERDO:  'Antebraço Esquerdo',
  ANTEBRACO_DIREITO:   'Antebraço Direito',
  COXA_ESQUERDA:       'Coxa Esquerda',
  COXA_DIREITA:        'Coxa Direita',
  PANTURRILHA_ESQUERDA:'Panturrilha Esquerda',
  PANTURRILHA_DIREITA: 'Panturrilha Direita',
}

export const PONTOS_ORDENADOS: PontoMedicao[] = [
  'PESCOCO', 'OMBRO', 'TORAX', 'CINTURA', 'ABDOMEN', 'QUADRIL',
  'BRACO_ESQUERDO', 'BRACO_DIREITO',
  'ANTEBRACO_ESQUERDO', 'ANTEBRACO_DIREITO',
  'COXA_ESQUERDA', 'COXA_DIREITA',
  'PANTURRILHA_ESQUERDA', 'PANTURRILHA_DIREITA',
]

export interface MedidaCorporalResponse {
  id:           number
  pontoMedicao: PontoMedicao
  valorCm:      number
}

export interface ComposicaoCorporalResponse {
  id:                    number
  percentualGordura:     number | null
  massaMuscularKg:       number | null
  massaGordaKg:          number | null
  massaOsseaKg:          number | null
  aguaCorporalPercentual:number | null
  metabolismoBasal:      number | null
  idadeMetabolica:       number | null
}

export interface AvaliacaoFisicaResponse {
  id:            number
  pessoaId:      number
  pessoaNome:    string
  usuarioId:     number | null
  usuarioNome:   string | null
  dataAvaliacao: string
  peso:          number
  altura:        number
  imc:           number | null
  idade:         number
  sexo:          string
  objetivo:      ObjetivoAvaliacao
  metaDescricao: string | null
  pesoAlvo:      number | null
  observacoes:   string | null
  ativo:         boolean
  medidas:       MedidaCorporalResponse[]
  composicao:    ComposicaoCorporalResponse | null
  createdAt:     string
  updatedAt:     string
}

export interface AvaliacaoFisicaSummary {
  id:            number
  pessoaId:      number
  pessoaNome:    string
  dataAvaliacao: string
  peso:          number
  altura:        number
  imc:           number | null
  idade:         number
  sexo:          string
  objetivo:      ObjetivoAvaliacao
  metaDescricao: string | null
  pesoAlvo:      number | null
  ativo:         boolean
  medidas:       MedidaCorporalResponse[]
  composicao:    ComposicaoCorporalResponse | null
}
