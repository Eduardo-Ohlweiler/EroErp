import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut } from 'lucide-react';
import {
  TBadge,
  TButton,
  TDataGrid,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRadio,
  TRow,
  TTabPanel,
  TTabs,
  useMessage,
  useQuestion,
  type Coluna,
} from '../../../design-system/kit';
import { useSessao, useUsuarioAtual } from '../../../shared/sessao';
import { descreverAgente } from '../../../shared/util/agente';
import { AUSENTE, formatarDataHora } from '../../../shared/util/format';
import { contaApi, type Sessao } from '../api/conta';
import {
  DADOS_VAZIOS,
  paraCorpo,
  paraForm,
  schemaDados,
  schemaSenha,
  SENHA_VAZIA,
  TEMA_DO_CONTRATANTE,
  TEMA_OPCOES,
  temaParaApi,
  type DadosConta,
  type DadosSenha,
} from '../schemas/conta';

/**
 * Minha conta: Form com abas (docs/07 §4.2, "formulário grande demais para painéis usa TTabs"). Cada aba grava na sua
 * rota, com o seu Salvar; o `useForm` de cada uma mora aqui, fora do TTabPanel (só a aba ativa fica montada e o que
 * foi digitado sobrevive à troca). Sem guarda de tela: cada um só mexe no que é seu (docs/04 "Telas sem grupo").
 */
type Aba = 'dados' | 'senha' | 'sessoes';

