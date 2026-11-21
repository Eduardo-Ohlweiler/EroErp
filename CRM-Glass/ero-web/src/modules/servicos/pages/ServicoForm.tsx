import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks } from 'lucide-react';
import {
  TAuditoria,
  TBadge,
  TButton,
  TDBCombo,
  TEntry,
  TFieldList,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRow,
  TTextArea,
  useMessage,
  useSomenteLeitura,
} from '../../../design-system/kit';
import { selecionarTipos } from '../../../shared/api/auxiliares';
import { ROTULO_CADASTROS } from '../../../shared/sessao';
import { filiaisApi, rotuloDaFilial, type FilialSelect } from '../../filiais/api/filiais';
import { servicosApi } from '../api/servicos';
import { CategoriaRapidaModal } from '../components/CategoriaRapidaModal';
import {
  DESCRICAO_MAXIMA,
  NOME_MAXIMO,
  paraCorpo,
  paraForm,
  schema,
  VAZIO,
  type Dados,
  type LinhaDeValor,
} from '../schemas/servico';

/** Cópia do modelo Form (docs/07 §4.2), a partir do FilialForm (o TDBCombo com `acao` e o cadastro rápido) e do TFieldList do PessoaForm. Difere dele só no que é `// troca`. */

const LISTA = '/cadastros/servicos'; // troca
const NOVA_LINHA: LinhaDeValor = { filialId: '', filialRotulo: '', filialCor: null, filialAtiva: true, preco: '' }; // troca: a linha de "Filiais e preços"

/** A linha que o "Todas as filiais" acrescenta: a filial ativa, sem preço (não informado). */
const linhaDaFilial = (f: FilialSelect): LinhaDeValor => ({
  filialId: f.id,
  filialRotulo: rotuloDaFilial(f),
  filialCor: f.cor,
  filialAtiva: true,
  preco: '',
});

