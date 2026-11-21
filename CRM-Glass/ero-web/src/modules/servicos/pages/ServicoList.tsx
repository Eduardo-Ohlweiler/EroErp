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
  TDBCombo,
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
import { formatarDuracao, rotuloDe } from '../../../shared/util/format';
import { filiaisApi, rotuloDaFilial } from '../../filiais/api/filiais';
import { faixaDePrecos, servicosApi, type Servico } from '../api/servicos';
import {
  categoriaDe,
  colunasExportadas,
  FILTROS_VAZIOS,
  paraConsulta,
  quantasFiliais,
  rotuloDaFilialFiltrada,
  textoDoPrecoNaFilial,
  type FiltrosServico,
} from '../schemas/servicoFiltros';

/**
 * Cópia do modelo List (docs/07 §4.1), a partir do FilialList. Difere dele só no que é `// troca`.
 * A lista vem por nome (a API ordena sem `sort`). Com filial no filtro, a coluna Preço vira "Preço na filial".
 */

const LISTA = '/cadastros/servicos'; // troca
const POR_PAGINA = 20;

export function ServicoList() {
  // troca
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('SERVICOS'); // troca: grupo SERVICOS
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const form = useForm<FiltrosServico>({ defaultValues: FILTROS_VAZIOS });
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<Servico>>();

  // troca: o combo "Categoria" lê a seleção do auxiliar (com as inativas: dá para filtrar por uma categoria já inativada)
  const categorias = useQuery({
    queryKey: chaveDaSelecao('categorias-servico', true),
    queryFn: () => selecionarTipos('categorias-servico', true),
  });
  const opcoesCategoria = opcoesDeTipo(categorias.data ?? [], categorias.data ?? []);

  const lista = useQuery({
    queryKey: ['servicos', 'lista', aplicados, pagina], // troca
    queryFn: () => servicosApi.listar({ ...paraConsulta(aplicados), page: pagina, size: POR_PAGINA }), // troca: sem sort
    placeholderData: keepPreviousData,
  });

  const filtrar = (f: FiltrosServico) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    form.reset(FILTROS_VAZIOS);
    filtrar(FILTROS_VAZIOS);
  };

  // troca
  const alternar = async (s: Servico) => {
    const ok = await confirmar({
      titulo: s.ativo ? 'Inativar serviço?' : 'Reativar serviço?',
      mensagem: s.ativo
        ? `Inativar ${s.nome}? Ele deixa de aparecer nas escolhas, mas o cadastro continua.`
        : `Reativar ${s.nome}? Ele volta a aparecer nas escolhas.`,
      variante: s.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (s.ativo ? servicosApi.inativar(s.id) : servicosApi.ativar(s.id));
      msg.sucesso(s.ativo ? `${s.nome} foi inativado` : `${s.nome} foi reativado`);
      await queryClient.invalidateQueries({ queryKey: ['servicos'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };

  // A exportação repete os filtros aplicados, página a página.
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<Servico>> => {
      const p = await servicosApi.listar({ ...paraConsulta(aplicados), page: indice, size: limite }); // troca: sem sort
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados],
  );

  // troca: o combo de filial leva a cor (a bolinha); a lista só traz as filiais ativas
  const buscarFiliais = async (termo?: string) =>
    (await filiaisApi.selecionar(termo)).map((f) => ({ id: f.id, nome: rotuloDaFilial(f), cor: f.cor }));

  // troca: com filial aplicada, a coluna Preço é o preço dela
  const filialAplicada = aplicados.filialId;
  const colunasDoDocumento = colunasExportadas(filialAplicada || undefined);

  // troca
  const colunas: Coluna<Servico>[] = [
    {
      chave: 'codigo',
      cabecalho: 'Código',
      numerica: true,
      className: 'w-px whitespace-nowrap',
      render: (s) => s.codServico,
    },
    {
      chave: 'nome',
      cabecalho: 'Nome',
      principal: true,
      render: (s) => <span className="font-medium">{s.nome}</span>,
    },
    {
      chave: 'categoria',
      cabecalho: 'Categoria',
      secundaria: true,
      render: (s) => categoriaDe(s),
    },
    {
      chave: 'duracao',
      cabecalho: 'Duração',
      numerica: true,
      secundaria: true,
      className: 'w-px whitespace-nowrap',
      render: (s) => formatarDuracao(s.duracaoMinutos),
    },
    filialAplicada
      ? {
          chave: 'preco',
          cabecalho: 'Preço na filial',
          numerica: true,
          className: 'w-px whitespace-nowrap',
          render: (s) => textoDoPrecoNaFilial(s, filialAplicada),
        }
      : {
          chave: 'preco',
          cabecalho: 'Preço',
          numerica: true,
          className: 'w-px whitespace-nowrap',
          render: (s) => (
            <>
              <span>{faixaDePrecos(s.valores)}</span>
              <span className="block text-muted">{quantasFiliais(s)}</span>
            </>
          ),
        },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (s) => (
        <TBadge tom={s.ativo ? 'sucesso' : 'erro'} ponto>
          {s.ativo ? 'Ativo' : 'Inativo'}
        </TBadge>
      ),
    },
  ];

  return (
    <TPage
      title="Serviços" // troca
      breadcrumb={[ROTULO_CADASTROS, 'Serviços']} // troca
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Serviços" // troca
            colunas={colunasDoDocumento}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(s) => s.id}
            filtros={[
              // troca
              { rotulo: 'Código', valor: aplicados.codServico.trim() },
              { rotulo: 'Nome', valor: aplicados.busca.trim() },
              { rotulo: 'Categoria', valor: rotuloDe(opcoesCategoria, aplicados.categoriaId || null) ?? '' },
              { rotulo: 'Filial', valor: filialAplicada ? rotuloDaFilialFiltrada(paraImprimir.linhas, filialAplicada) : '' },
              { rotulo: 'Situação', valor: aplicados.ativo === 'true' ? 'Ativos' : aplicados.ativo === 'false' ? 'Inativos' : '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        {/* troca */}
        <TRow>
          <TEntry name="codServico" label="Código" mascara="inteiro" width="codigo" maxLength={10} />
        </TRow>
        <TRow>
          <TEntry name="busca" label="Nome" placeholder="Parte do nome" maxLength={150} />
        </TRow>
        <TRow>
          <TCombo name="categoriaId" label="Categoria" opcoes={opcoesCategoria} vazio="Todas" />
        </TRow>
        <TRow>
          <TDBCombo name="filialId" label="Filial" buscar={buscarFiliais} vazio="Todas" />
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
              nome="Serviços" // troca
              colunas={colunasDoDocumento}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Serviços" // troca
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(s) => s.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        onLinhaClick={(s) => navigate(`${LISTA}/${s.id}`)}
        tituloCartao={(s) => s.nome}
        acoes={
          somenteLeitura
            ? undefined
            : (s) => (
                <>
                  <TButton
                    variant="editar"
                    label=""
                    aria-label={`Editar ${s.nome}`}
                    title={`Editar ${s.nome}`}
                    onClick={() => navigate(`${LISTA}/${s.id}`)}
                  />
                  <TButton
                    variant={s.ativo ? 'inativar' : 'reativar'}
                    label=""
                    aria-label={`${s.ativo ? 'Inativar' : 'Reativar'} ${s.nome}`}
                    title={`${s.ativo ? 'Inativar' : 'Reativar'} ${s.nome}`}
                    onClick={() => void alternar(s)}
                  />
                </>
              )
        }
        vazioTitulo="Nenhum serviço encontrado" // troca
        vazioDescricao="Ajuste os filtros ou cadastre o primeiro."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
