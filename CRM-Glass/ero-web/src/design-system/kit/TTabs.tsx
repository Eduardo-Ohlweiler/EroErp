import type { ComponentType, ReactNode } from 'react';
import { ConteudoDeAba } from '../../motion/coreografia';
import { ConteudoAba, Tabs } from '../ui/Tabs';

export type AbaTTabs = {
  id: string;
  rotulo: string;
  /** marca a aba com um ponto (ex.: campo com erro lá dentro) */
  alerta?: boolean;
  icone?: ComponentType<{ className?: string }>;
  desabilitada?: boolean;
};

export type TTabsProps = {
  abas: AbaTTabs[];
  /** id da aba ativa */
  ativa: string;
  onChange: (id: string) => void;
  /** nome da barra de abas para o leitor de tela (padrão: "Seções") */
  label?: string;
  /** os `TTabPanel`, um por aba */
  children: ReactNode;
};

/**
 * Abas do kit (docs/07 §3.1), quando o formulário é grande demais para painéis (Minha conta: Meus dados · Senha ·
 * Sessões). Sobre o `Tabs` (Radix: setas e Home/End entre as abas, só a ativa na ordem do Tab, `aria-controls`), com a
 * pílula que desliza. A barra rola na horizontal no celular (só ela, nunca a página), é um bloco da montagem da tela e
 * não imprime.
 *
 * Mesmas props do 2.0 (`abas`, `ativa`, `onChange`); a diferença é que os `TTabPanel` vão **dentro** do `TTabs` (o
 * Radix liga cada aba ao seu painel pela raiz comum).
 *
 * Só a aba ativa fica montada. Para o que foi digitado sobreviver à troca de aba, crie o `useForm` na tela (fora do
 * `TTabPanel`) e passe ao `TForm` da aba: o react-hook-form guarda o valor dos campos que desmontam.
 */
export function TTabs({ abas, ativa, onChange, label = 'Seções', children }: TTabsProps) {
  return (
    <Tabs
      abas={abas.map((a) => ({
        valor: a.id,
        icone: a.icone,
        desabilitada: a.desabilitada,
        rotulo: a.alerta ? (
          <>
            {a.rotulo}
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />
            <span className="sr-only">(requer atenção)</span>
          </>
        ) : (
          a.rotulo
        ),
      }))}
      valor={ativa}
      onValorChange={onChange}
      rotulo={label}
      classeLista="nao-imprime self-start"
      listaComoBloco
      dados={{ 'data-kit': 'TTabs' }}
      className="flex min-w-0 flex-col"
    >
      {children}
    </Tabs>
  );
}

export type TTabPanelProps = {
  id: string;
  /** compatibilidade com o 2.0; a aba ativa vem do `TTabs` */
  ativa?: string;
  /** o rótulo da aba, repetido como título só no papel (a barra de abas não imprime) */
  rotulo?: string;
  children: ReactNode;
};

/**
 * O painel de uma aba. A entrada é a do `ConteudoDeAba` (motion/coreografia, do motion-designer): a aba que nasce
 * com a tela entra na montagem dela; a escolhida depois entra como um bloco curto (cartões e grades sobem e
 * aparecem, cada um com a opacidade em si mesmo, nunca no painel, que tem vidro dentro). Movimento reduzido: só
 * esmaece. Conteúdo solto que não é bloco do kit: envolva em `<Bloco>`.
 */
export function TTabPanel({ id, rotulo, children }: TTabPanelProps) {
  return (
    <ConteudoAba valor={id} data-kit="TTabPanel" className="focus-visible:outline-offset-4">
      {rotulo && <h2 className="so-impressao mb-3 text-[15px] font-semibold">{rotulo}</h2>}
      <ConteudoDeAba className="flex min-w-0 flex-col gap-5">{children}</ConteudoDeAba>
    </ConteudoAba>
  );
}
