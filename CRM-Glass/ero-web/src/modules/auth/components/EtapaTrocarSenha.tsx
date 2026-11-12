import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, LogOut } from 'lucide-react';
import { BarraAcoes, Button, CampoForm, InputSenha } from '../../../design-system/ui';
import { ErroApi, textoPadrao } from '../../../shared/api/erros';
import type { UsuarioLogado } from '../../../shared/api/tipos';
import { useSessao } from '../../../shared/sessao';
import { authApi } from '../api/auth';
import { TAMANHO_MINIMO_SENHA, trocarSenhaSchema, type TrocarSenha } from '../schemas/login';
import { AvisoEtapa, CabecalhoEtapa, type Aviso } from './comum';

export type EtapaTrocarSenhaProps = {
  /** senha digitada nas credenciais, só em memória; null quando a página foi recarregada com a pendência */
  senhaAtual: string | null;
  aoConcluir: (usuario: UsuarioLogado) => void;
  aoSair: () => void;
};

/** Etapa 3: troca obrigatória da senha temporária (pendência TROCAR_SENHA). */
export function EtapaTrocarSenha({ senhaAtual: senhaRecebida, aoConcluir, aoSair }: EtapaTrocarSenhaProps) {
  const { usuario, atualizarEu } = useSessao();
  // Fica com a que recebeu ao montar: os campos não mudam enquanto a etapa sai.
  const [senhaAtual] = useState(senhaRecebida);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [concluido, setConcluido] = useState(false);
  const pedirAtual = senhaAtual === null;
  const schema = useMemo(() => trocarSenhaSchema(pedirAtual), [pedirAtual]);
  const { register, handleSubmit, setError, setFocus, formState } = useForm<TrocarSenha>({
    resolver: zodResolver(schema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmar: '' },
  });

  useEffect(() => {
    setFocus(pedirAtual ? 'senhaAtual' : 'novaSenha');
  }, [pedirAtual, setFocus]);

  // Se a senha já foi trocada e só a leitura do /eu falhou, tentar de novo não troca outra vez.
  const trocou = useRef(false);
  const salvar = useMutation({
    mutationFn: async (d: TrocarSenha) => {
      if (!trocou.current) {
        await authApi.trocarSenha({ senhaAtual: senhaAtual ?? d.senhaAtual ?? '', novaSenha: d.novaSenha });
        trocou.current = true;
      }
      return atualizarEu();
    },
    onSuccess: (u) => {
      if (u.pendencia === 'NENHUMA') {
        setConcluido(true);
        aoConcluir(u);
      } else {
        setAviso({ tom: 'aviso', texto: 'A troca de senha ainda não foi registrada. Tente de novo.' });
      }
    },
    onError: (e) => {
      if (!(e instanceof ErroApi)) {
        setAviso({ tom: 'perigo', texto: textoPadrao(0) });
        return;
      }
      // 401: a renovação foi recusada e a sessão acabou; a página de login volta às credenciais.
      if (e.status === 401) return;
      if (e.status === 400) {
        let marcou = false;
        for (const { campo, mensagem } of e.erros) {
          if (campo === 'novaSenha' || (campo === 'senhaAtual' && pedirAtual)) {
            setError(campo, { message: mensagem }, { shouldFocus: !marcou }); // foco no primeiro campo com erro
            marcou = true;
          }
        }
        if (!marcou) setAviso({ tom: 'perigo', texto: e.detail });
        return;
      }
      if (e.status === 422) {
        setAviso({ tom: 'perigo', texto: e.detail });
        return;
      }
      setAviso({ tom: e.status === 429 || e.status === 503 ? 'aviso' : 'perigo', texto: e.detail, correlationId: e.correlationId });
    },
  });

  // Só fica carregando até o fim quando concluiu; "ainda não registrada" libera o botão para tentar de novo.
  const ocupado = salvar.isPending || concluido;
  const enviar = handleSubmit((d) => {
    // O Button carregando já barra o clique e o submit; isto cobre o envio por outro caminho.
    if (ocupado) return;
    setAviso(null);
    salvar.mutate(d);
  });

  return (
    <>
      <CabecalhoEtapa titulo="Crie uma senha nova">Sua senha é temporária. Troque antes de continuar.</CabecalhoEtapa>
      <form noValidate onSubmit={enviar} className="space-y-4">
        {/* Para o gerenciador de senhas saber de qual conta é a senha nova. */}
        {usuario && <input type="email" name="username" autoComplete="username" value={usuario.email} readOnly hidden />}
        <AvisoEtapa aviso={aviso} />
        {pedirAtual && (
          <CampoForm rotulo="Senha atual" erro={formState.errors.senhaAtual?.message} dica="A senha temporária que você recebeu.">
            <InputSenha autoComplete="current-password" {...register('senhaAtual')} />
          </CampoForm>
        )}
        <CampoForm
          rotulo="Nova senha"
          erro={formState.errors.novaSenha?.message}
          dica={`${TAMANHO_MINIMO_SENHA} caracteres ou mais, sem seu nome nem e-mail.`}
        >
          <InputSenha autoComplete="new-password" {...register('novaSenha')} />
        </CampoForm>
        <CampoForm rotulo="Confirmar nova senha" erro={formState.errors.confirmar?.message}>
          <InputSenha autoComplete="new-password" {...register('confirmar')} />
        </CampoForm>
        <BarraAcoes alinhar="entre" className="pt-2">
          <Button type="button" variant="ghost" onClick={aoSair} disabled={ocupado}>
            <LogOut className="size-4" aria-hidden /> Sair
          </Button>
          <Button type="submit" variant="primary" carregando={ocupado} textoCarregando="Salvando…">
            <Check className="size-4" aria-hidden /> Salvar e entrar
          </Button>
        </BarraAcoes>
      </form>
    </>
  );
}
