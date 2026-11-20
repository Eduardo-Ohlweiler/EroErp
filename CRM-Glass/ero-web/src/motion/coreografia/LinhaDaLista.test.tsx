// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { useForm } from 'react-hook-form';
import { TEntry, TFieldList, TForm } from '../../design-system/kit';
import { Tela } from './Tela';
import { TrocaDeBlocos } from './LinhaDaLista';

/*
 * Coreografia `linhaDaLista`: a linha acrescentada abre e aparece; a removida some, recolhe e fica `inert` enquanto
 * sai, com o foco indo para o Acrescentar. As linhas que vêm com a tela entram na cascata do cartão. Troca de bloco
 * (PF ↔ PJ) no lugar.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// O Motion mede `height: auto` e devolve a rolagem com window.scrollTo, que o jsdom não implementa.
window.scrollTo = () => {};

let raiz: Root | null = null;
let caixa: HTMLDivElement | null = null;

function montar(el: ReactElement) {
  caixa = document.createElement('div');
  document.body.appendChild(caixa);
  raiz = createRoot(caixa);
  act(() => raiz!.render(el));
  return caixa;
}

afterEach(() => {
  act(() => raiz?.unmount());
  caixa?.remove();
  raiz = null;
  caixa = null;
});

const esperar = (s: number) => act(() => new Promise<void>((r) => setTimeout(r, s * 1000)));
const clicar = (el: Element | null) => act(() => (el as HTMLElement).click());
const opacidade = (el: Element | null) => Number(getComputedStyle(el as HTMLElement).opacity || '1');

type Tel = { numero: string };
function Lista({ reduzido = false, naTela = false }: { reduzido?: boolean; naTela?: boolean }) {
  const form = useForm<{ telefones: Tel[] }>({ defaultValues: { telefones: [{ numero: '51999887766' }, { numero: '5133224455' }] } });
  const lista = (
    <TForm form={form} onSubmit={() => {}}>
      <TFieldList<Tel>
        name="telefones"
        rotuloAdicionar="Acrescentar telefone"
        rotuloLinha={(i) => `Telefone ${i + 1}`}
        novaLinha={{ numero: '' }}
        colunas={[{ name: 'numero', componente: (c) => <TEntry name={c} label="Número" mascara="telefone" /> }]}
      />
    </TForm>
  );
  const conteudo = naTela ? <Tela coreografia="formulario">{lista}</Tela> : lista;
  return <MotionConfig reducedMotion={reduzido ? 'always' : 'never'}>{conteudo}</MotionConfig>;
}

const linhas = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-linha-lista]'));
const acrescentar = (c: HTMLElement) => c.querySelector('[data-acrescentar]');
const remover = (c: HTMLElement, n: number) => c.querySelector(`[aria-label="Remover Telefone ${n}"]`);

describe('linhaDaLista no TFieldList', () => {
  it('as linhas que vêm com o formulário não animam sozinhas; a acrescentada abre, aparece e recebe o foco', async () => {
    const c = montar(<Lista />);
    expect(linhas(c)).toHaveLength(2);
    for (const l of linhas(c)) expect(opacidade(l)).toBe(1);

    clicar(acrescentar(c));
    const nova = linhas(c)[2];
    expect(nova.style.height).toBe('0px');
    expect(opacidade(nova)).toBe(0);
    expect(nova.contains(document.activeElement)).toBe(true);
    expect((document.activeElement as HTMLElement).tagName).toBe('INPUT');

    await esperar(0.6);
    expect(opacidade(nova)).toBe(1);
    expect(['', 'auto']).toContain(nova.style.height);
  });

  it('a removida fica inert enquanto sai, o foco vai ao Acrescentar e depois ela some do DOM', async () => {
    const c = montar(<Lista />);
    clicar(remover(c, 2));
    const saindo = c.querySelector<HTMLElement>('[data-linha-lista][data-saindo]');
    expect(saindo).not.toBeNull();
    expect(saindo!.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(acrescentar(c));

    await esperar(0.6);
    expect(linhas(c)).toHaveLength(1);
    expect(c.querySelector('[data-saindo]')).toBeNull();
  });

  it('acrescentar logo depois de remover a última: o foco vai à linha nova, nunca à que está saindo', async () => {
    const c = montar(<Lista />);
    clicar(remover(c, 2));
    clicar(acrescentar(c));
    const ativo = document.activeElement as HTMLElement;
    expect(ativo.tagName).toBe('INPUT');
    expect(ativo.closest('[data-linha-lista]')!.hasAttribute('data-saindo')).toBe(false);
    await esperar(0.6);
  });

  it('dentro de uma <Tela>, os campos das linhas iniciais entram na cascata do cartão', async () => {
    const c = montar(<Lista naTela />);
    const campo = c.querySelector('[data-linha="0"] [data-kit="TEntry"]');
    expect(opacidade(campo)).toBe(0);
    await esperar(1.2);
    expect(opacidade(campo)).toBe(1);
  });

  it('movimento reduzido: só opacidade, sem altura', async () => {
    const c = montar(<Lista reduzido />);
    clicar(acrescentar(c));
    const nova = linhas(c)[2];
    expect(nova.style.height).toBe('');
    expect(nova.style.transform).toBe('');
    expect(opacidade(nova)).toBe(0);
    await esperar(0.4);
    expect(opacidade(nova)).toBe(1);
  });
});

describe('TrocaDeBlocos (PF ↔ PJ)', () => {
  let trocar: (v: string) => void = () => {};
  function Troca({ reduzido = false }: { reduzido?: boolean }) {
    const [tipo, setTipo] = useState('FISICA');
    trocar = setTipo;
    return (
      <MotionConfig reducedMotion={reduzido ? 'always' : 'never'}>
        <TrocaDeBlocos chave={tipo}>
          <span data-bloco={tipo} />
        </TrocaDeBlocos>
      </MotionConfig>
    );
  }
  const bloco = (c: HTMLElement, t: string) => c.querySelector(`[data-bloco="${t}"]`)!.closest<HTMLElement>('[data-linha-lista]')!;

  it('o primeiro bloco não anima; o novo abre no lugar enquanto o antigo recolhe (inert)', async () => {
    const c = montar(<Troca />);
    expect(opacidade(bloco(c, 'FISICA'))).toBe(1);
    act(() => trocar('JURIDICA'));
    expect(bloco(c, 'FISICA').hasAttribute('inert')).toBe(true);
    expect(bloco(c, 'JURIDICA').style.height).toBe('0px');
    await esperar(0.6);
    expect(c.querySelector('[data-bloco="FISICA"]')).toBeNull();
    expect(opacidade(bloco(c, 'JURIDICA'))).toBe(1);

    // voltar ao primeiro também anima
    act(() => trocar('FISICA'));
    expect(bloco(c, 'FISICA').style.height).toBe('0px');
    await esperar(0.6);
  });

  it('para o pai a troca é um filho só: os dois blocos ficam no mesmo contêiner, sem vão entre eles', async () => {
    const c = montar(<Troca />);
    const contem = c.querySelector<HTMLElement>('[data-troca-blocos]')!;
    expect(c.children).toHaveLength(1);
    expect(c.firstElementChild).toBe(contem);
    expect(contem.className).toBe('');
    // cada bloco é a pilha do formulário por padrão
    expect(bloco(c, 'FISICA').className).toBe('flex flex-col gap-4');

    act(() => trocar('JURIDICA'));
    // durante a troca, os dois blocos estão dentro do contêiner, que continua sendo o único filho do pai
    expect(c.children).toHaveLength(1);
    expect(Array.from(contem.children)).toEqual([bloco(c, 'FISICA'), bloco(c, 'JURIDICA')]);
    await esperar(0.6);
    expect(c.children).toHaveLength(1);
    expect(Array.from(contem.children)).toEqual([bloco(c, 'JURIDICA')]);
  });

  it('className substitui a pilha padrão do bloco', () => {
    const c = montar(
      <TrocaDeBlocos chave="FISICA" className="grid">
        <span data-bloco="FISICA" />
      </TrocaDeBlocos>,
    );
    expect(bloco(c, 'FISICA').className).toBe('grid');
  });

  it('movimento reduzido: o antigo sai na hora e o novo só esmaece', async () => {
    const c = montar(<Troca reduzido />);
    act(() => trocar('JURIDICA'));
    expect(bloco(c, 'JURIDICA').style.height).toBe('');
    expect(opacidade(bloco(c, 'JURIDICA'))).toBe(0);
    await esperar(0.1);
    expect(c.querySelector('[data-bloco="FISICA"]')).toBeNull();
    await esperar(0.3);
    expect(opacidade(bloco(c, 'JURIDICA'))).toBe(1);
  });
});
