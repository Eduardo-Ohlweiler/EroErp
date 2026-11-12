import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { BarraAcoes, Button, CampoForm, OtpInput, useToast } from '../../../design-system/ui';
import { Bloco } from '../../../motion/coreografia';
import { api } from '../../../shared/api/cliente';
import { ErroApi, textoPadrao } from '../../../shared/api/erros';
import type { UsuarioLogado } from '../../../shared/api/tipos';
import { useSessao } from '../../../shared/sessao';
import { fmtMinSeg, instanteMs, useSegundosRestantes } from '../../../shared/util/tempo';
import { authApi } from '../api/auth';
import { reacaoAoVerificar } from '../api/respostas';
import { AvisoEtapa, CabecalhoEtapa, type Aviso, type DesafioAtivo } from './comum';

const TAMANHO = 6;
const ID_CODIGO = 'login-codigo';

export type EtapaCodigoProps = {
  desafio: DesafioAtivo;
  atualizarDesafio: (parcial: Partial<DesafioAtivo>) => void;
  /** sessão aberta (o usuário pode ter pendência de troca de senha) */
  aoEntrar: (usuario: UsuarioLogado) => void;
  /** volta às credenciais (com aviso quando o desafio não vale mais) */
  aoVoltar: (aviso: Aviso | null) => void;
};

