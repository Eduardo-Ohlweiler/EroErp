import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import {
  TAuditoria,
  TBadge,
  TButton,
  TCol,
  TCombo,
  TCor,
  TDBCombo,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRow,
  useMessage,
  useSomenteLeitura,
} from '../../../design-system/kit';
import { chaveDaSelecao, selecionarTipos } from '../../../shared/api/auxiliares';
import { ROTULO_CADASTROS, useUsuarioAtual } from '../../../shared/sessao';
import { AUSENTE, formatarData, formatarDocumento, mascararCep } from '../../../shared/util/format';
import { pessoasApi, rotuloDaPessoa, type PessoaResponse } from '../../pessoas/api/pessoas';
import { PessoaRapidaModal } from '../../pessoas/components/PessoaRapidaModal';
import { filiaisApi, rotuloDaFilial, TIPO_FILIAL_OPCOES } from '../api/filiais';
import { paraCorpo, paraForm, schema, VAZIO, type Dados } from '../schemas/filial';

/** Cópia do modelo Form (docs/07 §4.2), a partir do PessoaForm (o TDBCombo com `acao` e o cadastro rápido). Difere dele só no que é `// troca`. */

const LISTA = '/cadastros/filiais'; // troca
const PESSOAS = '/cadastros/pessoas'; // troca: a ficha da pessoa, no painel "Dados da pessoa"

const AJUDA_DO_TIPO = {
  MATRIZ: 'Um negócio próprio. Pode haver mais de uma matriz.',
  FILIAL: 'Responde a uma matriz.',
} as const;

/** O que o painel "Dados da pessoa" mostra de um campo vazio. */
const ou = (valor?: string | null) => (valor && valor.trim() !== '' ? valor : AUSENTE);

/** O endereço principal da pessoa, ou o primeiro. */
const enderecoDe = (p: PessoaResponse) => p.enderecos.find((e) => e.principal) ?? p.enderecos[0];

