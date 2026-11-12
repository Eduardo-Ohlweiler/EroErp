import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MotionConfig } from 'motion/react';
import { Button } from './Button';

const html = (el: ReactElement) => renderToStaticMarkup(el);

describe('Button carregando', () => {
  it('sem a prop, não muda a estrutura do botão', () => {
    const h = html(<Button>Salvar</Button>);
    expect(h).toBe(h.replace('inline-grid', ''));
    expect(h).not.toContain('aria-busy');
    expect(h).toContain('>Salvar</button>');
  });

  it('carregando: aria-disabled (não disabled, continua focável), aria-busy, sem esmaecer e girando', () => {
    const h = html(<Button carregando>Salvar</Button>);
    expect(h).not.toMatch(/<button[^>]*\sdisabled=""/);
    expect(h).toContain('aria-disabled="true"');
    expect(h).toContain('aria-busy="true"');
    expect(h).toContain('cursor-progress');
    expect(h).not.toContain('disabled:opacity-50');
    expect(h).toContain('carregando-giro');
  });

  it('disabled comum continua disabled, também carregando', () => {
    expect(html(<Button disabled>Salvar</Button>)).toMatch(/<button[^>]*\sdisabled=""/);
    const h = html(
      <Button disabled carregando>
        Salvar
      </Button>,
    );
    expect(h).toMatch(/<button[^>]*\sdisabled=""/);
    expect(h).not.toContain('aria-disabled');
    expect(h).not.toContain('cursor-progress');
  });

  it('sem textoCarregando, o rótulo fica transparente mas acessível (não some da árvore)', () => {
    const h = html(<Button carregando>Salvar</Button>);
    expect(h).toMatch(/class="[^"]*opacity-0[^"]*">Salvar</);
    expect(h).not.toMatch(/class="[^"]*invisible[^"]*">Salvar</);
  });

  it('com textoCarregando, o rótulo sai e o texto de carregando vira o nome do botão', () => {
    const h = html(
      <Button carregando textoCarregando="Entrando…">
        Entrar
      </Button>,
    );
    expect(h).toMatch(/class="[^"]*invisible[^"]*">Entrar</);
    expect(h).toContain('Entrando…');
  });

  it('parado: a camada de carregando reserva a largura mas fica invisível e fora do leitor de tela', () => {
    const h = html(
      <Button carregando={false} textoCarregando="Entrando…">
        Entrar
      </Button>,
    );
    expect(h).not.toContain('aria-busy');
    expect(h).not.toContain('aria-disabled');
    expect(h).not.toMatch(/<button[^>]*\sdisabled=""/);
    expect(h).toMatch(/class="[^"]*invisible[^"]*" aria-hidden="true">/);
    expect(h).not.toContain('carregando-giro');
  });

  it('movimento reduzido (sistema ou contratante): pulsa de leve em vez de girar', () => {
    const h = html(
      <MotionConfig reducedMotion="always">
        <Button carregando>Salvar</Button>
      </MotionConfig>,
    );
    expect(h).toContain('carregando-pulso');
    expect(h).not.toContain('carregando-giro');
  });
});
