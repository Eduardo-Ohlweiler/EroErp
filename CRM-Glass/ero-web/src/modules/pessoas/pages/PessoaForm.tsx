import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TAuditoria,
  TBadge,
  TButton,
  TCheckBox,
  TCombo,
  TDate,
  TDBCombo,
  TEntry,
  TFieldList,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRadio,
  TRow,
  TTextArea,
  useMessage,
  useSomenteLeitura,
} from '../../../design-system/kit';
import { TrocaDeBlocos } from '../../../motion/coreografia';
import { ErroApi } from '../../../shared/api/erros';
import { chaveDaSelecao, opcoesDeTipo, selecionarTipos, type RecursoAuxiliar } from '../../../shared/api/auxiliares';
import { buscarCidades, consultarCep, rotuloDaCidade } from '../../../shared/api/localidade';
import { ROTULO_CADASTROS } from '../../../shared/sessao';
import { hojeIso } from '../../../shared/util/format';
import { PessoaRapidaModal } from '../components/PessoaRapidaModal';
import { pessoasApi, rotuloDaPessoa, type PessoaResponse } from '../api/pessoas';
import {
  CAMPOS_DA_FISICA,
  CAMPOS_DA_JURIDICA,
  criarSchema,
  NOVA_REDE_SOCIAL,
  NOVO_ENDERECO,
  NOVO_EMAIL,
  NOVO_TELEFONE,
  NOVO_VINCULO,
  opcoesDosTiposDeCadastro,
  paraCorpo,
  paraForm,
  SEXO_OPCOES,
  TIPO_PESSOA_OPCOES,
  TIPO_VINCULO_OPCOES,
  VAZIO,
  type Dados,
  type EmailForm,
  type EnderecoForm,
  type RedeSocialForm,
  type TelefoneForm,
  type VinculoForm,
} from '../schemas/pessoa';

/** Cópia do modelo Form (docs/07 §4.2), a partir do UsuarioForm (o modelo com painéis). Difere dele só no que é `// troca`. */

const LISTA = '/cadastros/pessoas'; // troca

/** Os tipos ativos de um cadastro auxiliar, para os combos (a mesma chave da seleção: salvar o auxiliar renova). */
function useTipos(recurso: RecursoAuxiliar) {
  return useQuery({ queryKey: chaveDaSelecao(recurso), queryFn: () => selecionarTipos(recurso) });
}

