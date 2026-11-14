import type { ReactNode } from 'react';
import { Tela } from '../../motion/coreografia/Tela';
import type { NomeCoreografia } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { GlassCard, PageHeader } from '../ui/Glass';
import { Skeleton } from '../ui/Skeleton';

export type TPageProps = {
  title: string;
  /** o caminho até a tela, em texto, acima do título: `['Administração', 'Contratantes']` */
  breadcrumb?: string[];
  subtitle?: string;
  /** botões ao lado do título (ex.: "Configurar aparência") */
  actions?: ReactNode;
  /**
   * O que sai no papel — a folha (`DocumentoLista`), não a tela. Com ele preenchido, só a folha imprime; sem ele,
   * a página imprime como está.
   */
  documento?: ReactNode;
  /** mostra o esqueleto no lugar do conteúdo (a tela não monta spinner) */
  carregando?: boolean;
  /** entrada e saída da tela (motion/tokens.ts): `padrao` na List, `formulario` no Form e no FormList */
  coreografia?: NomeCoreografia;
  children: ReactNode;
};

/**
 * Container de tela de cadastro (docs/07 §3.1): `<Tela coreografia>` + `PageHeader` com o caminho. Os blocos da
 * montagem são os próprios componentes do kit, na ordem do documento: cabeçalho → cartão do `TForm` → campos →
 * rodapé → grade → rodapé da grade.
 */
export function TPage({ title, breadcrumb, subtitle, actions, documento, carregando = false, coreografia = 'padrao', children }: TPageProps) {
  return (
    <Tela coreografia={coreografia} data-kit="TPage" className="flex min-w-0 flex-col gap-5">
      <PageHeader title={title} subtitle={subtitle} actions={actions} breadcrumb={breadcrumb} className="!mb-0" />
      {carregando ? (
        <GlassCard level="solid" role="status" aria-label="Carregando" aria-busy="true">
          <div className="flex flex-col gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className={cn('h-11 rounded-[14px]', i === 1 ? 'sm:w-52' : 'sm:w-1/2')} />
              </div>
            ))}
            <div className="flex gap-2 border-t border-line pt-4">
              <Skeleton className="h-10 w-24 rounded-[14px]" />
              <Skeleton className="h-10 w-20 rounded-[14px]" />
            </div>
          </div>
        </GlassCard>
      ) : (
        children
      )}
      {/* `contents`: na tela a folha não existe e não pode abrir espaço no fim da página. */}
      {!carregando && documento && (
        <div data-kit="folha" className="contents">
          {documento}
        </div>
      )}
    </Tela>
  );
}
