import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { TEntry } from '@/components/common'
import { localidadeService, type CepResponse } from '@/services/localidadeService'
import { mascararCep, somenteDigitos } from '@/utils/format'

type Situacao =
  | { tipo: 'ocioso' }
  | { tipo: 'consultando' }
  | { tipo: 'achado'; texto: string }
  | { tipo: 'falha'; texto: string; erro?: boolean }

interface CampoCepProps {
  value: string
  onChange: (valor: string) => void
  /** O CEP completo foi achado: quem chama decide o que preencher. */
  onEncontrado: (endereco: CepResponse) => void
  disabled?: boolean
}

/**
 * CEP que busca o endereço sozinho, ao completar os 8 dígitos.
 *
 * Consulta uma vez por CEP: o valor que veio pronto (registro salvo) não é
 * consultado ao abrir, só o que o usuário digitar depois. A resposta — boa ou
 * ruim — aparece na linha de ajuda do próprio campo, nunca em toast: digitar
 * um CEP errado é estado da tela, não evento.
 */
export function CampoCep({ value, onChange, onEncontrado, disabled }: CampoCepProps) {
  const [situacao, setSituacao] = useState<Situacao>({ tipo: 'ocioso' })
  const ultimoConsultado = useRef(somenteDigitos(value) ?? '')
  const aoEncontrar = useRef(onEncontrado)
  aoEncontrar.current = onEncontrado

  const digitos = somenteDigitos(value) ?? ''

  useEffect(() => {
    if (digitos.length !== 8) {
      if (digitos.length < 8) ultimoConsultado.current = ''
      setSituacao({ tipo: 'ocioso' })
      return
    }
    if (digitos === ultimoConsultado.current) return

    // O CEP vira "consultado" só quando a resposta chega e vale: no
    // StrictMode o efeito roda duas vezes, e marcar antes descartaria a
    // única resposta que importa.
    let vigente = true
    setSituacao({ tipo: 'consultando' })
    localidadeService
      .consultarCep(digitos)
      .then((endereco) => {
        if (!vigente) return
        ultimoConsultado.current = digitos
        aoEncontrar.current(endereco)
        setSituacao({
          tipo: 'achado',
          texto: endereco.motivo
            ?? (endereco.cepUnico
              ? `CEP único de ${endereco.cidadeNome}: informe rua e bairro`
              : 'Endereço preenchido pelo CEP — confira'),
        })
      })
      .catch((erro) => {
        if (!vigente) return
        ultimoConsultado.current = digitos
        const status = isAxiosError(erro) ? erro.response?.status : undefined
        setSituacao(
          status === 404
            ? { tipo: 'falha', texto: 'CEP não encontrado — confira ou preencha à mão', erro: true }
            : status === 400
              ? { tipo: 'falha', texto: 'CEP deve ter 8 dígitos', erro: true }
              : { tipo: 'falha', texto: 'Consulta de CEP indisponível — preencha à mão' },
        )
      })
    return () => {
      vigente = false
    }
  }, [digitos])

  return (
    <TEntry
      label="CEP"
      inputMode="numeric"
      placeholder="00000-000"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(mascararCep(e.target.value))}
      suffix={
        situacao.tipo === 'consultando' ? (
          <span
            role="status"
            aria-label="Consultando CEP"
            className="block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
        ) : undefined
      }
      error={situacao.tipo === 'falha' && situacao.erro ? situacao.texto : undefined}
      ajuda={
        situacao.tipo === 'achado' || (situacao.tipo === 'falha' && !situacao.erro)
          ? situacao.texto
          : situacao.tipo === 'ocioso' && !value
            ? 'Preenche cidade, rua e bairro'
            : undefined
      }
    />
  )
}
