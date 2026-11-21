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
import { estadosCivisApi, type EstadoCivilResponse } from '../api/estadosCivis';
import { NOME_MAXIMO, paraCorpo, paraForm, schema, VAZIO, type Dados } from '../schemas/estadoCivil';

/** Cópia mecânica do modelo FormList (TipoCadastroFormList, docs/07 §4.3): só o nome, o recurso e a API mudam. */

const RECURSO = 'estados-civis'; // troca: recurso (queryKey; invalidar ['<recurso>'] renova a grade e os combos de Pessoas)
const GRUPO = 'CADASTROS_AUXILIARES'; // troca: nada nos 5 auxiliares (o mesmo grupo); outra tela de apoio troca pelo grupo dela
const NOME_PLURAL = 'Estados civis'; // troca: título e breadcrumb
const NOME_SINGULAR = 'estado civil'; // troca: nos textos ("Inativar estado civil?")
const POR_PAGINA = 20;
const ORDEM = 'nome,asc';

export function EstadoCivilFormList() {
  // troca: o nome do componente
  const somenteLeitura = useSomenteLeitura(GRUPO);
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const reduzir = useReduzirMovimento();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO });
  const [editando, setEditando] = useState<EstadoCivilResponse>(); // troca: tipo
  const [pagina, setPagina] = useState(0);

  const lista = useQuery({
    queryKey: [RECURSO, 'lista', pagina],
    queryFn: () => estadosCivisApi.listar({ page: pagina, size: POR_PAGINA, sort: ORDEM }), // troca: API (sem filtro, ativos e inativos)
    placeholderData: keepPreviousData,
  });

  const limpar = () => {
    setEditando(undefined);
    form.reset(VAZIO);
  };
  const renovar = () => queryClient.invalidateQueries({ queryKey: [RECURSO] });

  const editar = (t: EstadoCivilResponse) => {
    setEditando(t);
    form.reset(paraForm(t));
    window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' });
  };

  const salvar = async (d: Dados) => {
    try {
      if (editando) await estadosCivisApi.alterar(editando.id, { ...paraCorpo(d), version: editando.version }); // troca: API
      else await estadosCivisApi.criar(paraCorpo(d)); // troca: API
      msg.sucesso(`${NOME_SINGULAR[0].toUpperCase()}${NOME_SINGULAR.slice(1)} salvo`);
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

  const alternar = async (t: EstadoCivilResponse) => {
    const ok = await confirmar({
      titulo: t.ativo ? `Inativar ${NOME_SINGULAR}?` : `Reativar ${NOME_SINGULAR}?`,
      mensagem: t.ativo
        ? `Inativar ${t.nome}? Ele deixa de aparecer para escolha e continua nos cadastros que já o usam.`
        : `Reativar ${t.nome}? Ele volta a aparecer para escolha.`,
      variante: t.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (t.ativo ? estadosCivisApi.inativar(t.id) : estadosCivisApi.ativar(t.id)); // troca: API
      msg.sucesso(t.ativo ? `${t.nome} foi inativado` : `${t.nome} foi reativado`);
      if (editando?.id === t.id) limpar();
      await renovar();
    } catch (e) {
      msg.erroApi(e);
    }
  };

  const colunas: Coluna<EstadoCivilResponse>[] = [
    { chave: 'codigo', cabecalho: 'Código', numerica: true, className: 'w-px whitespace-nowrap', render: (t) => t.codigo },
    { chave: 'nome', cabecalho: 'Nome', principal: true, render: (t) => <span className="font-medium">{t.nome}</span> },
    {
      chave: 'origem',
      cabecalho: 'Origem',
      className: 'w-px whitespace-nowrap',
      render: (t) => <TBadge tom={t.sistema ? 'info' : 'neutro'}>{t.sistema ? 'Sistema' : 'Próprio'}</TBadge>,
    },
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
    <TPage title={NOME_PLURAL} breadcrumb={[ROTULO_CADASTROS, 'Auxiliares', NOME_PLURAL]} coreografia="formulario">
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TEntry label="Código" value={editando?.codigo ?? ''} placeholder="Automático" disabled width="codigo" />
        </TRow>
        <TRow>
          <TEntry name="nome" label="Nome" required maxLength={NOME_MAXIMO} autoFocus={!somenteLeitura} width="curto" />
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
        vazioTitulo={`Nenhum ${NOME_SINGULAR} cadastrado`}
        vazioDescricao="Preencha o nome acima e salve para cadastrar o primeiro."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
