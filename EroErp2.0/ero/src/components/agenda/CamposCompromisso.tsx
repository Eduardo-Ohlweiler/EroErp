import { useState, type ReactNode } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { IconAdicionar } from '@/assets/icons'
import { TAviso, TButton, TCheckBox, TCombo, TComboMulti, TEntry, TPanel, TTextArea } from '@/components/common'
import { PessoaRapidaModal } from '@/components/pessoa/PessoaRapidaModal'
import { useAuth } from '@/hooks/useAuth'
import { filialService } from '@/services/filialService'
import { pessoaService } from '@/services/pessoaService'
import { usuarioService } from '@/services/usuarioService'
import type { Disponibilidade } from '@/types/compromisso'
import { diaCurto, diaDe, faixaDeHorario } from '@/utils/agenda'
import type { CamposCompromissoDados } from '@/utils/compromissoForm'

/**
 * Os campos do compromisso — quem, o quê, onde e quando — e o aviso de quem
 * já está ocupado. Moram aqui porque dois formulários os usam: o da agenda
 * (que acrescenta a recorrência e a prévia da série) e o da consulta (que
 * acrescenta os itens). A regra fica num lugar só; cada formulário só junta o
 * que é dele. Schema e corpo em `utils/compromissoForm.ts`; o "quem está
 * ocupado" em `hooks/useDisponibilidade.ts`.
 */

interface Props {
  travado: boolean
  editando: boolean
  disponibilidade: Disponibilidade | null
  /** A consulta: o cliente não tem a opção "Sem cliente". */
  clienteObrigatorio?: boolean
  /** A dica da filial travada — o compromisso de uma consulta, na agenda. Ausente, a filial se escolhe. */
  filialTravada?: string
  /** No topo do painel "Quando" — o aviso de série alterada. */
  avisoQuando?: ReactNode
  /** Depois das horas, antes dos choques — a recorrência. */
  recorrencia?: ReactNode
  /** No fim do painel "Quando" — a prévia da série. */
  previa?: ReactNode
}

/**
 * Responsável primeiro, convidados, título, filial, cliente (com cadastro
 * rápido), dia e horas, e os choques: o do responsável em vermelho (impede
 * salvar), o de convidado em aviso. Lê e escreve no formulário de quem a usa,
 * pelo `FormProvider`.
 */