export function PessoaForm() {
  // troca
  const { id } = useParams();
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('PESSOAS'); // troca: grupo PESSOAS
  const msg = useMessage();
  const queryClient = useQueryClient();
  const schema = useMemo(() => criarSchema(id), [id]); // troca: a pessoa aberta não se vincula a si mesma
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }); // troca: o schema espelha o Create/UpdateDto
  const [rapida, setRapida] = useState<number | null>(null); // troca: a linha de vínculo que abriu o cadastro rápido
  const salvo = useQuery({ queryKey: ['pessoas', id], queryFn: () => pessoasApi.buscar(id!), enabled: !!id }); // troca

  // troca: as opções dos 5 tipos vêm dos cadastros auxiliares (só ativos; o inativo já gravado entra por `opcoesDeTipo`)
  const tiposCadastro = useTipos('tipos-cadastro');
  const tiposTelefone = useTipos('tipos-telefone');
  const tiposEmail = useTipos('tipos-email');
  const tiposEndereco = useTipos('tipos-endereco');
  const tiposRedeSocial = useTipos('tipos-rede-social');
  const tiposCarregando =
    tiposCadastro.isLoading || tiposTelefone.isLoading || tiposEmail.isLoading || tiposEndereco.isLoading || tiposRedeSocial.isLoading;

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

  // troca: Física ↔ Jurídica mostra só os campos do tipo escolhido, e trocar o tipo limpa os do outro bloco
  const tipo = form.watch('tipoPessoa');
  useEffect(() => {
    const sub = form.watch((_valores, { name }) => {
      if (name !== 'tipoPessoa') return;
      const saem = form.getValues('tipoPessoa') === 'FISICA' ? CAMPOS_DA_JURIDICA : CAMPOS_DA_FISICA;
      for (const campo of saem) {
        form.setValue(campo, VAZIO[campo], { shouldDirty: true });
        form.clearErrors(campo);
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  const salvar = async (d: Dados) => {
    try {
      const p = id
        ? await pessoasApi.alterar(id, { ...paraCorpo(d), version: salvo.data!.version }) // troca — 409 se outra pessoa salvou antes
        : await pessoasApi.criar(paraCorpo(d)); // troca
      msg.sucesso('Pessoa salva'); // troca
      await queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      navigate(`${LISTA}/${p.id}`);
    } catch (e) {
      msg.erroApi(e, form); // 400 e 409 com erros → campo (inclusive `telefones.0.numero`); 409 sem erros → Recarregar
    }
  };
  const novo = () => (id ? navigate(`${LISTA}/novo`) : form.reset(VAZIO));

  // troca: o CEP completo consulta o ViaCEP (pela API) e preenche cidade, rua e bairro. Rua e bairro só se estiverem
  // vazios ou ainda com o valor que o CEP anterior da mesma linha trouxe (não pisa no que a pessoa digitou).
  const cepAnterior = useRef(new Map<number, { rua: string; bairro: string }>());
  const completarCep = async (i: number, cep: string) => {
    const campo = <C extends keyof EnderecoForm>(c: C) => `enderecos.${i}.${c}` as const;
    form.clearErrors(campo('cep'));
    try {
      const r = await consultarCep(cep);
      if (r.cidade) {
        form.setValue(campo('cidadeId'), r.cidade.id, { shouldDirty: true, shouldValidate: true });
        form.setValue(campo('cidadeRotulo'), rotuloDaCidade(r.cidade), { shouldDirty: true });
      }
      const anterior = cepAnterior.current.get(i);
      const rua = form.getValues(campo('rua'));
      const bairro = form.getValues(campo('bairro'));
      if (rua === '' || rua === anterior?.rua) form.setValue(campo('rua'), r.rua ?? '', { shouldDirty: true });
      if (bairro === '' || bairro === anterior?.bairro) form.setValue(campo('bairro'), r.bairro ?? '', { shouldDirty: true });
      cepAnterior.current.set(i, { rua: r.rua ?? '', bairro: r.bairro ?? '' });
      if (r.cepUnico) {
        msg.info('Este CEP é da cidade inteira', 'Preencha a rua e o bairro.');
        form.setFocus(campo('rua'));
      }
    } catch (e) {
      if (e instanceof ErroApi && [400, 404, 503].includes(e.status)) {
        form.setError(campo('cep'), { type: 'server', message: e.detail }); // 503: preencher à mão
      } else {
        msg.erroApi(e);
      }
    }
  };

  // troca: o combo de pessoa do vínculo (sem a própria pessoa) e o cadastro rápido, que devolve a pessoa criada à linha
  const buscarPessoas = async (termo?: string) =>
    (await pessoasApi.selecionar(termo, id)).map((p) => ({ id: p.id, nome: rotuloDaPessoa(p) }));
  const vincularCriada = (nova: PessoaResponse) => {
    if (rapida === null) return;
    const campo = <C extends keyof VinculoForm>(c: C) => `vinculos.${rapida}.${c}` as const;
    form.setValue(campo('pessoaRotulo'), rotuloDaPessoa(nova), { shouldDirty: true });
    form.setValue(campo('pessoaAtiva'), true, { shouldDirty: true });
    form.setValue(campo('pessoaId'), nova.id, { shouldDirty: true, shouldValidate: true });
    setRapida(null);
  };

  // troca: sem PESSOAS_ESCREVER não há cadastro novo
  if (!id && somenteLeitura) return <Navigate to={LISTA} replace />;

  const marcados = form.watch('tiposCadastroIds');
  const opcoesTipoCadastro = opcoesDosTiposDeCadastro(tiposCadastro.data ?? [], salvo.data?.tiposCadastro ?? [], marcados ?? []);
  const opcoesTelefone = opcoesDeTipo(tiposTelefone.data ?? [], salvo.data?.telefones.map((t) => t.tipo));
  const opcoesEmail = opcoesDeTipo(tiposEmail.data ?? [], salvo.data?.emails.map((e) => e.tipo));
  const opcoesEndereco = opcoesDeTipo(tiposEndereco.data ?? [], salvo.data?.enderecos.map((e) => e.tipo));
  const opcoesRedeSocial = opcoesDeTipo(tiposRedeSocial.data ?? [], salvo.data?.redesSociais.map((r) => r.tipo));
  const fisica = tipo === 'FISICA';

  return (
    <TPage
      title={somenteLeitura ? 'Pessoa' : id ? 'Editar pessoa' : 'Nova pessoa'} // troca
      breadcrumb={[ROTULO_CADASTROS, 'Pessoas', id ? (salvo.data?.nome ?? 'Editar') : 'Nova']} // troca
      coreografia="formulario"
      carregando={!inicial || tiposCarregando}
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        {/* troca: campos, um por TRow, depois os painéis */}
        <TRow>
          <TEntry label="Código" value={salvo.data?.codPessoa ?? ''} placeholder="Automático" disabled width="codigo" />
        </TRow>
        <TRow>
          <TRadio name="tipoPessoa" label="Tipo de pessoa" opcoes={TIPO_PESSOA_OPCOES} required />
        </TRow>
        <TRow>
          <TEntry name="nome" label={fisica ? 'Nome' : 'Razão social'} required autoFocus={!somenteLeitura} maxLength={255} />
        </TRow>

        <TrocaDeBlocos chave={tipo}>
          {fisica ? (
            <>
              <TRow>
                <TEntry name="cpf" label="CPF" mascara="cpf" />
              </TRow>
              <TRow>
                <TEntry name="rg" label="RG" maxLength={20} width="cpf" />
              </TRow>
              <TRow>
                <TDate name="dataNascimento" label="Data de nascimento" max={hojeIso()} />
              </TRow>
              <TRow>
                <TRadio name="sexo" label="Sexo" opcoes={SEXO_OPCOES} vazio="Não informado" />
              </TRow>
            </>
          ) : (
            <>
              <TRow>
                <TEntry name="nomeFantasia" label="Nome fantasia" maxLength={255} />
              </TRow>
              <TRow>
                <TEntry name="cnpj" label="CNPJ" mascara="cnpj" />
              </TRow>
              <TRow>
                <TEntry name="inscricaoEstadual" label="Inscrição estadual" maxLength={20} width="curto" />
              </TRow>
              <TRow>
                <TEntry name="inscricaoMunicipal" label="Inscrição municipal" maxLength={20} width="curto" />
              </TRow>
            </>
          )}
        </TrocaDeBlocos>

        <TPanel title="Classificação">
          <TRow>
            <TCheckBox name="tiposCadastroIds" label="Tipos de cadastro" opcoes={opcoesTipoCadastro} required />
          </TRow>
          <TRow>
            <TTextArea name="observacao" label="Observação" maxLength={500} />
          </TRow>
        </TPanel>

        <TPanel title="Telefones">
          <TFieldList<TelefoneForm>
            name="telefones"
            principal="principal"
            rotuloAdicionar="Acrescentar telefone"
            vazio="Nenhum telefone."
            rotuloLinha={(i) => `Telefone ${i + 1}`}
            novaLinha={NOVO_TELEFONE}
            colunas={[
              { name: 'tipoId', componente: (campo) => <TCombo name={campo} label="Tipo" required opcoes={opcoesTelefone} /> },
              { name: 'numero', componente: (campo) => <TEntry name={campo} label="Número" mascara="telefone" required /> },
              { name: 'observacao', dividir: true, componente: (campo) => <TEntry name={campo} label="Observação" maxLength={255} /> },
            ]}
          />
        </TPanel>

        <TPanel title="E-mails">
          <TFieldList<EmailForm>
            name="emails"
            principal="principal"
            rotuloAdicionar="Acrescentar e-mail"
            vazio="Nenhum e-mail."
            rotuloLinha={(i) => `E-mail ${i + 1}`}
            novaLinha={NOVO_EMAIL}
            colunas={[
              { name: 'tipoId', componente: (campo) => <TCombo name={campo} label="Tipo" required opcoes={opcoesEmail} /> },
              { name: 'email', dividir: true, componente: (campo) => <TEntry name={campo} label="E-mail" type="email" required maxLength={255} /> },
              { name: 'observacao', dividir: true, componente: (campo) => <TEntry name={campo} label="Observação" maxLength={255} /> },
            ]}
          />
        </TPanel>

        <TPanel title="Redes sociais">
          <TFieldList<RedeSocialForm>
            name="redesSociais"
            rotuloAdicionar="Acrescentar rede social"
            vazio="Nenhuma rede social."
            rotuloLinha={(i) => `Rede social ${i + 1}`}
            novaLinha={NOVA_REDE_SOCIAL}
            colunas={[
              { name: 'tipoId', componente: (campo) => <TCombo name={campo} label="Rede" required opcoes={opcoesRedeSocial} /> },
              { name: 'usuario', componente: (campo) => <TEntry name={campo} label="Usuário" maxLength={255} width="curto" /> },
              { name: 'url', dividir: true, componente: (campo) => <TEntry name={campo} label="Link" maxLength={500} /> },
            ]}
          />
        </TPanel>

        <TPanel title="Endereços">
          <TFieldList<EnderecoForm>
            name="enderecos"
            principal="principal"
            rotuloAdicionar="Acrescentar endereço"
            vazio="Nenhum endereço."
            rotuloLinha={(i) => `Endereço ${i + 1}`}
            novaLinha={NOVO_ENDERECO}
            colunas={[
              [{ name: 'tipoId', componente: (campo) => <TCombo name={campo} label="Tipo" required opcoes={opcoesEndereco} /> }],
              [
                {
                  name: 'cep',
                  componente: (campo, i) => <TEntry name={campo} label="CEP" mascara="cep" onCompletar={(cep) => void completarCep(i, cep)} />,
                },
                { name: 'numero', componente: (campo) => <TEntry name={campo} label="Número" maxLength={20} width="curto" /> },
                { name: 'complemento', componente: (campo) => <TEntry name={campo} label="Complemento" maxLength={100} width="curto" /> },
              ],
              [{ name: 'rua', componente: (campo) => <TEntry name={campo} label="Rua" maxLength={255} width="longo" /> }],
              [
                { name: 'bairro', componente: (campo) => <TEntry name={campo} label="Bairro" maxLength={100} width="curto" /> },
                {
                  name: 'cidadeId',
                  componente: (campo, _i, linha) => (
                    <TDBCombo name={campo} label="Cidade" required width="medio" buscar={buscarCidades} rotuloInicial={linha.cidadeRotulo} />
                  ),
                },
              ],
            ]}
          />
        </TPanel>

        <TPanel title="Vínculos">
          <TFieldList<VinculoForm>
            name="vinculos"
            rotuloAdicionar="Acrescentar vínculo"
            vazio="Nenhum vínculo."
            rotuloLinha={(i) => `Vínculo ${i + 1}`}
            novaLinha={NOVO_VINCULO}
            colunas={[
              {
                name: 'pessoaId',
                componente: (campo, i, linha) => (
                  <TDBCombo
                    name={campo}
                    label="Pessoa"
                    required
                    width="medio"
                    buscar={buscarPessoas}
                    rotuloInicial={linha.pessoaRotulo}
                    ajuda={linha.pessoaAtiva ? undefined : <TBadge tom="alerta">Inativa</TBadge>}
                    acao={
                      !somenteLeitura && (
                        <TButton variant="novo" label="" aria-label="Cadastrar pessoa" title="Cadastrar pessoa" onClick={() => setRapida(i)} />
                      )
                    }
                  />
                ),
              },
              { name: 'tipo', componente: (campo) => <TCombo name={campo} label="É o quê desta pessoa" required opcoes={TIPO_VINCULO_OPCOES} /> },
              { name: 'observacao', dividir: true, componente: (campo) => <TEntry name={campo} label="Observação" maxLength={255} /> },
            ]}
          />
        </TPanel>

        {/* Sem Situação: a Situação fica na grade (inativar e reativar), como nos outros cadastros. */}
        <TAuditoria registro={salvo.data} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate(LISTA)} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      {/* Fora do TForm da pessoa: o modal tem o formulário dele (o submit de um não pode chegar ao outro). */}
      {!somenteLeitura && (
        <PessoaRapidaModal
          aberto={rapida !== null}
          onFechar={() => setRapida(null)}
          onCriada={vincularCriada}
          tiposCadastro={tiposCadastro.data ?? []}
          tiposTelefone={tiposTelefone.data ?? []}
        />
      )}
    </TPage>
  );
}
