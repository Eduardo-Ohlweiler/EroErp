import { useCallback, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  DocumentoLista,
  TAcoesDeExportacao,
  TBadge,
  TButton,
  TCol,
  TCombo,
  TDataGrid,
  TDataGridFooter,
  TDBCombo,
  TDate,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TRow,
  type Coluna,
  type ColunaExportavel,
  type OpcaoDoBanco,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '../../../design-system/kit';
import { selecaoApi } from '../../../shared/api/selecao';
import { naVisaoDePlataforma, ROTULO_ADMINISTRATIVO, useUsuarioAtual } from '../../../shared/sessao';
import { descreverAgente } from '../../../shared/util/agente';
import { AUSENTE, formatarData, formatarDataHora, rotuloDe } from '../../../shared/util/format';
import { auditoriaApi, type EventoResponse, type TipoEvento } from '../api/auditoria';
import {
  autorDoEvento,
  categoriasDe,
  filtrosIniciais,
  paraConsulta,
  tomDoEvento,
  usuarioDoEvento,
  type FiltrosLogs,
} from '../schemas/logs';

/**
 * Cópia do modelo List (docs/07 §4.1), a partir do ContratanteList, sem Novo e sem ações de grade (a trilha só se
 * lê). Difere dele só no que é `// troca`.
 */

const POR_PAGINA = 50; // troca: a trilha tem muitas linhas curtas
const SEM_TIPOS: TipoEvento[] = [];

export function AuditoriaList() {
  // troca
  const eu = useUsuarioAtual();
  const naPlataforma = naVisaoDePlataforma(eu); // troca: Contratante só na plataforma; Usuário só dentro de um contratante
  const form = useForm<FiltrosLogs>({ defaultValues: filtrosIniciais() });
  const [aplicados, setAplicados] = useState(() => form.getValues());
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<EventoResponse>>();
  const de = form.watch('de');

  // troca: rótulos, categorias e falhas vêm da API (o código do tipo fica de reserva)
  const tiposQuery = useQuery({ queryKey: ['auditoria', 'tipos'], queryFn: auditoriaApi.tipos, staleTime: Infinity });
  const tipos = tiposQuery.data ?? SEM_TIPOS;
  const tipoPorCodigo = useMemo(() => new Map(tipos.map((t) => [t.codigo, t])), [tipos]);
  const categorias = useMemo(() => categoriasDe(tipos, naPlataforma), [tipos, naPlataforma]);

  // troca: nomes do que foi escolhido nos combos, para a folha impressa dizer o filtro por extenso
  const nomes = useRef(new Map<string, string>());
  const lembrar = (lista: OpcaoDoBanco[]) => {
    lista.forEach((o) => nomes.current.set(o.id, o.nome));
    return lista;
  };
  const buscarUsuarios = useCallback(async () => lembrar(await selecaoApi.usuarios(true)), []);
  const buscarContratantes = useCallback(async () => lembrar(await selecaoApi.contratantes()), []);

  const lista = useQuery({
    queryKey: ['auditoria', 'eventos', aplicados, pagina], // troca
    queryFn: () => auditoriaApi.listar({ ...paraConsulta(aplicados, tipos, naPlataforma), page: pagina, size: POR_PAGINA }), // troca
    placeholderData: keepPreviousData,
    enabled: !aplicados.categoria || tipos.length > 0,
  });

  const filtrar = (f: FiltrosLogs) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    const vazio = filtrosIniciais();
    form.reset(vazio);
    filtrar(vazio);
  };

  // A exportação repete os filtros aplicados (o mesmo paraConsulta da grade), página a página.
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<EventoResponse>> => {
      const p = await auditoriaApi.listar({ ...paraConsulta(aplicados, tipos, naPlataforma), page: indice, size: limite }); // troca
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados, tipos, naPlataforma],
  );

  const rotuloDoTipo = (e: EventoResponse) => tipoPorCodigo.get(e.tipo)?.rotulo ?? e.tipo;

  // troca
  const colunasExportadas: ColunaExportavel<EventoResponse>[] = [
    { titulo: 'Evento', valor: rotuloDoTipo },
    { titulo: 'Usuário', valor: usuarioDoEvento },
    { titulo: 'Autor', valor: autorDoEvento },
    ...(naPlataforma ? [{ titulo: 'Contratante', valor: (e: EventoResponse) => e.tenantNome ?? AUSENTE }] : []),
    { titulo: 'IP', semQuebra: true, valor: (e) => e.ip ?? AUSENTE },
    { titulo: 'Navegador', valor: (e) => descreverAgente(e.userAgent) },
    { titulo: 'Detalhe', valor: (e) => e.detalhe ?? '' },
    { titulo: 'Data/hora', semQuebra: true, valor: (e) => formatarDataHora(e.ocorridoEm) },
  ];

  // troca
  const colunas: Coluna<EventoResponse>[] = [
    {
      chave: 'evento',
      cabecalho: 'Evento',
      principal: true,
      render: (e) => (
        <TBadge tom={tomDoEvento(e, tipoPorCodigo.get(e.tipo))} ponto>
          {rotuloDoTipo(e)}
        </TBadge>
      ),
    },
    { chave: 'usuario', cabecalho: 'Usuário', render: usuarioDoEvento },
    { chave: 'autor', cabecalho: 'Autor', secundaria: true, render: autorDoEvento },
    ...(naPlataforma
      ? [{ chave: 'contratante', cabecalho: 'Contratante', render: (e: EventoResponse) => e.tenantNome ?? AUSENTE }]
      : []),
    {
      chave: 'ip',
      cabecalho: 'IP',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (e) => <span className="text-muted">{e.ip ?? AUSENTE}</span>,
    },
    {
      chave: 'navegador',
      cabecalho: 'Navegador',
      secundaria: true,
      render: (e) => <span className="text-muted">{descreverAgente(e.userAgent)}</span>,
    },
    { chave: 'detalhe', cabecalho: 'Detalhe', secundaria: true, render: (e) => <span className="text-muted">{e.detalhe || AUSENTE}</span> },
    {
      chave: 'quando',
      cabecalho: 'Data/hora',
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (e) => formatarDataHora(e.ocorridoEm),
    },
  ];

  const periodo =
    aplicados.de || aplicados.ate ? `${aplicados.de ? formatarData(aplicados.de) : '…'} a ${aplicados.ate ? formatarData(aplicados.ate) : '…'}` : '';

  return (
    <TPage
      title="Logs" // troca
      breadcrumb={[ROTULO_ADMINISTRATIVO, 'Logs']} // troca
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Logs" // troca
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(e) => e.id}
            filtros={[
              // troca
              { rotulo: 'Período', valor: periodo },
              { rotulo: 'Categoria', valor: rotuloDe(categorias, aplicados.categoria) ?? '' },
              { rotulo: 'Usuário', valor: !naPlataforma && aplicados.usuarioId ? (nomes.current.get(aplicados.usuarioId) ?? '') : '' },
              { rotulo: 'Contratante', valor: naPlataforma && aplicados.tenantId ? (nomes.current.get(aplicados.tenantId) ?? '') : '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        {/* troca: De · Até lado a lado (grupo natural, docs/07 §1) */}
        <TRow>
          <TCol width="auto">
            <TDate name="de" label="De" />
          </TCol>
          <TCol width="auto">
            <TDate name="ate" label="Até" min={de || undefined} />
          </TCol>
        </TRow>
        <TRow>
          <TCombo name="categoria" label="Categoria" opcoes={categorias} vazio="Todas" width="medio" />
        </TRow>
        {naPlataforma ? (
          <TRow>
            <TDBCombo name="tenantId" label="Contratante" buscar={buscarContratantes} vazio="Todos" />
          </TRow>
        ) : (
          <TRow>
            <TDBCombo name="usuarioId" label="Usuário" buscar={buscarUsuarios} vazio="Todos" />
          </TRow>
        )}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {/* troca: sem Novo — a trilha não se cadastra */}
            <TAcoesDeExportacao
              nome="Logs" // troca
              colunas={colunasExportadas}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Logs" // troca
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(e) => e.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        tituloCartao={rotuloDoTipo}
        // troca: sem onLinhaClick e sem acoes — evento não se abre nem se altera
        vazioTitulo="Nenhum evento encontrado" // troca
        vazioDescricao="Ajuste o período ou os filtros."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