export function CamposCompromisso({
  travado,
  editando,
  disponibilidade,
  clienteObrigatorio = false,
  filialTravada,
  avisoQuando,
  recorrencia,
  previa,
}: Props) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CamposCompromissoDados>()
  const [novoCliente, setNovoCliente] = useState(false)
  const v = watch()
  const { sessao } = useAuth()

  const choquesDoResponsavel =
    disponibilidade?.ocorrencias.flatMap((o) => o.choques.filter((c) => c.responsavel)) ?? []
  const choquesDeConvidados =
    disponibilidade?.ocorrencias.flatMap((o) => o.choques.filter((c) => !c.responsavel)) ?? []

  return (
    <>
      <TPanel title="Quem participa">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="responsavelId"
            render={({ field }) => (
              <TCombo
                label="Responsável"
                value={field.value}
                rotuloInicial={v.responsavelRotulo || undefined}
                onChange={(novo) => {
                  field.onChange(novo)
                  // Quem passa a responsável deixa de ser convidado
                  setValue('convidados', v.convidados.filter((c) => c.id !== novo))
                }}
                buscar={(termo) => usuarioService.select(termo)}
                error={errors.responsavelId?.message}
                ajuda={
                  editando
                    ? 'Quem vai atender.'
                    : sessao?.impersonating
                      ? 'Quem vai atender. Escolha um usuário deste tenant.'
                      : 'Quem vai atender. Começa com você.'
                }
              />
            )}
          />
          <Controller
            control={control}
            name="convidados"
            render={({ field }) => (
              <TComboMulti
                label="Convidados"
                value={field.value}
                onChange={field.onChange}
                buscar={(termo) => usuarioService.select(termo)}
                excluir={v.responsavelId ? [v.responsavelId] : []}
                maximo={20}
                disabled={travado}
                error={errors.convidados?.message}
                ajuda="Outros usuários que participam."
              />
            )}
          />
        </div>
      </TPanel>

      <TPanel title="Compromisso">
        <div className="grid gap-4 sm:grid-cols-2">
          <TEntry
            label="Título"
            className="sm:col-span-2"
            maxLength={255}
            placeholder="Ex.: Consulta, Retorno, Reunião"
            error={errors.titulo?.message}
            {...register('titulo')}
          />
          <Controller
            control={control}
            name="filialId"
            render={({ field }) => (
              <TCombo
                label="Filial"
                value={field.value}
                rotuloInicial={v.filialRotulo || undefined}
                onChange={field.onChange}
                buscar={(termo) =>
                  filialService.select(termo).then((l) => l.map((f) => ({ id: f.id, nome: f.nome })))
                }
                error={errors.filialId?.message}
                disabled={travado || !!filialTravada}
                ajuda={filialTravada}
              />
            )}
          />
          {/* self-start: a dica embaixo da Filial não empurra o cliente para baixo */}
          <div className="flex items-end gap-2 self-start">
            <Controller
              control={control}
              name="pessoaId"
              render={({ field }) => (
                <TCombo
                  label="Cliente"
                  className="min-w-0 flex-1"
                  value={field.value}
                  rotuloInicial={v.pessoaRotulo || undefined}
                  vazio={clienteObrigatorio ? undefined : 'Sem cliente'}
                  placeholder="Busque por nome ou documento"
                  onChange={field.onChange}
                  buscar={(termo) => pessoaService.select(termo).then((l) => l.map((p) => ({ id: p.id, nome: p.nome })))}
                  error={errors.pessoaId?.message}
                />
              )}
            />
            {!travado && (
              <TButton
                type="button"
                variant="secondary"
                onClick={() => setNovoCliente(true)}
                title="Cadastrar um cliente novo"
                aria-label="Cadastrar cliente"
                // Alinha com o campo quando o erro aparece embaixo dele
                className={errors.pessoaId ? 'mb-6' : ''}
              >
                <IconAdicionar className="size-4" />
              </TButton>
            )}
          </div>
        </div>
      </TPanel>

      <TPanel title="Quando">
        {avisoQuando}
        <div className="grid gap-4 sm:grid-cols-3">
          <TEntry label="Dia" type="date" error={errors.dia?.message} {...register('dia')} />
          <TEntry label="Das" type="time" error={errors.horaInicio?.message} {...register('horaInicio')} />
          <TEntry label="Às" type="time" error={errors.horaFim?.message} {...register('horaFim')} />
        </div>

        {recorrencia}

        {/* Quem já está ocupado — atualiza sozinho enquanto se preenche */}
        {!travado && choquesDoResponsavel.length > 0 && (
          <div role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger-bg px-3 py-2 text-caption text-danger">
            <p className="font-medium">O responsável já tem compromisso neste horário — não dá para salvar assim:</p>
            <ul className="mt-1 list-disc pl-5">
              {choquesDoResponsavel.slice(0, 5).map((c, i) => (
                <li key={`${c.compromissoId}-${i}`}>
                  {diaCurto(diaDe(c.inicio))}, {faixaDeHorario(c.inicio, c.fim)} — {c.titulo}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!travado && choquesDeConvidados.length > 0 && (
          <TAviso className="mt-3">
            {[...new Set(choquesDeConvidados.map((c) => c.usuarioNome))].join(', ')}{' '}
            {new Set(choquesDeConvidados.map((c) => c.usuarioId)).size > 1 ? 'já têm' : 'já tem'} compromisso
            neste horário. Dá para salvar mesmo assim.
          </TAviso>
        )}
        {previa}
      </TPanel>

      <TPanel title="Detalhes">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <TCheckBox label="Usar a cor da filial" {...register('corDaFilial')} />
            {!v.corDaFilial && (
              <label className="flex items-center gap-2 text-caption text-txt-secondary">
                Cor
                <input
                  type="color"
                  className="h-9 w-14 cursor-pointer rounded border border-line-strong bg-surface p-0.5"
                  {...register('cor')}
                />
              </label>
            )}
          </div>
          <TTextArea
            label="Descrição"
            rows={4}
            maxLength={2000}
            error={errors.descricao?.message}
            {...register('descricao')}
          />
        </div>
      </TPanel>

      <PessoaRapidaModal
        aberto={novoCliente}
        onFechar={() => setNovoCliente(false)}
        onCriada={(p) => {
          setValue('pessoaId', p.id, { shouldValidate: !!errors.pessoaId })
          setValue('pessoaRotulo', p.nome)
          setNovoCliente(false)
        }}
      />
    </>
  )
}
