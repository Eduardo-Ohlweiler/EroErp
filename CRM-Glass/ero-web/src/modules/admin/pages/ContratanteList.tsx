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
  type ColunaExportavel,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '../../../design-system/kit';
import { ROTULO_ADMINISTRATIVO } from '../../../shared/sessao';
import { formatarDataHora, formatarDocumento } from '../../../shared/util/format';
import { tenantsApi, type TenantResponse } from '../api/tenants';
import { FILTROS_VAZIOS, paraConsulta, usuariosDe, type FiltrosContratante } from '../schemas/contratante';

/** Cópia do modelo List (docs/07 §4.1). Difere dele só no que é `// troca`. */

const ORDEM = 'nome,asc'; // troca
const POR_PAGINA = 20;

export function ContratanteList() {
  // troca
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura(); // troca: presa ao papel (SUPERADMIN), sem grupo
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const form = useForm<FiltrosContratante>({ defaultValues: FILTROS_VAZIOS });
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<TenantResponse>>();

  const lista = useQuery({
    queryKey: ['tenants', 'lista', aplicados, pagina], // troca
    queryFn: () => tenantsApi.listar({ ...paraConsulta(aplicados), page: pagina, size: POR_PAGINA, sort: ORDEM }), // troca
    placeholderData: keepPreviousData,
  });

  const filtrar = (f: FiltrosContratante) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    form.reset(FILTROS_VAZIOS);
    filtrar(FILTROS_VAZIOS);
  };

  // troca
  const alternar = async (t: TenantResponse) => {
    const ok = await confirmar({
      titulo: t.ativo ? 'Inativar contratante?' : 'Reativar contratante?',
      mensagem: t.ativo
        ? `Inativar ${t.nome}? Ninguém dele consegue entrar e as sessões abertas caem.`
        : `Reativar ${t.nome}? Os usuários dele voltam a conseguir entrar.`,
      variante: t.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (t.ativo ? tenantsApi.inativar(t.id) : tenantsApi.ativar(t.id));
      msg.sucesso(t.ativo ? `${t.nome} foi inativado` : `${t.nome} foi reativado`);
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };

  // A exportação repete os filtros aplicados, página a página.
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<TenantResponse>> => {
      const p = await tenantsApi.listar({ ...paraConsulta(aplicados), page: indice, size: limite, sort: ORDEM }); // troca
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados],
  );

  // troca
  const colunasExportadas: ColunaExportavel<TenantResponse>[] = [
    { titulo: 'Nome', valor: (t) => t.nome },
    { titulo: 'Documento', semQuebra: true, valor: (t) => formatarDocumento(t.documento) },
    { titulo: 'E-mail', quebra: 'email', valor: (t) => t.email ?? '' },
    { titulo: 'Criado em', semQuebra: true, valor: (t) => formatarDataHora(t.createdAt) },
    { titulo: 'Usuários', numerica: true, valor: usuariosDe },
    { titulo: 'Situação', valor: (t) => (t.ativo ? 'Ativo' : 'Inativo') },
  ];

  // troca
  const colunas: Coluna<TenantResponse>[] = [
    { chave: 'nome', cabecalho: 'Nome', principal: true, render: (t) => <span className="font-medium">{t.nome}</span> },
    {
      chave: 'documento',
      cabecalho: 'Documento',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (t) => formatarDocumento(t.documento),
    },
    { chave: 'email', cabecalho: 'E-mail', secundaria: true, render: (t) => <span className="text-muted">{t.email ?? '—'}</span> },
    {
      chave: 'criado',
      cabecalho: 'Criado em',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (t) => formatarDataHora(t.createdAt),
    },
    { chave: 'usuarios', cabecalho: 'Usuários', numerica: true, className: 'w-px whitespace-nowrap', render: usuariosDe },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (t) => (
        <TBadge tom={t.ativo ? 'sucesso' : 'erro'} ponto>
          {t.ativo ? 'Ativo' : 'Inativo'}
        </TBadge>
      ),
    },
  ];

  return (
    <TPage
      title="Contratantes" // troca
      breadcrumb={[ROTULO_ADMINISTRATIVO, 'Contratantes']} // troca
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Contratantes" // troca
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(t) => t.id}
            filtros={[
              // troca
              { rotulo: 'Nome ou documento', valor: aplicados.busca.trim() },
              { rotulo: 'Situação', valor: aplicados.ativo === 'true' ? 'Ativos' : aplicados.ativo === 'false' ? 'Inativos' : '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        {/* troca */}
        <TRow>
          <TEntry name="busca" label="Nome ou documento" placeholder="Nome, CNPJ ou CPF" maxLength={100} />
        </TRow>
        <TRow>
          <TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate('/admin/contratantes/novo')} />}
            <TAcoesDeExportacao
              nome="Contratantes" // troca
              colunas={colunasExportadas}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Contratantes" // troca
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(t) => t.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        onLinhaClick={(t) => navigate(`/admin/contratantes/${t.id}`)}
        tituloCartao={(t) => t.nome}
        acoes={
          somenteLeitura
            ? undefined
            : (t) => (
                <>
                  <TButton variant="editar" label="" onClick={() => navigate(`/admin/contratantes/${t.id}`)} />
                  <TButton variant={t.ativo ? 'inativar' : 'reativar'} label="" onClick={() => void alternar(t)} />
                </>
              )
        }
        vazioTitulo="Nenhum contratante encontrado" // troca
        vazioDescricao="Ajuste os filtros ou cadastre o primeiro."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
