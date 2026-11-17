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
import { chaveDaSelecao, opcoesDeTipo, selecionarTipos } from '../../../shared/api/auxiliares';
import { ROTULO_CADASTROS } from '../../../shared/sessao';
import { formatarDocumento, rotuloDe } from '../../../shared/util/format';
import { formatarTelefone } from '../../../shared/util/telefone';
import { pessoasApi, type PessoaLista } from '../api/pessoas';
import {
  cidadeUf,
  colunasExportadas,
  FILTROS_VAZIOS,
  paraConsulta,
  rotuloDoTipoPessoa,
  TIPO_PESSOA_OPCOES,
  type FiltrosPessoa,
} from '../schemas/pessoaFiltros';

/** Cópia do modelo List (docs/07 §4.1), a partir do ContratanteList. Difere dele só no que é `// troca`. */

const LISTA = '/cadastros/pessoas'; // troca
const ORDEM = 'nome,asc'; // troca
const POR_PAGINA = 20;

export function PessoaList() {
  // troca
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('PESSOAS'); // troca: grupo PESSOAS
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const form = useForm<FiltrosPessoa>({ defaultValues: FILTROS_VAZIOS });
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<PessoaLista>>();

  // troca: o combo "Tipo de cadastro" lê a seleção do auxiliar (com os inativos: dá para filtrar por um tipo já inativado)
  const tipos = useQuery({
    queryKey: chaveDaSelecao('tipos-cadastro', true),
    queryFn: () => selecionarTipos('tipos-cadastro', true),
  });
  const opcoesTipoCadastro = opcoesDeTipo(tipos.data ?? [], tipos.data ?? []);

  const lista = useQuery({
    queryKey: ['pessoas', 'lista', aplicados, pagina], // troca
    queryFn: () => pessoasApi.listar({ ...paraConsulta(aplicados), page: pagina, size: POR_PAGINA, sort: ORDEM }), // troca
    placeholderData: keepPreviousData,
  });

  const filtrar = (f: FiltrosPessoa) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    form.reset(FILTROS_VAZIOS);
    filtrar(FILTROS_VAZIOS);
  };

  // troca
  const alternar = async (p: PessoaLista) => {
    const ok = await confirmar({
      titulo: p.ativo ? 'Inativar pessoa?' : 'Reativar pessoa?',
      mensagem: p.ativo
        ? `Inativar ${p.nome}? Ela deixa de aparecer nas escolhas, mas o cadastro e os vínculos continuam.`
        : `Reativar ${p.nome}? Ela volta a aparecer nas escolhas.`,
      variante: p.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (p.ativo ? pessoasApi.inativar(p.id) : pessoasApi.ativar(p.id));
      msg.sucesso(p.ativo ? `${p.nome} foi inativada` : `${p.nome} foi reativada`);
      await queryClient.invalidateQueries({ queryKey: ['pessoas'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };

  // A exportação repete os filtros aplicados, página a página.
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<PessoaLista>> => {
      const p = await pessoasApi.listar({ ...paraConsulta(aplicados), page: indice, size: limite, sort: ORDEM }); // troca
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados],
  );

  // troca
  const colunas: Coluna<PessoaLista>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      numerica: true,
      className: 'w-px whitespace-nowrap',
      render: (p) => p.codPessoa,
    },
    {
      chave: 'nome',
      cabecalho: 'Nome',
      principal: true,
      render: (p) => (
        <>
          <span className="block font-medium">{p.nome}</span>
          {p.nomeFantasia && <span className="block text-muted">{p.nomeFantasia}</span>}
        </>
      ),
    },
    {
      chave: 'documento',
      cabecalho: 'CPF/CNPJ',
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (p) => formatarDocumento(p.documento),
    },
    {
      chave: 'tipos',
      cabecalho: 'Tipos',
      secundaria: true,
      render: (p) =>
        p.tiposCadastro.length === 0 ? (
          '—'
        ) : (
          <span className="flex flex-wrap gap-1">
            {p.tiposCadastro.map((t) => (
              <TBadge key={t.id} tom="neutro">
                {t.nome}
              </TBadge>
            ))}
          </span>
        ),
    },
    {
      chave: 'telefone',
      cabecalho: 'Telefone',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (p) => formatarTelefone(p.telefonePrincipal),
    },
    {
      chave: 'cidade',
      cabecalho: 'Cidade/UF',
      secundaria: true,
      render: (p) => <span className="text-muted">{cidadeUf(p) || '—'}</span>,
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (p) => (
        <TBadge tom={p.ativo ? 'sucesso' : 'erro'} ponto>
          {p.ativo ? 'Ativa' : 'Inativa'}
        </TBadge>
      ),
    },
  ];

  return (
    <TPage
      title="Pessoas" // troca
      breadcrumb={[ROTULO_CADASTROS, 'Pessoas']} // troca
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Pessoas" // troca
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(p) => p.id}
            filtros={[
              // troca
              { rotulo: 'Código', valor: aplicados.codPessoa.trim() },
              { rotulo: 'Nome ou fantasia', valor: aplicados.busca.trim() },
              { rotulo: 'CPF ou CNPJ', valor: aplicados.documento.trim() },
              { rotulo: 'Tipo de pessoa', valor: rotuloDe(TIPO_PESSOA_OPCOES, aplicados.tipoPessoa || null) ?? '' },
              { rotulo: 'Tipo de cadastro', valor: rotuloDe(opcoesTipoCadastro, aplicados.tipoCadastroId || null) ?? '' },
              { rotulo: 'Situação', valor: aplicados.ativo === 'true' ? 'Ativas' : aplicados.ativo === 'false' ? 'Inativas' : '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        {/* troca */}
        <TRow>
          <TEntry name="codPessoa" label="Código" mascara="inteiro" maxLength={10} />
        </TRow>
        <TRow>
          <TEntry name="busca" label="Nome ou fantasia" placeholder="Nome ou nome fantasia" maxLength={100} />
        </TRow>
        <TRow>
          <TEntry name="documento" label="CPF ou CNPJ" mascara="cpfCnpj" />
        </TRow>
        <TRow>
          <TCombo name="tipoPessoa" label="Tipo de pessoa" opcoes={TIPO_PESSOA_OPCOES} vazio="Todas" />
        </TRow>
        <TRow>
          <TCombo name="tipoCadastroId" label="Tipo de cadastro" opcoes={opcoesTipoCadastro} vazio="Todos" />
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
              nome="Pessoas" // troca
              colunas={colunasExportadas}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Pessoas" // troca
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(p) => p.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        onLinhaClick={(p) => navigate(`${LISTA}/${p.id}`)}
        tituloCartao={(p) => p.nome}
        acoes={
          somenteLeitura
            ? undefined
            : (p) => (
                <>
                  <TButton
                    variant="editar"
                    label=""
                    aria-label={`Editar ${p.nome}`}
                    title={`Editar ${p.nome}`}
                    onClick={() => navigate(`${LISTA}/${p.id}`)}
                  />
                  <TButton
                    variant={p.ativo ? 'inativar' : 'reativar'}
                    label=""
                    aria-label={`${p.ativo ? 'Inativar' : 'Reativar'} ${p.nome}`}
                    title={`${p.ativo ? 'Inativar' : 'Reativar'} ${p.nome}`}
                    onClick={() => void alternar(p)}
                  />
                </>
              )
        }
        vazioTitulo="Nenhuma pessoa encontrada" // troca
        vazioDescricao="Ajuste os filtros ou cadastre a primeira."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
