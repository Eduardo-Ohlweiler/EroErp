import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Palette } from 'lucide-react';
import { useAparencia } from '../../shared/aparencia/AparenciaProvider';
import { DESTAQUES } from '../../shared/aparencia/mapear';
import { formatarDataHora, formatarDocumento, paraNumero, textoDaMascara } from '../../shared/util/format';
import { Segmented } from '../ui/Bits';
import { Button } from '../ui/Button';
import {
  DocumentoLista,
  SITUACAO_OPCOES,
  TAcoesDeExportacao,
  TAuditoria,
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
  TPanel,
  TRow,
  useMessage,
  useQuestion,
  type Coluna,
  type ColunaExportavel,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '../kit';
import { contratantesDemo, type ContratanteDemo } from './kitDados';

/*
 * Os modelos List e Form do docs/07 §4.1 e §4.2, com Contratantes de mentira (kitDados.ts). São a mesma forma
 * que a tela de verdade vai copiar; só a navegação troca a rota por ?kit= (o catálogo fica numa rota só).
 *   /design-system?kit=lista · ?kit=novo · ?kit=editar&id=c2 · ?kit=leitura&id=c2
 */

export type ModeloKit = 'lista' | 'novo' | 'editar' | 'leitura';

function useIr() {
  const [, setParams] = useSearchParams();
  return useCallback((kit: ModeloKit | null, id?: string) => setParams(kit ? { kit, ...(id ? { id } : {}) } : {}), [setParams]);
}

/* ---------------- List (docs/07 §4.1) ---------------- */

type Filtros = { busca: string; ativo: string };
const FILTROS_VAZIOS: Filtros = { busca: '', ativo: 'true' };

const paraConsulta = (f: Filtros) => ({
  busca: f.busca.trim() || undefined,
  ativo: f.ativo === '' ? undefined : f.ativo === 'true',
});

const usuarios = (c: ContratanteDemo) => (c.limiteUsuarios ? `${c.usuariosAtivos} de ${c.limiteUsuarios}` : `${c.usuariosAtivos}`);

// Catálogo: `somenteLeitura` vem por prop para mostrar o modo; na tela real use `useSomenteLeitura()` (ou com o grupo).
export function ModeloLista({ somenteLeitura = false }: { somenteLeitura?: boolean }) {
  const ir = useIr();
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const form = useForm<Filtros>({ defaultValues: FILTROS_VAZIOS });
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<ContratanteDemo>>();

  const lista = useQuery({
    queryKey: ['ds-contratantes', 'lista', aplicados, pagina],
    queryFn: () => contratantesDemo.listar({ ...paraConsulta(aplicados), page: pagina, size: 10 }),
    placeholderData: keepPreviousData,
  });

  const filtrar = (f: Filtros) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    form.reset(FILTROS_VAZIOS);
    filtrar(FILTROS_VAZIOS);
  };

  const alternar = async (c: ContratanteDemo) => {
    const ok = await confirmar({
      mensagem: c.ativo
        ? `Inativar ${c.nome}? Ninguém dele consegue entrar e as sessões abertas caem.`
        : `Reativar ${c.nome}? Os usuários dele voltam a conseguir entrar.`,
      variante: c.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await contratantesDemo.alternar(c.id, !c.ativo);
      msg.sucesso(c.ativo ? `${c.nome} foi inativado` : `${c.nome} foi reativado`);
      await queryClient.invalidateQueries({ queryKey: ['ds-contratantes'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };

  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<ContratanteDemo>> => {
      const p = await contratantesDemo.listar({ ...paraConsulta(aplicados), page: indice, size: limite });
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados],
  );

  const colunasExportadas: ColunaExportavel<ContratanteDemo>[] = [
    { titulo: 'Nome', valor: (c) => c.nome },
    { titulo: 'Documento', semQuebra: true, valor: (c) => formatarDocumento(c.documento) },
    { titulo: 'E-mail', quebra: 'email', valor: (c) => c.email ?? '' },
    { titulo: 'Usuários', numerica: true, valor: usuarios },
    { titulo: 'Situação', valor: (c) => (c.ativo ? 'Ativo' : 'Inativo') },
    { titulo: 'Criado em', semQuebra: true, valor: (c) => formatarDataHora(c.createdAt) },
  ];

  const colunas: Coluna<ContratanteDemo>[] = [
    { chave: 'nome', cabecalho: 'Nome', principal: true, render: (c) => <span className="font-medium">{c.nome}</span> },
    { chave: 'documento', cabecalho: 'Documento', secundaria: true, className: 'w-px whitespace-nowrap tabular-nums', render: (c) => formatarDocumento(c.documento) },
    { chave: 'email', cabecalho: 'E-mail', secundaria: true, render: (c) => <span className="text-muted">{c.email ?? '—'}</span> },
    { chave: 'criado', cabecalho: 'Criado em', secundaria: true, className: 'w-px whitespace-nowrap tabular-nums', render: (c) => formatarDataHora(c.createdAt) },
    { chave: 'usuarios', cabecalho: 'Usuários', numerica: true, className: 'w-px whitespace-nowrap', render: usuarios },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (c) => (
        <TBadge tom={c.ativo ? 'sucesso' : 'erro'} ponto>
          {c.ativo ? 'Ativo' : 'Inativo'}
        </TBadge>
      ),
    },
  ];

  return (
    <TPage
      title="Contratantes"
      breadcrumb={['Administração', 'Contratantes']}
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Contratantes"
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(c) => c.id}
            filtros={[
              { rotulo: 'Nome ou documento', valor: aplicados.busca.trim() },
              { rotulo: 'Situação', valor: aplicados.ativo === 'true' ? 'Ativos' : aplicados.ativo === 'false' ? 'Inativos' : '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        <TRow>
          <TEntry name="busca" label="Nome ou documento" placeholder="Nome, CNPJ ou CPF" />
        </TRow>
        <TRow>
          <TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => ir('novo')} />}
            <TAcoesDeExportacao nome="Contratantes" colunas={colunasExportadas} carregar={carregarTudo} aoCarregarParaImprimir={setParaImprimir} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Contratantes"
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(c) => c.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        onLinhaClick={(c) => ir('editar', c.id)}
        tituloCartao={(c) => c.nome}
        acoes={
          somenteLeitura
            ? undefined
            : (c) => (
                <>
                  <TButton variant="editar" label="" onClick={() => ir('editar', c.id)} />
                  <TButton variant={c.ativo ? 'inativar' : 'reativar'} label="" onClick={() => void alternar(c)} />
                </>
              )
        }
        vazioTitulo="Nenhum contratante encontrado"
        vazioDescricao="Ajuste os filtros ou cadastre o primeiro."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}

/* ---------------- Form (docs/07 §4.2) ---------------- */

const limite = z.string().refine((v) => {
  const n = paraNumero(v);
  return n !== undefined && Number.isInteger(n) && n >= 1 && n <= 10000;
}, 'Informe de 1 a 10.000.');
const emailOpcional = z.union([z.literal(''), z.email('E-mail inválido.')]);

const schemaEdicao = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'No máximo 150 caracteres.'),
  documento: z.string(),
  email: emailOpcional,
  limiteUsuarios: limite,
  administrador: z.object({ nome: z.string(), email: z.string(), senha: z.string() }).optional(),
});
const schemaCriacao = schemaEdicao.extend({
  administrador: z.object({
    nome: z.string().trim().min(1, 'Informe o nome do administrador.'),
    email: z.email('E-mail inválido.'),
    senha: z.string().min(12, 'Use 12 ou mais caracteres.'),
  }),
});
type Dados = z.infer<typeof schemaEdicao>;

const VAZIO: Dados = { nome: '', documento: '', email: '', limiteUsuarios: '', administrador: { nome: '', email: '', senha: '' } };

const paraForm = (c: ContratanteDemo): Dados => ({
  nome: c.nome,
  documento: c.documento ?? '',
  email: c.email ?? '',
  limiteUsuarios: textoDaMascara(c.limiteUsuarios, 0),
  administrador: undefined,
});
const paraCorpo = (d: Dados) => ({
  nome: d.nome.trim(),
  documento: d.documento || null,
  email: d.email || null,
  limiteUsuarios: paraNumero(d.limiteUsuarios) ?? null,
});

// Catálogo: `somenteLeitura` vem por prop para mostrar o modo; na tela real use `useSomenteLeitura()` (ou com o grupo).
export function ModeloForm({ id, somenteLeitura = false }: { id?: string; somenteLeitura?: boolean }) {
  const ir = useIr();
  const msg = useMessage();
  const queryClient = useQueryClient();
  const form = useForm<Dados>({
    resolver: zodResolver(id ? schemaEdicao : schemaCriacao) as unknown as Resolver<Dados>,
    defaultValues: VAZIO,
  });
  const salvo = useQuery({ queryKey: ['ds-contratantes', id], queryFn: () => contratantesDemo.buscar(id!), enabled: !!id });

  useEffect(() => {
    if (salvo.data) form.reset(paraForm(salvo.data));
  }, [salvo.data, form]);

  const salvar = async (d: Dados) => {
    try {
      const c = id
        ? await contratantesDemo.alterar(id, { ...paraCorpo(d), version: salvo.data!.version })
        : await contratantesDemo.criar({ ...paraCorpo(d), administrador: d.administrador });
      msg.sucesso('Contratante salvo');
      await queryClient.invalidateQueries({ queryKey: ['ds-contratantes'] });
      ir('editar', c.id);
    } catch (e) {
      msg.erroApi(e, form);
    }
  };
  const novo = () => (id ? ir('novo') : form.reset(VAZIO));

  return (
    <TPage
      title={somenteLeitura ? 'Contratante' : id ? 'Editar contratante' : 'Novo contratante'}
      breadcrumb={['Administração', 'Contratantes', id ? (salvo.data?.nome ?? 'Editar') : 'Novo']}
      coreografia="formulario"
      carregando={salvo.isLoading}
      actions={
        id && !somenteLeitura ? (
          <TButton variant="secondary" icone={Palette} label="Configurar aparência" onClick={() => msg.info('Aparência: tela própria (ContratanteAparencia).')} />
        ) : undefined
      }
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow>
          <TEntry name="nome" label="Nome" required autoFocus={!somenteLeitura} />
        </TRow>
        <TRow>
          <TEntry name="documento" label="CNPJ ou CPF" mascara="cpfCnpj" ajuda="CNPJ alfanumérico aceito (ex.: 12.ABC.345/01DE-35)" />
        </TRow>
        <TRow>
          <TEntry name="email" label="E-mail" type="email" />
        </TRow>
        <TRow>
          <TEntry
            name="limiteUsuarios"
            label="Limite de usuários"
            mascara="inteiro"
            required
            ajuda={id ? `${salvo.data?.usuariosAtivos ?? 0} ativos hoje` : 'O administrador conta como um'}
          />
        </TRow>

        {!id && (
          <TPanel title="Administrador" subtitle="O primeiro acesso do contratante">
            <TRow>
              <TEntry name="administrador.nome" label="Nome" required />
            </TRow>
            <TRow>
              <TEntry name="administrador.email" label="E-mail" type="email" required ajuda='Teste o erro no campo com "usado@demo.com.br"' />
            </TRow>
            <TRow>
              <TEntry name="administrador.senha" label="Senha temporária" type="password" required ajuda="Ele troca no primeiro acesso" />
            </TRow>
          </TPanel>
        )}

        <TAuditoria registro={salvo.data} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => ir('lista')} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  );
}

