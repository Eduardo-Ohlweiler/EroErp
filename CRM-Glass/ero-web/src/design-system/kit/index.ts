/**
 * O kit de telas (docs/07-layout-de-telas.md). A tela de cadastro importa daqui, e só daqui, todo componente de
 * interface. Mesmos nomes e props do kit do EroErp 2.0; a pele é a glass (tokens, vidro, destaque do contratante).
 */

// Estrutura
export { TPage, type TPageProps } from './TPage';
export { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight, type TFormProps } from './TForm';
export { TRow, TCol, TRotulo, type TColProps } from './TRow';
export { TPanel, type TPanelProps } from './TPanel';
export { TModal, LARGURA_DO_MODAL, type TModalProps } from './TModal';
export { TTabs, TTabPanel, type TTabsProps, type TTabPanelProps, type AbaTTabs } from './TTabs';
export { CLASSE_LARGURA, LARGURA_PADRAO, type Largura, type LarguraAplicada } from './larguras';

// Campos
export { TEntry, type TEntryProps } from './TEntry';
export { type Mascara, type MascaraNumerica } from './mascaras';
export { TCombo, type TComboProps } from './TCombo';
export { TDBCombo, ESPERA_DA_BUSCA_MS, type TDBComboProps, type OpcaoDoBanco } from './TDBCombo';
export { TDate, type TDateProps } from './TDate';
export { TRadio, type TRadioProps, type OpcaoRadio } from './TRadio';
export { TCheckBox, type TCheckBoxProps, type OpcaoCheckBox } from './TCheckBox';
export { TAuditoria, type Auditavel } from './TAuditoria';
export { SITUACAO_OPCOES, type OpcaoSelect } from './opcoes';
export { type PropsDeCampo } from './campo';

// Mensagens, confirmação e permissão
export { useMessage, type Mensagens, type OpcoesErroApi } from './useMessage';
export { TQuestionProvider, useQuestion, type Pergunta } from './useQuestion';
export { useSomenteLeitura } from './somenteLeitura';

// Botões, grade e exportação
export { TButton, TamanhoDoTButton, type TButtonProps, type VarianteTButton, type AcaoTButton } from './TButton';
export { TDataGrid, type Coluna, type TDataGridProps } from './TDataGrid';
export { TDataGridFooter } from './TDataGridFooter';
export { TBadge, type TomTBadge } from './TBadge';
export { TAcoesDeExportacao, TETO_DE_EXPORTACAO, type PaginaDaCarga, type ResultadoDaCarga } from './TAcoesDeExportacao';
export { DocumentoLista, Folha, type FiltroAplicado } from './impressao';
export { type ColunaExportavel } from './planilha';

// Telas que não são cadastro mas usam o kit (Aparência do contratante): as peças de ui/ que elas precisam,
// para a tela continuar importando só daqui (docs/07 §3.5).
export { AvisoContexto, type AvisoContextoProps } from '../ui/AvisoContexto';
export { EditorAparencia, type EditorAparenciaProps } from '../ui/EditorAparencia';
