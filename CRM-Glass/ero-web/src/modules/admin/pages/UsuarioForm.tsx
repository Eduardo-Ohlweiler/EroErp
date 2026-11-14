import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type Path, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, LockKeyholeOpen } from 'lucide-react';
import {
  TAuditoria,
  TButton,
  TCheckBox,
  TCombo,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TModal,
  TPage,
  TPanel,
  TRadio,
  TRow,
  useMessage,
  useSomenteLeitura,
} from '../../../design-system/kit';
import { api } from '../../../shared/api/cliente';
import { ErroApi } from '../../../shared/api/erros';
import { ehAdministrador, ROTULO_ADMINISTRATIVO, useSessao, useUsuarioAtual } from '../../../shared/sessao';
import { formatarDataHora } from '../../../shared/util/format';
import { gerarSenhaTemporaria } from '../../../shared/util/senha';
import { permissoesApi } from '../api/permissoes';
import { usuariosApi } from '../api/usuarios';
import {
  acessoMudou,
  dadosMudaram,
  DICA_SO_O_QUE_TEM,
  estaBloqueado,
  meuNivel,
  opcoesDeNivel,
  opcoesDePapel,
  paraCorpo,
  paraCorpoCriacao,
  paraForm,
  paraLiberacoes,
  schemaCriacao,
  schemaEdicao,
  senhaTemporariaSchema,
  situacaoDoUsuario,
  vazio,
  type DadosUsuario,
} from '../schemas/usuario';

/** Cópia do modelo Form (docs/07 §4.2), a partir do ContratanteForm. Difere dele só no que é `// troca`. */

const LISTA = '/admin/usuarios'; // troca

// troca: o modal "Redefinir senha" (UsuarioRedefinirSenhaDto)
const redefinirSchema = z.object({ novaSenha: senhaTemporariaSchema });
type DadosRedefinir = z.infer<typeof redefinirSchema>;

