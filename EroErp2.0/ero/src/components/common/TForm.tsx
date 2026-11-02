import type { ReactNode } from 'react'
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { SomenteLeituraDoForm } from './somenteLeitura'

interface TFormProps<T extends FieldValues> {
  /** O retorno do `useForm`. */
  form: UseFormReturn<T>
  onSubmit: (dados: T) => unknown
  /**
   * Acesso só de leitura: os campos ficam travados, aparece a faixa e os
   * botões que gravam (`salvar`, `novo`, `inativar`, `reativar`) somem.
   */
  somenteLeitura?: boolean
  children: ReactNode
}

/**
 * O formulário do kit: `FormProvider` + `<form noValidate>` + o cartão.
 *
 * Os campos dentro dele se ligam ao formulário **só pelo `name`**. Travar é
 * por contexto, e não por `<fieldset disabled>`: o fieldset desligaria também
 * o Voltar do rodapé, que quem só lê precisa.
 */
export function TForm<T extends FieldValues>({
  form,
  onSubmit,
  somenteLeitura = false,
  children,
}: TFormProps<T>) {
  return (
    <FormProvider {...form}>
      <SomenteLeituraDoForm.Provider value={somenteLeitura}>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (dados) => {
            if (!somenteLeitura) await onSubmit(dados)
          })}
          className="flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-card"
        >
          {somenteLeitura && (
            <p className="rounded-md bg-info-bg px-3 py-2 text-caption text-info">
              Você tem acesso só de leitura a esta tela.
            </p>
          )}
          {children}
        </form>
      </SomenteLeituraDoForm.Provider>
    </FormProvider>
  )
}

/**
 * Rodapé do cartão, com borda no topo. No celular empilha, com o botão
 * principal embaixo, perto do polegar; os botões ocupam a largura toda.
 */
export function TFormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  )
}

/** Voltar · Novo, ou Filtrar · Limpar · Novo — o primeiro fica embaixo no celular. */
export function TFormActionsLeft({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
      {children}
    </div>
  )
}

/** Salvar. */
export function TFormActionsRight({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
      {children}
    </div>
  )
}
