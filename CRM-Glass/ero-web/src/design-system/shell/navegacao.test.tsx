import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { Ellipsis, Mail, Phone, ScrollText, Tags, Users } from 'lucide-react';
import {
  itemAtivo,
  MAXIMO_NA_BARRA_INFERIOR,
  ROTA_DO_MAIS,
  ROTULO_DO_MAIS,
  SECAO_DO_MAIS,
  secoesDaBarraInferior,
  type ItemMenu,
  type SecaoMenu,
} from './navegacao';
import { MobileNav } from './Sidebar';

const item = (to: string, label: string): ItemMenu => ({ to, label, icon: Users });
const auxiliares: ItemMenu = {
  to: '/cadastros/auxiliares',
  label: 'Cadastros auxiliares',
  icon: Tags,
  filhos: [
    { to: '/cadastros/auxiliares/tipos-de-telefone', label: 'Tipos de telefone', icon: Phone },
    { to: '/cadastros/auxiliares/tipos-de-email', label: 'Tipos de e-mail', icon: Mail },
  ],
};
/** O menu de hoje (5 itens): Início · Pessoas, Auxiliares · Usuários, Logs. */
const HOJE: SecaoMenu[] = [
  { rotulo: 'Principal', itens: [item('/', 'Início')] },
  { rotulo: 'Cadastros', itens: [item('/cadastros/pessoas', 'Pessoas'), auxiliares] },
  { rotulo: 'Administrativo', itens: [item('/admin/usuarios', 'Usuários'), { to: '/admin/logs', label: 'Logs', icon: ScrollText }] },
];
/** Com Filiais (6 itens): o 6º não cabe. */
const COM_FILIAIS: SecaoMenu[] = [
  HOJE[0],
  { rotulo: 'Cadastros', itens: [item('/cadastros/pessoas', 'Pessoas'), item('/cadastros/filiais', 'Filiais'), auxiliares] },
  HOJE[2],
];
const rotulos = (secoes: SecaoMenu[]) => secoes.map((s) => `${s.rotulo}: ${s.itens.map((i) => i.label).join(', ')}`);

describe('barra inferior com "Mais" (P2 de Filiais)', () => {
  it('até o máximo, entra tudo, sem "Mais"; seção vazia some', () => {
    expect(MAXIMO_NA_BARRA_INFERIOR).toBe(5);
    const r = secoesDaBarraInferior([...HOJE, { rotulo: 'Vazia', itens: [] }]);
    expect(rotulos(r)).toEqual(['Principal: Início', 'Cadastros: Pessoas, Cadastros auxiliares', 'Administrativo: Usuários, Logs']);
    expect(r.flatMap((s) => s.itens).some((i) => i.to === ROTA_DO_MAIS)).toBe(false);
  });

  it('passou de 5: os 4 primeiros e "Mais" no 5º lugar, com o resto achatado como no Ctrl+K', () => {
    const r = secoesDaBarraInferior(COM_FILIAIS);
    expect(rotulos(r)).toEqual(['Principal: Início', 'Cadastros: Pessoas, Filiais, Cadastros auxiliares', `${SECAO_DO_MAIS}: ${ROTULO_DO_MAIS}`]);
    expect(r.flatMap((s) => s.itens)).toHaveLength(MAXIMO_NA_BARRA_INFERIOR);
    const mais = r[r.length - 1].itens[0];
    expect(mais.icon).toBe(Ellipsis);
    expect(mais.filhos?.map((f) => [f.label, f.to])).toEqual([
      ['Usuários', '/admin/usuarios'],
      ['Logs', '/admin/logs'],
    ]);
  });

  it('o pai com filhos que cai no "Mais" sai achatado (pai › filho), sem filhos próprios', () => {
    const r = secoesDaBarraInferior([
      { rotulo: 'A', itens: [item('/a1', 'A1'), item('/a2', 'A2'), item('/a3', 'A3'), item('/a4', 'A4')] },
      { rotulo: 'B', itens: [auxiliares, item('/b2', 'B2')] },
    ]);
    const mais = r[r.length - 1].itens[0];
    expect(mais.filhos?.map((f) => f.label)).toEqual(['Cadastros auxiliares › Tipos de telefone', 'Cadastros auxiliares › Tipos de e-mail', 'B2']);
    expect(mais.filhos?.every((f) => !f.filhos)).toBe(true);
  });

  it('"Mais" fica ativo quando a rota está numa tela de dentro dele; a rota dele nunca casa', () => {
    const mais = secoesDaBarraInferior(COM_FILIAIS).at(-1)!.itens[0];
    expect(itemAtivo('/admin/logs', mais)).toBe(true);
    expect(itemAtivo('/admin/logs/123', mais)).toBe(true);
    expect(itemAtivo('/cadastros/pessoas', mais)).toBe(false);
    expect(itemAtivo('/', mais)).toBe(false);
  });

  it('a barra desenha o "Mais" como botão de menu fechado (aria-haspopup, aria-expanded), ativo na rota de dentro', () => {
    const h = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/logs']}>
        <MobileNav secoes={COM_FILIAIS} />
      </MemoryRouter>,
    );
    expect(h).toContain(`<nav aria-label="${SECAO_DO_MAIS}"`);
    const botao = /<button[^>]*aria-label="Mais"[^>]*>/.exec(h)?.[0] ?? '';
    expect(botao).toContain('aria-haspopup="menu"');
    expect(botao).toContain('aria-expanded="false"');
    expect(botao).toContain('data-ativo="true"');
    // Logs não aparece solto na barra: está dentro do "Mais"
    expect(h).not.toContain('aria-label="Logs"');
  });
});