export function UsuarioForm() {
  // troca
  const { id } = useParams();
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('USUARIOS'); // troca: grupo USUARIOS (sem USUARIOS_ESCREVER)
  const msg = useMessage();
  const queryClient = useQueryClient();
  // troca: quem sou eu decide o que fica só leitura (conforto: quem barra é a API — docs/04)
  const eu = useUsuarioAtual();
  const { atualizarEu } = useSessao();
  const souAdministrador = ehAdministrador(eu);
  const podeLiberar = eu.permissoes.includes('USUARIOS_LIBERAR_ACESSO');
  const ehEuMesmo = !!id && id === eu.id;

  const form = useForm<DadosUsuario>({
    // troca: o schema espelha o UsuarioCreateDto (com a senha temporária) e o UsuarioUpdateDto, mais as liberações
    resolver: zodResolver(id ? schemaEdicao : schemaCriacao) as unknown as Resolver<DadosUsuario>,
    defaultValues: vazio([]),
  });
  const salvo = useQuery({ queryKey: ['usuarios', id], queryFn: () => usuariosApi.buscar(id!), enabled: !!id }); // troca
  // troca: catálogo de grupos e as liberações do usuário (painel "Acesso aos módulos")
  const catalogo = useQuery({ queryKey: ['permissoes', 'catalogo'], queryFn: permissoesApi.catalogo, staleTime: Infinity });
  const acesso = useQuery({
    queryKey: ['permissoes', 'usuarios', id],
    queryFn: () => permissoesApi.doUsuario(id!),
    enabled: !!id,
  });

  /** O que foi lido: base do `reset` e da comparação do Salvar (o que mudou é o que grava). */
  const inicial = useMemo(() => {
    if (!catalogo.data) return undefined;
    if (!id) return vazio(catalogo.data);
    return salvo.data && acesso.data ? paraForm(salvo.data, acesso.data, catalogo.data) : undefined;
  }, [id, catalogo.data, salvo.data, acesso.data]);

  useEffect(() => {
    if (inicial) form.reset(inicial);
  }, [inicial, form]);

  // Registro que não existe (ou de outro contratante, que a API devolve como 404): avisa e volta à lista.
  const erroAoCarregar = salvo.error ?? acesso.error ?? catalogo.error;
  useEffect(() => {
    if (!erroAoCarregar) return;
    msg.erroApi(erroAoCarregar);
    navigate(LISTA, { replace: true });
  }, [erroAoCarregar, msg, navigate]);

  // troca: grupo em "Sem acesso" desmarca as ações dele (a caixa fica desabilitada e não iria para a API).
  useEffect(() => {
    const sub = form.watch((valores, { name }) => {
      if (!name?.startsWith('niveis.')) return;
      const grupo = name.slice('niveis.'.length);
      if (valores.niveis?.[grupo] !== 'NENHUM') return;
      for (const a of catalogo.data?.find((g) => g.codigo === grupo)?.acoes ?? []) {
        if (valores.acoes?.[a.codigo]) form.setValue(`acoes.${a.codigo}` as Path<DadosUsuario>, false, { shouldDirty: true });
      }
    });
    return () => sub.unsubscribe();
  }, [form, catalogo.data]);

  // troca: o que cada painel deixa fazer
  const alvoAdmin = salvo.data?.papel === 'ADMIN';
  const dadosSoLeitura = somenteLeitura || (!souAdministrador && alvoAdmin);
  const acessoSoLeitura = !podeLiberar || ehEuMesmo;
  // A tela inteira só leitura quando nenhum painel grava (sem ESCREVER e sem LIBERAR_ACESSO, ou um administrador
  // aberto por quem não pode mexer nele): some o Salvar e entra a faixa de só leitura do TForm.
  const formSoLeitura = dadosSoLeitura && (acessoSoLeitura || alvoAdmin);
  const papel = form.watch('papel');
  const niveis = form.watch('niveis');
  const agora = api.agoraServidor();

  const invalidar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
      queryClient.invalidateQueries({ queryKey: ['permissoes', 'usuarios'] }),
    ]);

  // troca: duas gravações em cadeia — dados (POST/PUT) e acesso (PUT das liberações com a version nova)
  const salvar = async (d: DadosUsuario) => {
    if (!inicial || !catalogo.data) return;
    const gravarDados = !dadosSoLeitura && (!id || dadosMudaram(d, inicial));
    const gravarAcesso = !acessoSoLeitura && d.papel === 'USUARIO' && acessoMudou(d, inicial, catalogo.data);
    if (!gravarDados && !gravarAcesso) {
      msg.info('Nada mudou para salvar');
      return;
    }

    let alvoId = id;
    let version = acesso.data?.version ?? salvo.data?.version;
    if (gravarDados) {
      try {
        const u = id
          ? await usuariosApi.alterar(id, { ...paraCorpo(d), version: salvo.data!.version }) // 409 se outra pessoa salvou antes
          : await usuariosApi.criar(paraCorpoCriacao(d));
        alvoId = u.id;
        version = u.version;
      } catch (e) {
        msg.erroApi(e, form); // 400 e 409 com erros → campo; 409 sem erros → Recarregar; 422 → limite, último administrador
        return;
      }
      if (ehEuMesmo) void atualizarEu().catch(() => undefined); // o meu nome na barra
    }

    if (gravarAcesso && alvoId && version !== undefined) {
      try {
        await permissoesApi.substituir(alvoId, { ...paraLiberacoes(d, catalogo.data), version });
      } catch (e) {
        if (!gravarDados) {
          msg.erroApi(e, form);
          return;
        }
        await invalidar();
        msg.erro(`Dados salvos; o acesso não foi salvo: ${e instanceof ErroApi ? e.detail : 'tente de novo.'}`);
        navigate(`${LISTA}/${alvoId}`);
        return;
      }
    }

    msg.sucesso('Usuário salvo'); // troca
    await invalidar();
    navigate(`${LISTA}/${alvoId}`);
  };
  const novo = () => (id ? navigate(`${LISTA}/novo`) : inicial && form.reset(inicial));

  // troca: painel Segurança (só administrador, em outra pessoa)
  const [modalSenha, setModalSenha] = useState(false);
  const [desbloqueando, setDesbloqueando] = useState(false);
  const formSenha = useForm<DadosRedefinir>({ resolver: zodResolver(redefinirSchema), defaultValues: { novaSenha: '' } });
  const fecharModal = () => {
    setModalSenha(false);
    formSenha.reset({ novaSenha: '' });
  };
  const redefinir = async (d: DadosRedefinir) => {
    try {
      await usuariosApi.redefinirSenha(id!, d.novaSenha);
      msg.sucesso('Senha redefinida', 'A pessoa troca a senha temporária no próximo acesso.');
      fecharModal();
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    } catch (e) {
      msg.erroApi(e, formSenha);
    }
  };
  const desbloquear = async () => {
    setDesbloqueando(true);
    try {
      await usuariosApi.desbloquear(id!);
      msg.sucesso('Usuário desbloqueado');
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    } catch (e) {
      msg.erroApi(e);
    } finally {
      setDesbloqueando(false);
    }
  };

  // troca: sem USUARIOS_ESCREVER não há cadastro novo
  if (!id && somenteLeitura) return <Navigate to={LISTA} replace />;

  const bloqueado = !!salvo.data && estaBloqueado(salvo.data, agora);

  return (
    <TPage
      title={formSoLeitura ? 'Usuário' : id ? 'Editar usuário' : 'Novo usuário'} // troca
      breadcrumb={[ROTULO_ADMINISTRATIVO, 'Usuários', id ? (salvo.data?.nome ?? 'Editar') : 'Novo']} // troca
      coreografia="formulario"
      carregando={!inicial}
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={formSoLeitura}>
        {/* troca: campos, em painéis empilhados */}
        <TPanel title="Dados do usuário" somenteLeitura={dadosSoLeitura}>
          <TRow>
            <TEntry name="nome" label="Nome" required autoFocus={!dadosSoLeitura} maxLength={150} />
          </TRow>
          <TRow>
            <TEntry
              name="email"
              label="E-mail"
              type="email"
              required
              maxLength={255}
              disabled={!!id && !souAdministrador && !ehEuMesmo}
              ajuda="É para ele que vai o código de cada login"
            />
          </TRow>
          <TRow>
            <TEntry name="telefone" label="Telefone" mascara="celular" />
          </TRow>
          <TRow>
            <TCombo
              name="papel"
              label="Papel"
              opcoes={opcoesDePapel(souAdministrador, salvo.data?.papel)}
              required
              disabled={ehEuMesmo}
              ajuda={ehEuMesmo ? 'Você não pode alterar o próprio papel' : undefined}
            />
          </TRow>
          {!id && (
            <TRow>
              <TEntry
                name="senha"
                label="Senha temporária"
                type="password"
                required
                maxLength={128}
                autoComplete="new-password"
                ajuda="12 caracteres ou mais; ele troca no primeiro acesso"
                acao={
                  <TButton
                    variant="secondary"
                    label="Gerar"
                    onClick={() => form.setValue('senha', gerarSenhaTemporaria(), { shouldValidate: true, shouldDirty: true })}
                  />
                }
              />
            </TRow>
          )}
        </TPanel>

        {papel === 'ADMIN' ? (
          <TPanel title="Acesso aos módulos" subtitle="Administradores acessam todos os módulos.">
            {null}
          </TPanel>
        ) : (
          <TPanel
            title="Acesso aos módulos"
            subtitle={ehEuMesmo ? 'Você não pode alterar as próprias permissões.' : 'O que esta pessoa vê e altera em cada módulo.'}
            somenteLeitura={acessoSoLeitura}
          >
            {(catalogo.data ?? []).map((g) => (
              <AcessoDoGrupo
                key={g.codigo}
                codigo={g.codigo}
                rotulo={g.rotulo}
                acoes={g.acoes}
                limite={souAdministrador ? 'TUDO' : meuNivel(eu.permissoes, g.codigo)}
                nivel={niveis?.[g.codigo] ?? 'NENHUM'}
                minhasAcoes={souAdministrador ? null : eu.permissoes}
              />
            ))}
          </TPanel>
        )}

        {id && salvo.data && souAdministrador && !ehEuMesmo && (
          // troca: ação que não é salvar fica num TPanel próprio (docs/07 §4.2, item 6)
          <TPanel
            title="Segurança"
            actions={
              <>
                <TButton variant="secondary" icone={KeyRound} label="Redefinir senha" onClick={() => setModalSenha(true)} />
                {bloqueado && (
                  <TButton
                    variant="secondary"
                    icone={LockKeyholeOpen}
                    label="Desbloquear"
                    loading={desbloqueando}
                    onClick={() => void desbloquear()}
                  />
                )}
              </>
            }
          >
            <TRow>
              <TEntry label="Situação do acesso" value={situacaoDoUsuario(salvo.data, agora).texto} readOnly width="medio" />
            </TRow>
            <TRow>
              <TEntry label="Último acesso" value={formatarDataHora(salvo.data.ultimoLoginEm)} readOnly width="dataHora" />
            </TRow>
          </TPanel>
        )}

        {/* Sem Situação: o UsuarioUpdateDto não recebe `ativo` (docs/07 §0) — inativar e reativar ficam na grade. */}
        <TAuditoria registro={salvo.data} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            {!somenteLeitura && <TButton variant="novo" onClick={novo} />}
            <TButton variant="voltar" onClick={() => navigate(LISTA)} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      {/* troca: Redefinir senha */}
      <TModal
        aberto={modalSenha}
        titulo="Redefinir senha"
        descricao={`${salvo.data?.nome ?? 'A pessoa'} troca a senha temporária no próximo acesso.`}
        onFechar={fecharModal}
        bloquearFechar={formSenha.formState.isSubmitting}
      >
        <TForm form={formSenha} onSubmit={redefinir}>
          <TRow>
            <TEntry
              name="novaSenha"
              label="Senha temporária"
              type="password"
              required
              maxLength={128}
              width="longo"
              autoComplete="new-password"
              ajuda="12 caracteres ou mais"
              acao={
                <TButton
                  variant="secondary"
                  label="Gerar"
                  onClick={() => formSenha.setValue('novaSenha', gerarSenhaTemporaria(), { shouldValidate: true })}
                />
              }
            />
          </TRow>
          <TFormFooter>
            <TFormActionsLeft>
              <TButton variant="salvar" type="submit" loading={formSenha.formState.isSubmitting} />
              <TButton variant="voltar" label="Cancelar" onClick={fecharModal} />
            </TFormActionsLeft>
          </TFormFooter>
        </TForm>
      </TModal>
    </TPage>
  );
}

