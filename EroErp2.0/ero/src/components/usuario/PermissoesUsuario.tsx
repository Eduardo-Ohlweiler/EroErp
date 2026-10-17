import { TCheckBox, TRadio } from '@/components/common'
import type { CatalogoModulo, NivelAcesso, Permissao, Tela } from '@/types/permissao'

/** "Sem acesso" é string vazia: a tela some da lista enviada. */
const OPCOES_NIVEL: { valor: '' | NivelAcesso; rotulo: string }[] = [
  { valor: '', rotulo: 'Sem acesso' },
  { valor: 'LEITURA', rotulo: 'Leitura' },
  { valor: 'ESCRITA', rotulo: 'Leitura e escrita' },
]

interface PermissoesUsuarioProps {
  catalogo: CatalogoModulo[]
  /** Só as telas liberadas — o mesmo formato que o backend grava. */
  value: Permissao[]
  onChange: (permissoes: Permissao[]) => void
}

/**
 * Módulos e telas que um usuário USER acessa.
 *
 * Módulo de uma tela só mostra o nível direto. Nos de várias telas, cada
 * módulo é uma caixa: marcar libera todas as telas dele em leitura e
 * escrita; desmarcar tira todas. Depois, tela a tela, dá para baixar a
 * leitura ou tirar o acesso — a caixa fica indeterminada quando o módulo está
 * liberado só em parte.
 *
 * O catálogo vem do servidor (`GET /permissoes/catalogo`): rótulos e ordem são
 * os do enum, e uma tela nova aparece aqui sem mexer nesta tela.
 */
export function PermissoesUsuario({ catalogo, value, onChange }: PermissoesUsuarioProps) {
  const nivelDe = (tela: Tela) => value.find((p) => p.tela === tela)?.nivel ?? ''

  function definir(tela: Tela, nivel: '' | NivelAcesso) {
    const outras = value.filter((p) => p.tela !== tela)
    onChange(nivel ? [...outras, { tela, nivel }] : outras)
  }

  function alternarModulo(modulo: CatalogoModulo, liberar: boolean) {
    const doModulo = new Set(modulo.telas.map((t) => t.tela))
    const fora = value.filter((p) => !doModulo.has(p.tela))
    onChange(
      liberar
        ? [...fora, ...modulo.telas.map((t) => ({ tela: t.tela, nivel: 'ESCRITA' as const }))]
        : fora,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {catalogo.map((modulo) => {
        // Módulo de uma tela só (Pessoas, Filiais): a caixa e a tela seriam
        // a mesma coisa escrita duas vezes. O nível fica direto no módulo.
        if (modulo.telas.length === 1) {
          const [tela] = modulo.telas
          return (
            <section key={modulo.modulo} className="rounded-md border border-line-strong p-4">
              <p className="mb-2 text-body font-medium text-txt">{modulo.rotulo}</p>
              <TRadio
                label="Acesso"
                opcoes={OPCOES_NIVEL}
                value={nivelDe(tela.tela)}
                onChange={(nivel) => definir(tela.tela, nivel as '' | NivelAcesso)}
              />
            </section>
          )
        }

        const liberadas = modulo.telas.filter((t) => nivelDe(t.tela)).length
        const todasEmEscrita = modulo.telas.every((t) => nivelDe(t.tela) === 'ESCRITA')

        return (
          <section key={modulo.modulo} className="rounded-md border border-line-strong p-4">
            <TCheckBox
              label={modulo.rotulo}
              checked={liberadas > 0}
              ref={(el) => {
                if (el) el.indeterminate = liberadas > 0 && !todasEmEscrita
              }}
              onChange={(e) => alternarModulo(modulo, e.target.checked)}
              className="font-medium"
            />

            {liberadas > 0 && (
              <ul className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
                {modulo.telas.map((tela) => (
                  <li key={tela.tela}>
                    <TRadio
                      label={tela.rotulo}
                      opcoes={OPCOES_NIVEL}
                      value={nivelDe(tela.tela)}
                      onChange={(nivel) => definir(tela.tela, nivel as '' | NivelAcesso)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
