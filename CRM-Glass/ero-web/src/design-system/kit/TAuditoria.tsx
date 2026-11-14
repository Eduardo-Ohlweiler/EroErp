import { AUSENTE, formatarDataHora } from '../../shared/util/format';
import { TEntry } from './TEntry';
import { TCol, TRow } from './TRow';

/** O que o `ResponseDto` de cadastro publica sobre quem gravou (datas ISO-8601 em UTC). */
export type Auditavel = {
  criadoPorNome?: string | null;
  createdAt?: string | null;
  alteradoPorNome?: string | null;
  updatedAt?: string | null;
};

/**
 * O servidor pode carimbar `updatedAt` já na criação: a mesma hora não é alteração. Só conta o que veio mais de
 * 1 s depois (função pura).
 */
export function foiAlterado(r: Auditavel): boolean {
  if (r.alteradoPorNome) return true;
  if (!r.updatedAt) return false;
  if (!r.createdAt) return true;
  return new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 1000;
}

/**
 * Quem criou e quem alterou, e quando (docs/07 §3.2) — só na edição, no fim do formulário, só leitura (fundo de
 * campo só leitura). Linha sem dado não aparece; metade de uma linha sem dado (cadastro do sistema, sem autor)
 * mostra o traço. Quem: `medio`; quando: `dataHora`, no fuso de quem lê.
 */
export function TAuditoria({ registro }: { registro?: Auditavel | null }) {
  if (!registro) return null;
  const criado = !!(registro.criadoPorNome || registro.createdAt);
  const alterado = foiAlterado(registro);
  if (!criado && !alterado) return null;
  return (
    <div data-kit="TAuditoria" className="flex flex-col gap-4 border-t border-line pt-4">
      {criado && <Linha rotuloQuem="Criado por" quem={registro.criadoPorNome} rotuloQuando="Criado em" quando={registro.createdAt} />}
      {alterado && <Linha rotuloQuem="Alterado por" quem={registro.alteradoPorNome} rotuloQuando="Alterado em" quando={registro.updatedAt} />}
    </div>
  );
}

function Linha({ rotuloQuem, quem, rotuloQuando, quando }: { rotuloQuem: string; quem?: string | null; rotuloQuando: string; quando?: string | null }) {
  return (
    <TRow>
      <TCol width="auto">
        <TEntry label={rotuloQuem} value={quem || AUSENTE} readOnly tabIndex={-1} width="medio" />
      </TCol>
      <TCol width="auto">
        <TEntry label={rotuloQuando} value={formatarDataHora(quando)} readOnly tabIndex={-1} width="dataHora" />
      </TCol>
    </TRow>
  );
}