/**
 * Um grupo do catálogo no painel "Acesso aos módulos": o nível (Sem acesso · Ler · Ler e escrever) e uma caixa por
 * ação extra. Usuário comum só libera até o que ele mesmo tem (as opções de cima ficam desabilitadas, com a dica).
 */
function AcessoDoGrupo({
  codigo,
  rotulo,
  acoes,
  limite,
  nivel,
  minhasAcoes,
}: {
  codigo: string;
  rotulo: string;
  acoes: { codigo: string; rotulo: string }[];
  limite: ReturnType<typeof meuNivel> | 'TUDO';
  nivel: string;
  /** `null` = administrador (libera qualquer ação) */
  minhasAcoes: readonly string[] | null;
}) {
  return (
    <>
      <TRow>
        <TRadio name={`niveis.${codigo}`} label={rotulo} opcoes={opcoesDeNivel(limite)} />
      </TRow>
      {acoes.map((a) => {
        const naoTenho = minhasAcoes !== null && !minhasAcoes.includes(a.codigo);
        return (
          <TRow key={a.codigo}>
            <TCheckBox
              name={`acoes.${a.codigo}`}
              label={a.rotulo}
              disabled={nivel === 'NENHUM' || naoTenho}
              ajuda={naoTenho ? DICA_SO_O_QUE_TEM : nivel === 'NENHUM' ? `Libere ${rotulo} antes` : undefined}
            />
          </TRow>
        );
      })}
    </>
  );
}