/** Etapa 2: código de 6 dígitos enviado por e-mail. Vale 10 min desde o 1º envio; o reenvio manda o mesmo. */
export function EtapaCodigo({ desafio, atualizarDesafio, aoEntrar, aoVoltar }: EtapaCodigoProps) {
  const { entrar } = useSessao();
  const toast = useToast();
  const [codigo, setCodigo] = useState('');
  const [erroCodigo, setErroCodigo] = useState<string>();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [pedirFoco, setPedirFoco] = useState(0);

  const validade = useSegundosRestantes(desafio.codigoExpiraEm, api.agoraServidor);
  const reenvio = useSegundosRestantes(desafio.reenvioDisponivelEm, api.agoraServidor);

  const verificar = useMutation({
    mutationFn: async (dados: { desafio: string; codigo: string }) => entrar(await authApi.verificar(dados)),
    onSuccess: aoEntrar,
    onError: (e) => {
      const r = reacaoAoVerificar(e);
      if (r.tipo === 'recomecar') {
        aoVoltar({ tom: 'aviso', texto: r.mensagem });
        return;
      }
      if (r.tipo === 'codigo-invalido') {
        setCodigo('');
        setErroCodigo(r.mensagem);
      } else if (r.tipo === 'campo') {
        setErroCodigo(r.mensagem);
      } else {
        setAviso({ tom: r.tom, texto: r.mensagem, correlationId: r.correlationId });
      }
      // As casas ficam desabilitadas durante a verificação e perdem o foco: devolve a elas em todo erro.
      setPedirFoco((n) => n + 1);
    },
  });

  const reenviar = useMutation({
    mutationFn: authApi.reenviar,
    onSuccess: (r) => {
      const agora = api.agoraServidor();
      atualizarDesafio({
        emailMascarado: r.emailMascarado,
        codigoExpiraEm: instanteMs(r.codigoExpiraEm, desafio.codigoExpiraEm),
        reenvioDisponivelEm: instanteMs(r.reenvioDisponivelEm, agora + 60_000),
      });
      setAviso(null);
      setErroCodigo(undefined);
      setCodigo('');
      setPedirFoco((n) => n + 1);
      toast({ tone: 'success', title: 'Código reenviado.', description: `Confira a caixa de entrada de ${r.emailMascarado}.` });
    },
    onError: (e) => {
      if (!(e instanceof ErroApi)) {
        setAviso({ tom: 'perigo', texto: textoPadrao(0) });
        return;
      }
      if (e.status === 429) {
        // ainda não deu o intervalo: o botão volta a contar (desabilitado) e o foco vai para as casas
        atualizarDesafio({ reenvioDisponivelEm: api.agoraServidor() + (e.retryAfter ?? 60) * 1000 });
        setPedirFoco((n) => n + 1);
        return;
      }
      if (e.status === 422) {
        // reenvios esgotados, código vencido ou anterior à troca de senha, usuário inativo ou bloqueado
        aoVoltar({ tom: 'aviso', texto: e.detail });
        return;
      }
      if (e.status === 503) {
        setAviso({ tom: 'aviso', texto: `${e.detail} O código enviado antes continua valendo.` });
        return;
      }
      setAviso({ tom: 'perigo', texto: e.detail, correlationId: e.correlationId });
    },
  });

  const ocupado = verificar.isPending || verificar.isSuccess;

  // Foco volta às casas do código depois de um erro ou de um reenvio (quando elas já estão habilitadas).
  useEffect(() => {
    if (pedirFoco && !verificar.isPending) document.getElementById(ID_CODIGO)?.focus();
  }, [pedirFoco, verificar.isPending]);

  // O código venceu (10 min desde o 1º envio): volta às credenciais, uma vez só.
  const venceu = useRef(false);
  useEffect(() => {
    if (validade > 0 || venceu.current || verificar.isPending || verificar.isSuccess) return;
    venceu.current = true;
    aoVoltar({ tom: 'aviso', texto: 'O código expirou. Entre de novo.' });
  }, [validade, verificar.isPending, verificar.isSuccess, aoVoltar]);

  const enviar = (valor: string) => {
    if (ocupado) return;
    if (valor.length !== TAMANHO) {
      setErroCodigo(`Digite os ${TAMANHO} números do código.`);
      setPedirFoco((n) => n + 1);
      return;
    }
    setErroCodigo(undefined);
    setAviso(null);
    verificar.mutate({ desafio: desafio.desafio, codigo: valor });
  };

  const aoEnviarForm = (ev: FormEvent) => {
    ev.preventDefault();
    enviar(codigo);
  };

  return (
    <>
      <CabecalhoEtapa titulo="Confira seu e-mail">
        Enviamos um código de {TAMANHO} dígitos para <strong className="font-semibold text-fg">{desafio.emailMascarado}</strong>.
      </CabecalhoEtapa>
      <form noValidate onSubmit={aoEnviarForm} className="space-y-4">
        <AvisoEtapa aviso={aviso} />
        <CampoForm
          id={ID_CODIGO}
          rotulo="Código"
          grupo
          erro={erroCodigo}
          dica="Não chegou? Confira também a caixa de spam."
          acao={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reenviar.mutate({ desafio: desafio.desafio })}
              disabled={reenvio > 0 || ocupado}
              carregando={reenviar.isPending}
              textoCarregando="Reenviando…"
            >
              {reenvio > 0 ? (
                <>
                  Reenviar em <span className="tabular-nums">{fmtMinSeg(reenvio)}</span>
                </>
              ) : (
                'Reenviar código'
              )}
            </Button>
          }
        >
          {(ids) => (
            <OtpInput
              valor={codigo}
              onChange={(v) => {
                setCodigo(v);
                if (erroCodigo) setErroCodigo(undefined);
              }}
              onCompleto={enviar}
              tamanho={TAMANHO}
              invalido={!!erroCodigo}
              desabilitado={verificar.isPending}
              autoFocus
              semGrupo
              {...ids}
            />
          )}
        </CampoForm>
        <Bloco as="p" className="text-xs text-muted">
          O código vale por mais <span className="font-semibold text-fg tabular-nums">{fmtMinSeg(validade)}</span>.
        </Bloco>
        {/* A contagem não é anunciada a cada segundo; o leitor de tela ouve uma vez quando falta 1 minuto. */}
        <p aria-live="polite" className="sr-only">
          {validade > 0 && validade <= 60 ? 'Falta menos de 1 minuto para o código vencer.' : ''}
        </p>
        <BarraAcoes alinhar="entre" className="pt-2">
          <Button type="button" variant="ghost" onClick={() => aoVoltar(null)} disabled={ocupado}>
            <ArrowLeft className="size-4" aria-hidden /> Voltar
          </Button>
          <Button type="submit" variant="primary" carregando={ocupado} textoCarregando="Verificando…">
            <KeyRound className="size-4" aria-hidden /> Verificar
          </Button>
        </BarraAcoes>
      </form>
    </>
  );
}
