import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  DocumentoLista,
  SITUACAO_OPCOES,
  TAcoesDeExportacao,
  TBadge,
  TButton,
  TCombo,
  TCorMarca,
  TDataGrid,
  TDataGridFooter,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TRow,
  useMessage,
  useQuestion,
  useSomenteLeitura,
  type Coluna,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '../../../design-system/kit';
import { ROTULO_CADASTROS } from '../../../shared/sessao';
import { formatarDocumento, rotuloDe } from '../../../shared/util/format';
import { filiaisApi, rotuloDaFilial, TIPO_FILIAL_OPCOES, type Filial } from '../api/filiais';
import { colunasExportadas, FILTROS_VAZIOS, paraConsulta, type FiltrosFilial } from '../schemas/filialFiltros';

/**
 * Cópia do modelo List (docs/07 §4.1), a partir do PessoaList. Difere dele só no que é `// troca`.
 * A lista não ordena: a API recusa `sort` e devolve cada matriz seguida das suas filiais.
 */

const LISTA = '/cadastros/filiais'; // troca
const POR_PAGINA = 20;

export function FilialList() {
  // troca
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('FILIAIS'); // troca: grupo FILIAIS
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const form = useForm<FiltrosFilial>({ defaultValues: FILTROS_VAZIOS });
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<Filial>>();

  const lista = useQuery({
    queryKey: ['filiais', 'lista', aplicados, pagina], // troca
    queryFn: () => filiaisApi.listar({ ...paraConsulta(aplicados), page: pagina, size: POR_PAGINA }), // troca: sem sort
    placeholderData: keepPreviousData,
  });

  const filtrar = (f: FiltrosFilial) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    form.reset(FILTROS_VAZIOS);
    filtrar(FILTROS_VAZIOS);
  };

  // troca
  const alternar = async (f: Filial) => {
    const nome = f.pessoa.nome;
    const ok = await confirmar({
      titulo: f.ativo ? 'Inativar filial?' : 'Reativar filial?',
      mensagem: f.ativo
        ? `Inativar ${nome}? Ela deixa de aparecer nas escolhas, mas o cadastro continua.`
        : `Reativar ${nome}? Ela volta a aparecer nas escolhas.`,
      variante: f.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (f.ativo ? filiaisApi.inativar(f.id) : filiaisApi.ativar(f.id));
      msg.sucesso(f.ativo ? `${nome} foi inativada` : `${nome} foi reativada`);
      await queryClient.invalidateQueries({ queryKey: ['filiais'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };

  // A exportação repete os filtros aplicados, página a página.
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<Filial>> => {
      const p = await filiaisApi.listar({ ...paraConsulta(aplicados), page: indice, size: limite }); // troca: sem sort
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados],
  );

  // troca
  const colunas: Coluna<Filial>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      numerica: true,
      className: 'w-px whitespace-nowrap',
      render: (f) => f.codFilial,
    },
    {
      chave: 'nome',
      cabecalho: 'Nome',
      principal: true,
      render: (f) => (
        <>
          <span className="flex flex-wrap items-center gap-2">
            <TCorMarca cor={f.cor} tamanho="sm" />
            <span className="font-medium">{f.pessoa.nome}</span>
            {!f.pessoa.ativo && <TBadge tom="alerta">Pessoa inativa</TBadge>}
          </span>
          {f.pessoa.nomeFantasia && <span className="block text-muted">{f.pessoa.nomeFantasia}</span>}
        </>
      ),
    },
    {
      chave: 'documento',
      cabecalho: 'CPF/CNPJ',
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (f) => formatarDocumento(f.pessoa.documento),
    },
    {
      chave: 'tipo',
      cabecalho: 'Tipo',
      className: 'w-px whitespace-nowrap',
      render: (f) => <TBadge tom={f.tipo === 'MATRIZ' ? 'destaque' : 'neutro'}>{f.tipo === 'MATRIZ' ? 'Matriz' : 'Filial'}</TBadge>,
    },
    {
      chave: 'matriz',
      cabecalho: 'Matriz',
      secundaria: true,
      render: (f) => (f.matriz ? rotuloDaFilial(f.matriz) : '—'),
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (f) => (
        <TBadge tom={f.ativo ? 'sucesso' : 'erro'} ponto>
          {f.ativo ? 'Ativa' : 'Inativa'}
        </TBadge>
      ),
    },
  ];

  return (
    <TPage
      title="Filiais" // troca
      breadcrumb={[ROTULO_CADASTROS, 'Filiais']} // troca
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Filiais" // troca
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(f) => f.id}
            filtros={[
              // troca
              { rotulo: 'Código', valor: aplicados.codFilial.trim() },
              { rotulo: 'Nome ou fantasia', valor: aplicados.busca.trim() },
              { rotulo: 'CPF ou CNPJ', valor: aplicados.documento.trim() },
              { rotulo: 'Tipo', valor: rotuloDe(TIPO_FILIAL_OPCOES, aplicados.tipo || null) ?? '' },
              { rotulo: 'Situação', valor: aplicados.ativo === 'true' ? 'Ativas' : aplicados.ativo === 'false' ? 'Inativas' : '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        {/* troca */}
        <TRow>
          <TEntry name="codFilial" label="Código" mascara="inteiro" width="codigo" maxLength={10} />
        </TRow>
        <TRow>
          <TEntry name="busca" label="Nome ou fantasia" placeholder="Nome ou nome fantasia" maxLength={100} />
        </TRow>
        <TRow>
          <TEntry name="documento" label="CPF ou CNPJ" mascara="cpfCnpj" />
        </TRow>
        <TRow>
          <TCombo name="tipo" label="Tipo" opcoes={TIPO_FILIAL_OPCOES} vazio="Todos" />
        </TRow>
        <TRow>
          <TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate(`${LISTA}/novo`)} />}
            <TAcoesDeExportacao
              nome="Filiais" // troca
              colunas={colunasExportadas}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Filiais" // troca
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(f) => f.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        onLinhaClick={(f) => navigate(`${LISTA}/${f.id}`)}
        tituloCartao={(f) => f.pessoa.nome}
        acoes={
          somenteLeitura
            ? undefined
            : (f) => (
                <>
                  <TButton
                    variant="editar"
                    label=""
                    aria-label={`Editar ${f.pessoa.nome}`}
                    title={`Editar ${f.pessoa.nome}`}
                    onClick={() => navigate(`${LISTA}/${f.id}`)}
                  />
                  <TButton
                    variant={f.ativo ? 'inativar' : 'reativar'}
                    label=""
                    aria-label={`${f.ativo ? 'Inativar' : 'Reativar'} ${f.pessoa.nome}`}
                    title={`${f.ativo ? 'Inativar' : 'Reativar'} ${f.pessoa.nome}`}
                    onClick={() => void alternar(f)}
                  />
                </>
              )
        }
        vazioTitulo="Nenhuma filial encontrada" // troca
        vazioDescricao="Ajuste os filtros ou cadastre a primeira."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
