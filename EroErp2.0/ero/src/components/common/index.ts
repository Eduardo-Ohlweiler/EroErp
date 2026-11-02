// O kit de telas (docs/14-layout-de-telas.md). A tela importa daqui, e só daqui.

// Estrutura
export { TPage } from './TPage'
export { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from './TForm'
export { TRow, TCol, TRotulo } from './TRow'
export { TPanel } from './TPanel'
export { TModal } from './TModal'
export { TTabs, TTabPanel, type Aba } from './TTabs'
export { CLASSE_LARGURA, type Largura } from './larguras'

// Campos
export { TEntry, type Mascara, type MascaraNumerica } from './TEntry'
export { TDate, TDateTime } from './TDate'
export { TTextArea } from './TTextArea'
export { TCombo, type OpcaoSelect } from './TCombo'
export { TDBCombo } from './TDBCombo'
export { TDBComboMulti } from './TDBComboMulti'
export { TCheckBox, TDBCheckBox } from './TCheckBox'
export { TRadio, TDBRadio } from './TRadio'
export { TFieldList, type ColunaDaLista } from './TFieldList'
export { TAuditoria, type Auditavel } from './TAuditoria'
export { SITUACAO_OPCOES } from './opcoes'

// Mensagens e confirmação
export { useMessage, type Mensagens } from './useMessage'
export { TQuestionProvider } from './TQuestion'
export { useQuestion, type Pergunta } from './useQuestion'

// Botões e grade
export { TButton } from './TButton'
export { TDataGrid, type Coluna } from './TDataGrid'
export { TDataGridFooter } from './TDataGridFooter'
export {
  TAcoesDeExportacao,
  TETO_DE_EXPORTACAO,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from './TAcoesDeExportacao'
export { TBotaoImprimir } from './TBotaoImprimir'

// Exibição
export { TAviso } from './TAviso'
export { TBadge } from './TBadge'
export { TResultGroup } from './TResultGroup'
export { TResultTable, type ColunaResultado } from './TResultTable'
export {
  TResult,
  type Classificacao,
  type TomResultado,
} from './TResult'
export { TThemeToggle } from './TThemeToggle'