export function FilialForm() {
  // troca
  const { id } = useParams();
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('FILIAIS'); // troca: grupo FILIAIS
  const escrevePessoas = !useSomenteLeitura('PESSOAS'); // troca: o cadastro rápido de pessoa
  const lePessoas = useUsuarioAtual().permissoes.includes('PESSOAS_LER'); // troca: combo de pessoa e painel
  const msg = useMessage();
  const queryClient = useQueryClient();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }); // troca: o schema espelha o Create/UpdateDto
  const [rapida, setRapida] = useState(false); // troca: o modal de cadastro rápido de pessoa
  const [criada, setCriada] = useState<{ id: string; rotulo: string }>(); // troca: a pessoa que o cadastro rápido acabou de gravar
  const salvo = useQuery({ queryKey: ['filiais', id], queryFn: () => filiaisApi.buscar(id!), enabled: !!id }); // troca

  const podeCadastrarPessoa = !somenteLeitura && escrevePessoas;
  // troca: os tipos que o cadastro rápido usa (só carrega quem pode abrir o modal)
  const tiposCadastro = useQuery({
    queryKey: chaveDaSelecao('tipos-cadastro'),
    queryFn: () => selecionarTipos('tipos-cadastro'),
    enabled: podeCadastrarPessoa,
  });
  const tiposTelefone = useQuery({
    queryKey: chaveDaSelecao('tipos-telefone'),
    queryFn: () => selecionarTipos('tipos-telefone'),
    enabled: podeCadastrarPessoa,
  });

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

  // troca: trocar para Matriz limpa a matriz (a matriz não responde a outra)
  useEffect(() => {
    const sub = form.watch((_valores, { name }) => {
      if (name !== 'tipo' || form.getValues('tipo') !== 'MATRIZ') return;
      form.setValue('matrizId', '', { shouldDirty: true });
      form.clearErrors('matrizId');
    });
    return () => sub.unsubscribe();
  }, [form]);

  const pessoaId = form.watch('pessoaId');
  const tipo = form.watch('tipo');
  const matrizId = form.watch('matrizId');

  // troca: os dados da pessoa, em leitura, no mesmo cache do PessoaForm (só com PESSOAS_LER)
  const pessoa = useQuery({
    queryKey: ['pessoas', pessoaId],
    queryFn: () => pessoasApi.buscar(pessoaId),
    enabled: lePessoas && !!pessoaId,
  });

  const salvar = async (d: Dados) => {
    try {
      const f = id
        ? await filiaisApi.alterar(id, { ...paraCorpo(d), version: salvo.data!.version }) // troca — 409 se outra pessoa salvou antes
        : await filiaisApi.criar(paraCorpo(d)); // troca
      msg.sucesso('Filial salva'); // troca
      await queryClient.invalidateQueries({ queryKey: ['filiais'] });
      navigate(`${LISTA}/${f.id}`);
    } catch (e) {
      msg.erroApi(e, form); // 400 e 409 com erros → campo (pessoaId, matrizId, tipo, cor); 409 de versão → Recarregar
    }
  };
  const novo = () => (id ? navigate(`${LISTA}/novo`) : form.reset(VAZIO));

  // troca: os combos. Pessoa pelo /api/pessoas/selecao (PESSOAS_LER); matriz só entre as matrizes ativas, sem a própria filial
  const buscarPessoas = async (termo?: string) =>
    (await pessoasApi.selecionar(termo)).map((p) => ({ id: p.id, nome: rotuloDaPessoa(p) }));
  const buscarMatrizes = async (termo?: string) =>
    (await filiaisApi.selecionar(termo, 'MATRIZ', id)).map((m) => ({ id: m.id, nome: rotuloDaFilial(m), cor: m.cor }));
  const pessoaCriada = (nova: PessoaResponse) => {
    setCriada({ id: nova.id, rotulo: rotuloDaPessoa(nova) });
    form.setValue('pessoaId', nova.id, { shouldDirty: true, shouldValidate: true });
    void queryClient.invalidateQueries({ queryKey: ['pessoas'] });
    setRapida(false);
  };

  // troca: sem FILIAIS_ESCREVER não há cadastro novo
  if (!id && somenteLeitura) return <Navigate to={LISTA} replace />;

  const daFilial = salvo.data;
  const pessoaDaFilial = daFilial && daFilial.pessoa.id === pessoaId ? daFilial.pessoa : undefined;
  const rotuloDaPessoaEscolhida =
    criada?.id === pessoaId ? criada.rotulo : pessoaDaFilial ? rotuloDaPessoa(pessoaDaFilial) : undefined;
  const rotuloDaMatrizEscolhida = daFilial?.matriz && daFilial.matriz.id === matrizId ? rotuloDaFilial(daFilial.matriz) : undefined;
  const pessoaInativa = pessoaDaFilial ? !pessoaDaFilial.ativo : false;
  const ficha = pessoa.data;
  const endereco = ficha ? enderecoDe(ficha) : undefined;

  return (
    <TPage
      title={somenteLeitura ? 'Filial' : id ? 'Editar filial' : 'Nova filial'} // troca
      breadcrumb={[ROTULO_CADASTROS, 'Filiais', id ? (daFilial?.pessoa.nome ?? 'Editar') : 'Nova']} // troca
      coreografia="formulario"
      carregando={!inicial || (podeCadastrarPessoa && (tiposCadastro.isLoading || tiposTelefone.isLoading))}
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        {/* troca: campos, um por TRow, depois o painel */}
        <TRow>
          <TEntry label="Código" value={daFilial?.codFilial ?? ''} placeholder="Automático" disabled width="codigo" />
        </TRow>
        <TRow>
          <TDBCombo
            name="pessoaId"
            label="Pessoa"
            required
            autoFocus={!somenteLeitura}
            buscar={buscarPessoas}
            rotuloInicial={rotuloDaPessoaEscolhida}
            disabled={!lePessoas}
            ajuda={
              !lePessoas || pessoaInativa ? (
                <>
                  {!lePessoas && 'Escolher a pessoa exige acesso a Pessoas.'}
                  {pessoaInativa && <TBadge tom="alerta">Pessoa inativa</TBadge>}
                </>
              ) : undefined
            }
            acao={
              podeCadastrarPessoa && (
                <TButton variant="novo" label="" aria-label="Cadastrar pessoa" title="Cadastrar pessoa" onClick={() => setRapida(true)} />
              )
            }
          />
        </TRow>
        <TRow>
          <TCombo name="tipo" label="Tipo" opcoes={TIPO_FILIAL_OPCOES} required ajuda={AJUDA_DO_TIPO[tipo]} />
        </TRow>
        {tipo === 'FILIAL' && (
          <TRow>
            <TDBCombo
              name="matrizId"
              label="Matriz"
              required
              buscar={buscarMatrizes}
              rotuloInicial={rotuloDaMatrizEscolhida}
              corInicial={daFilial?.matriz?.cor}
            />
          </TRow>
        )}
        <TRow>
          <TCor
            name="cor"
            label="Cor de identificação"
            required
            ajuda="Identifica a filial nas listas e nos combos das outras telas."
          />
        </TRow>

        {pessoaId && (
          <TPanel
            title="Dados da pessoa"
            subtitle={
              lePessoas
                ? 'CPF ou CNPJ, inscrições e endereço ficam no cadastro da pessoa.'
                : 'Você não tem acesso ao cadastro de Pessoas, onde ficam os dados desta filial.'
            }
            actions={
              lePessoas && (
                <TButton variant="secondary" icone={ExternalLink} label="Abrir em Pessoas" onClick={() => navigate(`${PESSOAS}/${pessoaId}`)} />
              )
            }
          >
            {ficha && (
              <>
                {ficha.tipoPessoa === 'FISICA' ? (
                  <TRow>
                    <TEntry label="CPF" value={ficha.cpf ? formatarDocumento(ficha.cpf) : AUSENTE} disabled width="cpf" />
                  </TRow>
                ) : (
                  <>
                    <TRow>
                      <TEntry label="CNPJ" value={ficha.cnpj ? formatarDocumento(ficha.cnpj) : AUSENTE} disabled width="cnpj" />
                    </TRow>
                    <TRow>
                      <TEntry label="Razão social" value={ficha.nome} disabled />
                    </TRow>
                    <TRow>
                      <TEntry label="Nome fantasia" value={ou(ficha.nomeFantasia)} disabled />
                    </TRow>
                    <TRow>
                      <TEntry label="Data de abertura" value={ficha.dataAbertura ? formatarData(ficha.dataAbertura) : AUSENTE} disabled width="data" />
                    </TRow>
                    <TRow>
                      <TEntry label="Inscrição estadual" value={ou(ficha.inscricaoEstadual)} disabled width="curto" />
                    </TRow>
                    <TRow>
                      <TEntry label="Inscrição municipal" value={ou(ficha.inscricaoMunicipal)} disabled width="curto" />
                    </TRow>
                  </>
                )}

                {endereco ? (
                  <>
                    <TRow>
                      <TEntry label="Rua" value={ou(endereco.rua)} disabled width="longo" />
                    </TRow>
                    {/* os campos do mesmo endereço ficam na mesma linha (docs/07 §1), cada um na sua TCol */}
                    <TRow>
                      <TCol width="auto">
                        <TEntry label="CEP" value={endereco.cep ? mascararCep(endereco.cep) : AUSENTE} disabled width="cep" />
                      </TCol>
                      <TCol width="auto">
                        <TEntry label="Número" value={ou(endereco.numero)} disabled width="curto" />
                      </TCol>
                      <TCol width="auto">
                        <TEntry label="Complemento" value={ou(endereco.complemento)} disabled width="curto" />
                      </TCol>
                    </TRow>
                    <TRow>
                      <TCol width="auto">
                        <TEntry label="Bairro" value={ou(endereco.bairro)} disabled width="curto" />
                      </TCol>
                      <TCol width="auto">
                        <TEntry label="Cidade" value={ou(endereco.cidade.nome)} disabled width="medio" />
                      </TCol>
                      <TCol width="auto">
                        <TEntry label="UF" value={ou(endereco.cidade.uf)} disabled width="uf" />
                      </TCol>
                    </TRow>
                  </>
                ) : (
                  <TRow>
                    <TEntry label="Endereço" value="Nenhum endereço cadastrado" disabled />
                  </TRow>
                )}
              </>
            )}
          </TPanel>
        )}

        {/* Sem Situação: o FilialUpdateDto não recebe `ativo`; a Situação fica na grade (inativar e reativar). */}
        <TAuditoria registro={daFilial} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate(LISTA)} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      {/* Fora do TForm da filial: o modal tem o formulário dele (o submit de um não pode chegar ao outro). */}
      {podeCadastrarPessoa && (
        <PessoaRapidaModal
          aberto={rapida}
          onFechar={() => setRapida(false)}
          onCriada={pessoaCriada}
          tiposCadastro={tiposCadastro.data ?? []}
          tiposTelefone={tiposTelefone.data ?? []}
        />
      )}
    </TPage>
  );
}
