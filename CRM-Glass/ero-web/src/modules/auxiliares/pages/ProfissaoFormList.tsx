import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TBadge,
  TButton,
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
} from '../../../design-system/kit';
import { useReduzirMovimento } from '../../../motion/reduzir';
import { ROTULO_CADASTROS } from '../../../shared/sessao';
import { profissoesApi, type ProfissaoResponse } from '../api/profissoes';
import { NOME_MAXIMO, paraCorpo, paraForm, schema, VAZIO, type Dados } from '../schemas/profissao';

/** Cópia mecânica do modelo FormList (EstadoCivilFormList, docs/07 §4.3): só o nome, o recurso e a API mudam. */

const RECURSO = 'profissoes'; // troca: recurso (queryKey; invalidar ['<recurso>'] renova a grade e os combos de Pessoas)
const GRUPO = 'CADASTROS_AUXILIARES'; // troca: nada nos auxiliares (o mesmo grupo); outra tela de apoio troca pelo grupo dela
const NOME_PLURAL = 'Profissões'; // troca: título e breadcrumb
const NOME_SINGULAR = 'profissão'; // troca: nos textos ("Inativar profissão?")
const POR_PAGINA = 20;
const ORDEM = 'nome,asc';

export function ProfissaoFormList() {
  // troca: o nome do componente
  const somenteLeitura = useSomenteLeitura(GRUPO);
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const reduzir = useReduzirMovimento();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO });
  const [editando, setEditando] = useState<ProfissaoResponse>(); // troca: tipo
  const [pagina, setPagina] = useState(0);

  const lista = useQuery({
    queryKey: [RECURSO, 'lista', pagina],
    queryFn: () => profissoesApi.listar({ page: pagina, size: POR_PAGINA, sort: ORDEM }), // troca: API (sem filtro, ativos e inativos)
    placeholderData: keepPreviousData,
  });

  const limpar = () => {
    setEditando(undefined);
    form.reset(VAZIO);
  };
  const renovar = () => queryClient.invalidateQueries({ queryKey: [RECURSO] });

  const editar = (t: ProfissaoResponse) => {
    setEditando(t);
    form.reset(paraForm(t));
    window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' });
  };

  const salvar = async (d: Dados) => {
    try {
      if (editando) await profissoesApi.alterar(editando.id, { ...paraCorpo(d), version: editando.version }); // troca: API
      else await profissoesApi.criar(paraCorpo(d)); // troca: API
      msg.sucesso(`${NOME_SINGULAR[0].toUpperCase()}${NOME_SINGULAR.slice(1)} salva`);
      limpar();
      setPagina(0);
      await renovar();
    } catch (e) {
      // 400 e 409 com `erros[campo=nome]` marcam o Nome; 409 sem `erros` oferece Recarregar (a grade traz a versão nova)
      msg.erroApi(e, form, {
        recarregar: () => {
          limpar();
          return renovar();
        },
      });
    }
  };

  const alternar = async (t: ProfissaoResponse) => {
    const ok = await confirmar({
      titulo: t.ativo ? `Inativar ${NOME_SINGULAR}?` : `Reativar ${NOME_SINGULAR}?`,
      mensagem: t.ativo
        ? `Inativar ${t.nome}? Ela deixa de aparecer para escolha e continua nos cadastros que já a usam.`
        : `Reativar ${t.nome}? Ela volta a aparecer para escolha.`,
      variante: t.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (t.ativo ? profissoesApi.inativar(t.id) : profissoesApi.ativar(t.id)); // troca: API
      msg.sucesso(t.ativo ? `${t.nome} foi inativada` : `${t.nome} foi reativada`);
      if (editando?.id === t.id) limpar();
      await renovar();
    } catch (e) {
      msg.erroApi(e);
    }
  };

  const colunas: Coluna<ProfissaoResponse>[] = [
    { chave: 'codigo', cabecalho: 'Código', numerica: true, className: 'w-px whitespace-nowrap', render: (t) => t.codigo },
    { chave: 'nome', cabecalho: 'Nome', principal: true, render: (t) => <span className="font-medium">{t.nome}</span> },
    {
      chave: 'origem',
      cabecalho: 'Origem',
      className: 'w-px whitespace-nowrap',
      render: (t) => <TBadge tom={t.sistema ? 'info' : 'neutro'}>{t.sistema ? 'Sistema' : 'Própria'}</TBadge>,
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (t) => (
        <TBadge tom={t.ativo ? 'sucesso' : 'erro'} ponto>
          {t.ativo ? 'Ativa' : 'Inativa'}
        </TBadge>
      ),
    },
  ];

  return (
    <TPage title={NOME_PLURAL} breadcrumb={[ROTULO_CADASTROS, 'Auxiliares', NOME_PLURAL]} coreografia="formulario">
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TEntry label="Código" value={editando?.codigo ?? ''} placeholder="Automático" disabled width="codigo" />
        </TRow>
        <TRow>
          <TEntry name="nome" label="Nome" required maxLength={NOME_MAXIMO} autoFocus={!somenteLeitura} width="metade" />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={limpar} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo={NOME_PLURAL}
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(t) => t.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        tituloCartao={(t) => t.nome}
        // Item do sistema (pré-cadastrado, imutável): sem Editar nem Inativar na linha. Só quem escreve tem ações.
        acoes={
          somenteLeitura
            ? undefined
            : (t) =>
                t.sistema ? null : (
                  <>
                    <TButton
                      variant="editar"
                      label=""
                      aria-label={`Editar ${t.nome}`}
                      title={`Editar ${t.nome}`}
                      onClick={() => editar(t)}
                    />
                    <TButton
                      variant={t.ativo ? 'inativar' : 'reativar'}
                      label=""
                      aria-label={`${t.ativo ? 'Inativar' : 'Reativar'} ${t.nome}`}
                      title={`${t.ativo ? 'Inativar' : 'Reativar'} ${t.nome}`}
                      onClick={() => void alternar(t)}
                    />
                  </>
                )
        }
        vazioTitulo={`Nenhuma ${NOME_SINGULAR} cadastrada`}
        vazioDescricao="Preencha o nome acima e salve para cadastrar a primeira."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