export function MinhaContaPage() {
  const navigate = useNavigate();
  const eu = useUsuarioAtual();
  const { atualizarEu, trocarTemaPreferido } = useSessao();
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<Aba>('dados');

  const perfil = useQuery({ queryKey: ['conta', 'perfil'], queryFn: contaApi.perfil });
  const sessoes = useQuery({ queryKey: ['sessoes'], queryFn: contaApi.sessoes, enabled: aba === 'sessoes' });

  const formDados = useForm<DadosConta>({ resolver: zodResolver(schemaDados), defaultValues: DADOS_VAZIOS });
  const formSenha = useForm<DadosSenha>({ resolver: zodResolver(schemaSenha), defaultValues: SENHA_VAZIA });

  // O tema que vale é o da sessão (o botão claro/escuro da barra também o troca): entra no formulário sem apagar o
  // nome que esteja sendo digitado.
  const temaDaSessao = eu.temaPreferido ?? TEMA_DO_CONTRATANTE;
  useEffect(() => {
    if (perfil.data) formDados.reset(paraForm(perfil.data, eu.temaPreferido));
    // o tema acompanha no efeito de baixo; aqui só a carga do perfil
  }, [perfil.data, formDados]);
  useEffect(() => {
    formDados.resetField('tema', { defaultValue: temaDaSessao });
  }, [temaDaSessao, formDados]);

  useEffect(() => {
    if (!perfil.error) return;
    msg.erroApi(perfil.error);
    navigate('/', { replace: true });
  }, [perfil.error, msg, navigate]);

  /* ---------------- Meus dados: PUT do perfil → tema, se mudou → /eu de novo (o nome na barra, na hora) ---------------- */
  const salvarDados = async (d: DadosConta) => {
    if (!perfil.data) return;
    try {
      const novo = await contaApi.alterarPerfil(paraCorpo(d, perfil.data.version)); // 409 se um administrador salvou antes
      queryClient.setQueryData(['conta', 'perfil'], novo);
      const tema = temaParaApi(d.tema);
      if (tema !== (eu.temaPreferido ?? null)) await trocarTemaPreferido(tema);
      await atualizarEu();
      msg.sucesso('Dados salvos');
    } catch (e) {
      msg.erroApi(e, formDados, { recarregar: () => perfil.refetch() });
    }
  };

  /* ---------------- Senha ---------------- */
  const salvarSenha = async (d: DadosSenha) => {
    try {
      await contaApi.trocarSenha({ senhaAtual: d.senhaAtual, novaSenha: d.novaSenha });
      msg.sucesso('Senha alterada. As outras sessões foram encerradas.');
      formSenha.reset(SENHA_VAZIA);
      await queryClient.invalidateQueries({ queryKey: ['sessoes'] });
    } catch (e) {
      msg.erroApi(e, formSenha);
    }
  };

  /* ---------------- Sessões ---------------- */
  const [encerrando, setEncerrando] = useState<string>();
  const encerrar = async (s: Sessao) => {
    setEncerrando(s.id);
    try {
      await contaApi.encerrarSessao(s.id);
      msg.sucesso('Sessão encerrada');
      await queryClient.invalidateQueries({ queryKey: ['sessoes'] });
    } catch (e) {
      msg.erroApi(e);
    } finally {
      setEncerrando(undefined);
    }
  };
  const encerrarOutras = async () => {
    const ok = await confirmar({
      titulo: 'Encerrar as outras sessões?',
      mensagem: 'Os outros navegadores conectados à sua conta saem e precisam entrar de novo. Este continua.',
      confirmar: 'Encerrar as outras',
      variante: 'inativar',
    });
    if (!ok) return;
    try {
      await contaApi.encerrarOutras();
      msg.sucesso('As outras sessões foram encerradas');
      await queryClient.invalidateQueries({ queryKey: ['sessoes'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };
  const outras = (sessoes.data ?? []).filter((s) => !s.atual).length;

  const colunasSessoes: Coluna<Sessao>[] = [
    { chave: 'navegador', cabecalho: 'Navegador', principal: true, render: (s) => <span className="font-medium">{descreverAgente(s.userAgent)}</span> },
    { chave: 'ip', cabecalho: 'IP', className: 'w-px whitespace-nowrap tabular-nums', render: (s) => s.ip ?? AUSENTE },
    {
      chave: 'iniciada',
      cabecalho: 'Iniciada em',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (s) => formatarDataHora(s.iniciadaEm),
    },
    {
      chave: 'uso',
      cabecalho: 'Último uso',
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (s) => formatarDataHora(s.ultimoUsoEm),
    },
    {
      chave: 'atual',
      cabecalho: 'Sessão',
      className: 'w-px whitespace-nowrap',
      render: (s) =>
        s.atual ? (
          <TBadge tom="destaque" ponto>
            Este navegador
          </TBadge>
        ) : null,
    },
  ];

  const errosDados = Object.keys(formDados.formState.errors).length > 0;
  const errosSenha = Object.keys(formSenha.formState.errors).length > 0;

  return (
    <TPage
      title="Minha conta"
      subtitle="Seus dados, a sua senha e os navegadores conectados"
      coreografia="formulario"
      carregando={perfil.isLoading}
    >
      <TTabs
        label="Minha conta"
        ativa={aba}
        onChange={(id) => setAba(id as Aba)}
        abas={[
          { id: 'dados', rotulo: 'Meus dados', alerta: errosDados },
          { id: 'senha', rotulo: 'Senha', alerta: errosSenha },
          { id: 'sessoes', rotulo: 'Sessões' },
        ]}
      >
        <TTabPanel id="dados" rotulo="Meus dados">
          <TForm form={formDados} onSubmit={salvarDados}>
            <TRow>
              <TEntry name="nome" label="Nome" required maxLength={150} autoFocus />
            </TRow>
            <TRow>
              <TEntry name="telefone" label="Telefone" mascara="celular" />
            </TRow>
            <TRow>
              <TRadio name="tema" label="Tema" opcoes={TEMA_OPCOES} />
            </TRow>
            <TPanel title="Acesso" subtitle="O e-mail recebe o código de cada login: quem troca é o administrador." somenteLeitura>
              <TRow>
                <TEntry name="email" label="E-mail" type="email" />
              </TRow>
              <TRow>
                <TEntry name="contratante" label="Contratante" />
              </TRow>
              <TRow>
                <TEntry name="papel" label="Papel" width="situacao" />
              </TRow>
            </TPanel>
            <TFormFooter>
              <TFormActionsLeft>
                <TButton variant="salvar" type="submit" loading={formDados.formState.isSubmitting} />
              </TFormActionsLeft>
            </TFormFooter>
          </TForm>
        </TTabPanel>

        <TTabPanel id="senha" rotulo="Senha">
          <TForm form={formSenha} onSubmit={salvarSenha}>
            <TRow>
              <TEntry name="senhaAtual" label="Senha atual" type="password" required maxLength={128} autoComplete="current-password" />
            </TRow>
            <TRow>
              <TEntry
                name="novaSenha"
                label="Nova senha"
                type="password"
                required
                maxLength={128}
                autoComplete="new-password"
                ajuda="12 caracteres ou mais, sem o seu nome nem e-mail"
              />
            </TRow>
            <TRow>
              <TEntry name="confirmar" label="Confirmar a nova senha" type="password" required maxLength={128} autoComplete="new-password" />
            </TRow>
            <TFormFooter>
              <TFormActionsLeft>
                <TButton variant="salvar" type="submit" label="Alterar senha" loading={formSenha.formState.isSubmitting} />
              </TFormActionsLeft>
            </TFormFooter>
          </TForm>
        </TTabPanel>

        <TTabPanel id="sessoes" rotulo="Sessões">
          <TDataGrid
            rotulo="Sessões abertas"
            colunas={colunasSessoes}
            linhas={sessoes.data ?? []}
            chaveDe={(s) => s.id}
            carregando={sessoes.isFetching}
            erro={sessoes.error}
            onTentarDeNovo={() => void sessoes.refetch()}
            tituloCartao={(s) => descreverAgente(s.userAgent)}
            acoes={(s) =>
              s.atual ? null : (
                <TButton
                  variant="danger"
                  icone={LogOut}
                  label=""
                  aria-label={`Encerrar a sessão de ${descreverAgente(s.userAgent)}`}
                  title="Encerrar sessão"
                  loading={encerrando === s.id}
                  onClick={() => void encerrar(s)}
                />
              )
            }
            vazioTitulo="Nenhuma sessão aberta"
            vazioDescricao="As sessões aparecem aqui quando você entra em um navegador."
          />
          {outras > 0 && (
            // Rodapé de ações fora de um TForm (docs/07 §3.5)
            <TFormFooter>
              <TFormActionsLeft>
                <TButton variant="danger" icone={LogOut} label="Encerrar as outras" onClick={() => void encerrarOutras()} />
              </TFormActionsLeft>
            </TFormFooter>
          )}
        </TTabPanel>
      </TTabs>
    </TPage>
  );
}
