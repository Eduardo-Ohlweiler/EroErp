import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { useToast } from '../ui/Toast';
import { avisoDosCampos, tratarErroApi } from './erroApi';

export type OpcoesErroApi = {
  /** o que o botão Recarregar do 409 faz; padrão: reler as consultas da tela (o `useEffect` do Form refaz o `reset`) */
  recarregar?: () => unknown;
};

export type Mensagens = {
  /** some sozinha */
  sucesso: (texto: string, descricao?: string) => void;
  /** fica até a pessoa fechar */
  erro: (texto: string, descricao?: string) => void;
  aviso: (texto: string, descricao?: string) => void;
  info: (texto: string, descricao?: string) => void;
  /** o tratamento padrão de erro da API, para todo `catch` (400 e 409 com `erros` marcam o campo; 409 sem `erros` oferece Recarregar; 429 diz quanto esperar) */
  erroApi: <T extends FieldValues>(e: unknown, form?: UseFormReturn<T>, opcoes?: OpcoesErroApi) => void;
};

/** O formulário tem o campo? Registrado (montado) ou presente nos valores. */
function temCampoNoForm<T extends FieldValues>(form: UseFormReturn<T>) {
  const montados = (form.control as unknown as { _names?: { mount?: Set<string> } })._names?.mount;
  return (campo: string) => !!montados?.has(campo) || form.getValues(campo as Path<T>) !== undefined;
}

/**
 * As mensagens da tela (docs/07 §3.3). O `ToastProvider` fica por baixo; **a tela não importa `useToast`**.
 * O objeto é o mesmo a cada render (pode entrar em dependência de efeito).
 */
export function useMessage(): Mensagens {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMemo<Mensagens>(
    () => ({
      sucesso: (title, description) => toast({ title, description, tone: 'success' }),
      erro: (title, description) => toast({ title, description, tone: 'danger', fixo: true }),
      aviso: (title, description) => toast({ title, description, tone: 'warning' }),
      info: (title, description) => toast({ title, description, tone: 'info' }),
      erroApi: (e, form, opcoes) => {
        const t = tratarErroApi(e, form ? temCampoNoForm(form) : undefined);
        switch (t.tipo) {
          case 'nada':
            return;
          case 'campos': {
            // 400 de validação e 409 de duplicidade (com `erros`): marca o campo, sem Recarregar
            t.campos.forEach((c, i) => form?.setError(c.campo as Path<never>, { type: 'server', message: c.mensagem }, { shouldFocus: i === 0 }));
            const aviso = avisoDosCampos(t);
            if (aviso) toast({ title: aviso.titulo, description: aviso.descricao, tone: 'danger', fixo: true });
            return;
          }
          case 'conflito':
            toast({
              title: t.texto,
              tone: 'danger',
              fixo: true,
              acao: { rotulo: 'Recarregar', onClick: () => void (opcoes?.recarregar ? opcoes.recarregar() : queryClient.invalidateQueries()) },
            });
            return;
          case 'espera':
            toast({ title: t.texto, tone: 'warning' });
            return;
          case 'mensagem':
            toast({ title: t.texto, description: t.codigo ? `Código para o suporte: ${t.codigo}` : undefined, tone: 'danger', fixo: true });
            return;
        }
      },
    }),
    [toast, queryClient],
  );
}
