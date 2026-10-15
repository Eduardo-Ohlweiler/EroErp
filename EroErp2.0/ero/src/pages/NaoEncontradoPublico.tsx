import { Link } from 'react-router-dom'
import { MarcaEro } from '@/components/layout/MarcaEro'

/**
 * 404 público, fora do ERP. Mantém a URL — redirecionar esconderia o link
 * quebrado de quem precisa consertá-lo. O `noindex` vem do `index.html`.
 */
export function NaoEncontradoPublico() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="flex max-w-120 flex-col items-center text-center">
        <MarcaEro tamanho="destaque" />

        <h1 className="mt-8 text-h1 font-medium text-txt">Página não encontrada</h1>
        <p className="mt-2 text-body text-txt-secondary">
          O endereço que você abriu não existe ou foi movido.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-body">
          <Link to="/app/login" className="text-primary underline-offset-4 hover:underline">
            Acessar o sistema
          </Link>
        </div>
      </div>
    </main>
  )
}
