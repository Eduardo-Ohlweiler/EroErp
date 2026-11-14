import { createContext, useContext, type ReactNode } from 'react';
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { Alerta } from '../ui/Alerta';
import { BarraAcoes, GlassCard } from '../ui/Glass';
import { useVariantesBloco } from '../ui/bloco';
import { DentroDoCartao, useVariantesDoPapel } from '../../motion/coreografia';
import { cn } from '../../shared/util/utils';
import { ReservaErroDoForm } from './campo';
import { SomenteLeituraDoForm } from './somenteLeitura';

export type TFormProps<T extends FieldValues> = {
  /** o retorno do `useForm` */
  form: UseFormReturn<T>;
  onSubmit: (dados: T) => unknown;
  /** acesso só de leitura: campos travados, faixa de aviso, sem os botões que gravam (`salvar`, `novo`, `inativar`, `reativar`) */
  somenteLeitura?: boolean;
  children: ReactNode;
};

/** Verdadeiro dentro de um `TForm` (o `TFormFooter` de dentro leva a borda no topo do rodapé do cartão). */
const DentroDoTForm = createContext(false);

/** O `useForm` foi criado com `resolver` (zod)? Só esse formulário valida e reserva a linha do erro (F6). */
export function temResolver(form: UseFormReturn<FieldValues>): boolean {
  const opcoes = (form.control as unknown as { _options?: { resolver?: unknown } })._options;
  return !!opcoes?.resolver;
}

/**
 * O formulário do kit (docs/07 §3.1): `FormProvider` + `<form noValidate>` + cartão `glass-solid` (um bloco da
 * montagem). Os campos de dentro se ligam ao formulário só pelo `name`.
 *
 * Só leitura é por contexto, não por `<fieldset disabled>`: o fieldset desligaria também o Voltar.
 */
export function TForm<T extends FieldValues>({ form, onSubmit, somenteLeitura = false, children }: TFormProps<T>) {
  // Papel `cartao` (motion/tokens.ts, kit): o cartão encaixa como bloco da tela e põe campos e rodapé em cascata.
  const cartao = useVariantesDoPapel('cartao');
  return (
    <FormProvider {...form}>
      <SomenteLeituraDoForm.Provider value={somenteLeitura}>
        <ReservaErroDoForm.Provider value={temResolver(form as unknown as UseFormReturn<FieldValues>)}>
          <DentroDoTForm.Provider value>
            <GlassCard level="solid" variants={cartao} className="min-w-0">
              {/* Os blocos de dentro (campos, título do TPanel, rodapé) encaixam como `campo`, em cascata. */}
              <DentroDoCartao>
                <form
                  noValidate
                  data-kit="TForm"
                  data-somente-leitura={somenteLeitura || undefined}
                  onSubmit={form.handleSubmit(async (dados) => {
                    if (!somenteLeitura) await onSubmit(dados);
                  })}
                  className="flex min-w-0 flex-col gap-4"
                >
                  {somenteLeitura && <Alerta tom="info">Você tem acesso só de leitura a esta tela.</Alerta>}
                  {children}
                </form>
              </DentroDoCartao>
            </GlassCard>
          </DentroDoTForm.Provider>
        </ReservaErroDoForm.Provider>
      </SomenteLeituraDoForm.Provider>
    </FormProvider>
  );
}

/**
 * Rodapé do cartão, com borda no topo: os botões ficam embaixo do formulário, à esquerda, na ordem do padrão
 * (List: Buscar · Limpar · Novo · Exportar · Pdf; Form: Salvar · Novo · Voltar), o principal primeiro.
 * No celular empilham na mesma ordem, o principal em cima, na largura toda. É um bloco da montagem.
 *
 * Também serve **fora de um `TForm`** (tela que não é cadastro, como a Aparência do contratante): mesmo
 * empilhamento no celular, sem a borda no topo (não há cartão de formulário para separar).
 */
export function TFormFooter({ children }: { children: ReactNode }) {
  const rodape = useVariantesDoPapel('rodape');
  // Fora do cartão não há cartão para levá-lo embora na saída: vira bloco da tela, com entrada e saída próprias.
  const blocoDaTela = useVariantesBloco(true);
  const noCartao = useContext(DentroDoTForm);
  return (
    <BarraAcoes
      data-kit="TFormFooter"
      variants={noCartao ? rodape : blocoDaTela}
      alinhar="entre"
      className={cn('flex-col !items-stretch sm:flex-row sm:!items-center', noCartao && 'mt-1 border-t border-line pt-4')}
    >
      {children}
    </BarraAcoes>
  );
}

const pilha = 'flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto';

/** Os botões à esquerda (todos os modelos usam). */
export function TFormActionsLeft({ children }: { children: ReactNode }) {
  return <div className={pilha}>{children}</div>;
}

/** Ações à direita — os modelos de hoje não usam; existe para a tela que o plano pedir. */
export function TFormActionsRight({ children }: { children: ReactNode }) {
  return <div className={cn(pilha, 'sm:ml-auto')}>{children}</div>;
}
