export type TipoFinalidade = "ESTETICA" | "CLINICA_GERAL" | "DENTISTA" | "PODOLOGIA" | "NUTRICAO" | "VETERINARIA"
export type TipoCampo = "TEXTO" | "TEXTO_LONGO" | "CHECKBOX" | "DATA" | "NUMERO" | "OPCOES" | "MULTIPLAS_OPCOES"

export interface CampoAnamneseResponse {
  id: number
  secao: string | null
  rotulo: string
  tipo: TipoCampo
  opcoes: string | null  // JSON string ex: '["Sim","Não"]'
  ordem: number
  obrigatorio: boolean
  ativo: boolean
}

export interface TemplateAnamneseResponse {
  id: number
  nome: string
  finalidade: TipoFinalidade
  descricao: string | null
  ativo: boolean
  campos: CampoAnamneseResponse[]
}

export interface TemplateAnamnesesSummary {
  id: number
  nome: string
  finalidade: TipoFinalidade
  descricao: string | null
  ativo: boolean
  totalCampos: number
}

export interface RespostaAnamneseResponse {
  campoId: number
  secao: string | null
  rotulo: string
  tipo: TipoCampo
  opcoes: string | null
  ordem: number
  obrigatorio: boolean
  valor: string | null
}

export interface FichaAnamneseResponse {
  id: number
  templateId: number
  templateNome: string
  finalidade: TipoFinalidade
  pessoaId: number
  pessoaNome: string
  pessoaDocumento: string | null
  emitenteId: number | null
  emitenteNome: string | null
  dataPreenchimento: string  // "YYYY-MM-DD"
  observacoes: string | null
  respostas: RespostaAnamneseResponse[]
  createdAt: string
  createdByNome: string | null
}

export interface FichaAnamnesesSummary {
  id: number
  pessoaId: number
  pessoaNome: string
  finalidade: TipoFinalidade
  templateNome: string
  dataPreenchimento: string
  emitenteNome: string | null
}
