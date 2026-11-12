import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Mail } from 'lucide-react';
import { Alerta, BarraAcoes, Button, CampoForm, Input, InputSenha } from '../../../design-system/ui';
import { Bloco } from '../../../motion/coreografia';
import { api } from '../../../shared/api/cliente';
import { ErroApi, textoPadrao } from '../../../shared/api/erros';
import { instanteMs, useSegundosRestantes } from '../../../shared/util/tempo';
import { authApi } from '../api/auth';
import { credenciaisSchema, type Credenciais } from '../schemas/login';
import { AvisoEtapa, CabecalhoEtapa, type Aviso, type DesafioAtivo } from './comum';

export type EtapaCredenciaisProps = {
  emailInicial: string;
  /** aviso trazido de outra etapa (código expirado, sessão expirada) */
  avisoInicial: Aviso | null;
  aoEnviarCodigo: (dados: { desafio: DesafioAtivo; email: string; senha: string }) => void;
};

/** Etapa 1: e-mail e senha. Com a senha certa, a API manda o código por e-mail. */
export function EtapaCredenciais({ emailInicial, avisoInicial, aoEnviarCodigo }: EtapaCredenciaisProps) {
  const [aviso, setAviso] = useState<Aviso | null>(avisoInicial);
  // 429: "Muitas tentativas" com contagem do Retry-After
  const [espera, setEspera] = useState<{ ate: number; segundos: number } | null>(null);
  const restante = useSegundosRestantes(espera?.ate ?? null);

  const form = useForm<Credenciais>({
    resolver: zodResolver(credenciaisSchema),
    defaultValues: { email: emailInicial, senha: '' },
  });
  const { register, handleSubmit, setError, setFocus, resetField, formState } = form;

  // Foco no primeiro campo que falta (voltando do código, o e-mail já está preenchido).
  useEffect(() => {
    setFocus(emailInicial ? 'senha' : 'email');
  }, [emailInicial, setFocus]);

  const entrar = useMutation({
    mutationFn: authApi.entrar,
    onSuccess: (r, dados) => {
      if (!r.requerDoisFatores || !r.desafioDoisFatores) {
        setAviso({ tom: 'perigo', texto: 'Recebemos uma resposta inesperada do servidor. Tente de novo em instantes.' });
        return;
      }
      const agora = api.agoraServidor();
      aoEnviarCodigo({
        email: dados.email,
        senha: dados.senha,
        desafio: {
          desafio: r.desafioDoisFatores,
          emailMascarado: r.emailMascarado ?? 'o seu e-mail',
          // Sem os horários (não deveria acontecer), vale o contrato: 10 min e 60 s.
          codigoExpiraEm: instanteMs(r.codigoExpiraEm, agora + 10 * 60_000),
          reenvioDisponivelEm: instanteMs(r.reenvioDisponivelEm, agora + 60_000),
        },
      });
    },
    onError: (e) => {
      if (!(e instanceof ErroApi)) {
        setAviso({ tom: 'perigo', texto: textoPadrao(0) });
        return;
      }
      if (e.status === 400) {
        let marcou = false;
        for (const { campo, mensagem } of e.erros) {
          if (campo === 'email' || campo === 'senha') {
            // foco no primeiro campo com erro
            setError(campo, { message: mensagem }, { shouldFocus: !marcou });
            marcou = true;
          }
        }
        if (!marcou) setAviso({ tom: 'perigo', texto: e.detail });
        return;
      }
      if (e.status === 401) {
        setAviso({ tom: 'perigo', texto: e.detail });
        resetField('senha');
        setFocus('senha');
        return;
      }
      if (e.status === 429 && e.retryAfter) {
        // O botão fica desabilitado durante a espera e perderia o foco: ele vai para a senha antes.
        setFocus('senha');
        setEspera({ ate: Date.now() + e.retryAfter * 1000, segundos: e.retryAfter });
        return;
      }
      // Nos demais erros o foco fica onde estava (no botão, que carregando continua focável, ou no campo).
      if (e.status === 429 || e.status === 503) {
        setAviso({ tom: 'aviso', texto: e.detail });
        return;
      }
      setAviso({ tom: 'perigo', texto: e.detail, correlationId: e.correlationId });
    },
  });

  const aguardando = restante > 0;
  const enviar = handleSubmit((dados) => {
    // O Button carregando já barra o clique e o submit; isto cobre o envio por outro caminho.
    if (aguardando || entrar.isPending) return;
    setAviso(null);
    setEspera(null);
    entrar.mutate(dados);
  });

  return (
    <>
      <CabecalhoEtapa titulo="Bem-vindo de volta">Entre com seu e-mail e senha.</CabecalhoEtapa>
      <form noValidate onSubmit={enviar} className="space-y-4">
        {aguardando ? (
          <Bloco>
            <Alerta tom="aviso">
              Muitas tentativas. Aguarde{' '}
              <span aria-hidden className="tabular-nums">
                {restante} s
              </span>
              {/* o leitor de tela ouve uma vez, sem a contagem a cada segundo */}
              <span className="sr-only">{espera?.segundos} segundos</span>.
            </Alerta>
          </Bloco>
        ) : (
          <AvisoEtapa aviso={aviso} />
        )}
        <CampoForm rotulo="E-mail" erro={formState.errors.email?.message}>
          <Input
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="voce@empresa.com.br"
            {...register('email')}
          />
        </CampoForm>
        <CampoForm rotulo="Senha" erro={formState.errors.senha?.message} dica="Esqueceu? Fale com o administrador.">
          <InputSenha autoComplete="current-password" {...register('senha')} />
        </CampoForm>
        <BarraAcoes className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            carregando={entrar.isPending}
            textoCarregando="Entrando…"
            disabled={aguardando}
          >
            Entrar <ArrowRight className="size-4" aria-hidden />
          </Button>
        </BarraAcoes>
      </form>
    </>
  );
}