export function ServicoForm() {
  // troca
  const { id } = useParams();
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('SERVICOS'); // troca: grupo SERVICOS
  const escreveCategorias = !useSomenteLeitura('CADASTROS_AUXILIARES'); // troca: o cadastro rápido de categoria
  const msg = useMessage();
  const queryClient = useQueryClient();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }); // troca: o schema espelha o Create/UpdateDto
  const [rapida, setRapida] = useState(false); // troca: o modal de cadastro rápido de categoria
  const [criada, setCriada] = useState<{ id: string; rotulo: string }>(); // troca: a categoria que o cadastro rápido acabou de gravar
  const [buscandoFiliais, setBuscandoFiliais] = useState(false); // troca: o "Todas as filiais"
  const salvo = useQuery({ queryKey: ['servicos', id], queryFn: () => servicosApi.buscar(id!), enabled: !!id }); // troca

  const inicial = useMemo(() => (id ? (salvo.data ? paraForm(salvo.data) : undefined) : VAZIO), [id, salvo.data]);
  useEffect(() => {
    if (inicial) form.reset(inicial);
  }, [inicial, form]);

  // Registro que não existe (ou de outro contratante, que a API devolve como 404): avisa e volta à lista.
  useEffect(() => {
    if (!salvo.error) return;
    msg.erroApi(salvo.error);
    navigate(LISTA, { replace: true });
  }, [salvo.error, msg, navigate]);

  const categoriaId = form.watch('categoriaId');

  const salvar = async (d: Dados) => {
    try {
      const s = id
        ? await servicosApi.alterar(id, { ...paraCorpo(d), version: salvo.data!.version }) // troca — 409 se outra pessoa salvou antes
        : await servicosApi.criar(paraCorpo(d)); // troca
      msg.sucesso('Serviço salvo'); // troca
      await queryClient.invalidateQueries({ queryKey: ['servicos'] });
      navigate(`${LISTA}/${s.id}`);
    } catch (e) {
      msg.erroApi(e, form); // 400 e 409 com erros → campo ou linha (nome, categoriaId, valores, valores.i.filialId, valores.i.valor); 409 de versão → Recarregar
    }
  };
  const novo = () => (id ? navigate(`${LISTA}/novo`) : form.reset(VAZIO));

  // troca: os combos. Categoria só entre as ativas (a salva inativa continua aparecendo pelo `rotuloInicial`); filial só entre as ativas e ainda fora das outras linhas
  const buscarCategorias = async () => (await selecionarTipos('categorias-servico')).map((c) => ({ id: c.id, nome: c.nome }));
  const buscarFiliaisLivres = (propria: string) => async (termo?: string) => {
    const usadas = new Set(form.getValues('valores').map((l) => l.filialId));
    return (await filiaisApi.selecionar(termo))
      .filter((f) => f.id === propria || !usadas.has(f.id))
      .map((f) => ({ id: f.id, nome: rotuloDaFilial(f), cor: f.cor }));
  };
  const categoriaCriada = (nova: { id: string; nome: string }) => {
    setCriada({ id: nova.id, rotulo: nova.nome });
    form.setValue('categoriaId', nova.id, { shouldDirty: true, shouldValidate: true });
    setRapida(false);
  };
  // troca: acrescenta as filiais ativas que ainda não estão na lista, sem preço
  const todasAsFiliais = async () => {
    setBuscandoFiliais(true);
    try {
      const todas = await filiaisApi.selecionar();
      const atuais = form.getValues('valores').filter((l) => l.filialId);
      const faltam = todas.filter((f) => !atuais.some((l) => l.filialId === f.id)).map(linhaDaFilial);
      if (faltam.length === 0) {
        msg.info('Todas as filiais ativas já estão na lista');
        return;
      }
      form.setValue('valores', [...atuais, ...faltam], { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    } catch (e) {
      msg.erroApi(e);
    } finally {
      setBuscandoFiliais(false);
    }
  };

  // troca: sem SERVICOS_ESCREVER não há cadastro novo
  if (!id && somenteLeitura) return <Navigate to={LISTA} replace />;

  const daServico = salvo.data;
  const podeCadastrarCategoria = !somenteLeitura && escreveCategorias;
  const categoriaSalva = daServico?.categoria && daServico.categoria.id === categoriaId ? daServico.categoria : undefined;
  const rotuloDaCategoriaEscolhida =
    criada?.id === categoriaId ? criada.rotulo : categoriaSalva ? `${categoriaSalva.nome}${categoriaSalva.ativo ? '' : ' (inativo)'}` : undefined;

  return (
    <TPage
      title={somenteLeitura ? 'Serviço' : id ? 'Editar serviço' : 'Novo serviço'} // troca
      breadcrumb={[ROTULO_CADASTROS, 'Serviços', id ? (daServico?.nome ?? 'Editar') : 'Novo']} // troca
      coreografia="formulario"
      carregando={!inicial}
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        {/* troca: campos, um por TRow, depois o painel */}
        <TRow>
          <TEntry label="Código" value={daServico?.codServico ?? ''} placeholder="Automático" disabled width="codigo" />
        </TRow>
        <TRow>
          <TEntry name="nome" label="Nome" required autoFocus={!somenteLeitura} maxLength={NOME_MAXIMO} />
        </TRow>
        <TRow>
          <TDBCombo
            name="categoriaId"
            label="Categoria"
            width="medio"
            vazio="Sem categoria"
            buscar={buscarCategorias}
            rotuloInicial={rotuloDaCategoriaEscolhida}
            acao={
              podeCadastrarCategoria && (
                <TButton variant="novo" label="" aria-label="Cadastrar categoria" title="Cadastrar categoria" onClick={() => setRapida(true)} />
              )
            }
          />
        </TRow>
        <TRow>
          <TEntry
            name="duracao"
            label="Duração"
            mascara="inteiro"
            suffix="min"
            width="quantidade"
            maxLength={4}
            ajuda="Em minutos. A agenda vai usar para reservar o horário."
          />
        </TRow>
        <TRow>
          <TTextArea name="descricao" label="Descrição" linhas={4} maxLength={DESCRICAO_MAXIMA} />
        </TRow>

        <TPanel title="Filiais e preços" subtitle="Onde o serviço é prestado. Preço vazio é não informado; 0 é gratuito.">
          <TFieldList<LinhaDeValor>
            name="valores"
            rotuloAdicionar="Acrescentar filial"
            vazio="Acrescente as filiais onde o serviço é prestado."
            rotuloLinha={(i) => `Filial ${i + 1}`}
            novaLinha={NOVA_LINHA}
            acoes={
              <TButton
                variant="secondary"
                size="sm"
                icone={ListChecks}
                label="Todas as filiais"
                loading={buscandoFiliais}
                onClick={() => void todasAsFiliais()}
              />
            }
            detalhe={(_i, linha) =>
              linha.filialId && !linha.filialAtiva ? (
                <p>
                  <TBadge tom="alerta">Filial inativa</TBadge>
                </p>
              ) : null
            }
            colunas={[
              {
                name: 'filialId',
                componente: (campo, _i, linha) => (
                  <TDBCombo
                    name={campo}
                    label="Filial"
                    required
                    width="medio"
                    buscar={buscarFiliaisLivres(linha.filialId)}
                    rotuloInicial={linha.filialRotulo || undefined}
                    corInicial={linha.filialCor}
                  />
                ),
              },
              { name: 'preco', componente: (campo) => <TEntry name={campo} label="Preço" mascara="moeda" placeholder="Não informado" /> },
            ]}
          />
        </TPanel>

        {/* Sem Situação: o ServicoUpdateDto não recebe `ativo`; a Situação fica na grade (inativar e reativar). */}
        <TAuditoria registro={daServico} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate(LISTA)} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      {/* Fora do TForm do serviço: o modal tem o formulário dele (o submit de um não pode chegar ao outro). */}
      {podeCadastrarCategoria && <CategoriaRapidaModal aberto={rapida} onFechar={() => setRapida(false)} onCriada={categoriaCriada} />}
    </TPage>
  );
}
