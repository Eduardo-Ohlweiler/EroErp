import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UsuarioDaCascaProvider } from '../../shared/sessao/SessaoProvider';
import type { UsuarioLogado } from '../../shared/api/tipos';
import { DocumentoLista, Folha, pedacosDoEmail, regraDoRodape, textoCss, textoDoRodape, textoDosFiltros } from './impressao';

const linhas = [
  { id: 1, nome: 'Demo Solar', u: '2 de 5' },
  { id: 2, nome: 'Demo Marina', u: '4 de 10' },
];
const colunas = [
  { titulo: 'Nome', valor: (l: (typeof linhas)[number]) => l.nome },
  { titulo: 'Usuários', numerica: true, valor: (l: (typeof linhas)[number]) => l.u },
];
const geradoEm = new Date(2026, 10, 13, 14, 32);

describe('folha impressa (docs/08)', () => {
  it('escreve o texto do rodapé como string CSS sem fechar o <style>', () => {
    expect(textoCss('a "b" c\\d')).toBe('"a \\"b\\" c\\\\d"');
    expect(textoCss('x</style><b>')).toBe('"x\\3c /style>\\3c b>"');
    expect(textoCss('um\ndois')).toBe('"um dois"');
  });

  it('o rodapé é CRM Glass · data · nome do usuário, e a página vem do @page', () => {
    const texto = textoDoRodape({ usuario: 'Ana Souza', geradoEm });
    expect(texto).toMatch(/^CRM Glass · 13\/11\/2026.*14:32 · gerado por Ana Souza$/);
    const regra = regraDoRodape(texto);
    expect(regra).toContain('@bottom-left');
    expect(regra).toContain('"Página " counter(page) " de " counter(pages)');
  });

  it('sem nome, o rodapé fica só "CRM Glass · data"', () => {
    expect(textoDoRodape({ usuario: '  ', geradoEm })).toMatch(/^CRM Glass · 13\/11\/2026[^·]*14:32$/);
    expect(textoDoRodape({ usuario: null, geradoEm })).not.toContain('gerado por');
  });

  it('filtro vazio não aparece; nenhum vira "sem filtro aplicado"', () => {
    expect(textoDosFiltros([{ rotulo: 'Nome', valor: '  ' }])).toBe('sem filtro aplicado');
    expect(textoDosFiltros([{ rotulo: 'Nome', valor: ' Solar ' }, { rotulo: 'Situação', valor: '' }])).toBe('Nome: Solar');
  });

  it('a lista leva cabeçalho (logo, emitente, título), filtros com a contagem e as linhas', () => {
    const html = renderToStaticMarkup(
      <DocumentoLista titulo="Contratantes" colunas={colunas} linhas={linhas} chaveDe={(l) => l.id} filtros={[{ rotulo: 'Situação', valor: 'Ativos' }]} emitente="Demo Solar" usuario="Ana Souza" geradoEm={geradoEm} />,
    );
    expect(html).toContain('<thead><tr><td><header class="folha-cabecalho">');
    expect(html).toContain('aria-label="Ero ERP"');
    expect(html).toContain('>ERP</text>');
    expect(html).toContain('<p class="folha-emitente">Demo Solar</p>');
    expect(html).toContain('<h1 class="folha-titulo">Contratantes</h1>');
    expect(html).toContain('Situação: Ativos · 2 registros');
    expect(html).toContain('gerado por Ana Souza');
    expect(html).toContain('<td class="folha-num">4 de 10</td>');
  });

  it('e-mail ganha ponto de quebra só depois do @ e dos pontos', () => {
    expect(pedacosDoEmail('contato@demomarina.test')).toEqual(['contato@', 'demomarina.', 'test']);
    expect(pedacosDoEmail('a.b@c.com.br')).toEqual(['a.', 'b@', 'c.', 'com.', 'br']);
    expect(pedacosDoEmail('')).toEqual(['']);
    type L = { id: number; e: string };
    const emails: L[] = [{ id: 1, e: 'contato@demomarina.test' }];
    const html = renderToStaticMarkup(
      <DocumentoLista
        titulo="X"
        colunas={[
          { titulo: 'E-mail', quebra: 'email', valor: (l: L) => l.e },
          { titulo: 'Bruto', valor: (l: L) => l.e },
        ]}
        linhas={emails}
        chaveDe={(l) => l.id}
        filtros={[]}
      />,
    );
    expect(html).toContain('<td>contato@<wbr/>demomarina.<wbr/>test</td>');
    // sem `quebra`, o texto vai puro
    expect(html).toContain('<td>contato@demomarina.test</td>');
  });

  it('anuncia o que o teto cortou', () => {
    const html = renderToStaticMarkup(<DocumentoLista titulo="X" colunas={colunas} linhas={linhas} chaveDe={(l) => l.id} filtros={[]} truncado={1500} />);
    expect(html).toContain('sem filtro aplicado · 2 registros');
    expect(html).toContain('Mais 1.500 registros atendem ao filtro');
  });

  it('emitente e nome do usuário vêm da sessão (nunca o e-mail); fora da casca, "CRM Glass" e sem usuário', () => {
    const fora = renderToStaticMarkup(<Folha titulo="T">corpo</Folha>);
    expect(fora).toContain('<p class="folha-emitente">CRM Glass</p>');
    expect(fora).not.toContain('gerado por');
    expect(fora).not.toContain('folha-filtros');

    const usuario = { id: 'u1', nome: 'Ana', email: 'ana@solar.com', papel: 'ADMIN', tenantId: 't1', tenantNome: 'Demo Solar' } as UsuarioLogado;
    const dentro = renderToStaticMarkup(
      <UsuarioDaCascaProvider value={usuario}>
        <Folha titulo="T">corpo</Folha>
      </UsuarioDaCascaProvider>,
    );
    expect(dentro).toContain('<p class="folha-emitente">Demo Solar</p>');
    expect(dentro).toContain('gerado por Ana');
    expect(dentro).not.toContain('ana@solar.com');

    const semNome = renderToStaticMarkup(
      <UsuarioDaCascaProvider value={{ ...usuario, nome: '' }}>
        <Folha titulo="T">corpo</Folha>
      </UsuarioDaCascaProvider>,
    );
    expect(semNome).not.toContain('gerado por');
    expect(semNome).not.toContain('ana@solar.com');
  });
});