/* ---------------- Moldura do catálogo ---------------- */

const MODELOS: { value: ModeloKit; label: string }[] = [
  { value: 'lista', label: 'List' },
  { value: 'novo', label: 'Form: novo' },
  { value: 'editar', label: 'Form: editar' },
  { value: 'leitura', label: 'Só leitura' },
];

/** Os modelos em tela cheia, com a barra do catálogo em cima (tema, destaque, modelo). */
export function ModelosDoKit({ modelo, id }: { modelo: ModeloKit; id?: string }) {
  const ir = useIr();
  const { alvo, set } = useAparencia();
  const idEfetivo = modelo === 'editar' || modelo === 'leitura' ? (id ?? 'c2') : undefined;
  return (
    <div className="relative z-10 px-3 md:px-8 pt-4 pb-16">
      <div className="mx-auto max-w-[1680px]">
        <div className="glass mb-6 flex flex-wrap items-center gap-2 p-2 !rounded-2xl">
          <Button size="sm" variant="ghost" onClick={() => ir(null)}>
            <ArrowLeft aria-hidden className="size-4" /> Catálogo
          </Button>
          <Segmented size="sm" className="max-w-full flex-wrap !rounded-2xl" options={MODELOS} value={modelo} onChange={(v) => ir(v, v === 'editar' || v === 'leitura' ? idEfetivo : undefined)} />
          <Segmented
            size="sm"
            options={[
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro' },
            ]}
            value={alvo.theme}
            onChange={(v) => set({ theme: v })}
          />
          <Segmented
            size="sm"
            className="max-w-full flex-wrap !rounded-2xl"
            options={DESTAQUES.map((d) => ({ value: d.id, label: d.nome }))}
            value={alvo.accent}
            onChange={(v) => set({ accent: v })}
          />
        </div>
        <main key={`${modelo}-${idEfetivo ?? ''}`}>
          {modelo === 'lista' ? <ModeloLista /> : <ModeloForm id={idEfetivo} somenteLeitura={modelo === 'leitura'} />}
        </main>
      </div>
    </div>
  );
}
