import { describe, expect, it } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Tags, Users } from 'lucide-react';
import { erroDeProblemDetail } from '../../shared/api/erros';
import { caminhoDoCampo, tratarErroApi } from './erroApi';
import { valorCompleto } from './mascaras';
import { larguraDoCombo, ROTULO_MAX_DO_COMBO } from './opcoes';
import { opcoesDoTCombo, TCombo } from './TCombo';
import { LINHAS_DO_TTEXTAREA, textoDoContador, TTextArea } from './TTextArea';
import { linhaParaAcrescentar, linhasDasColunas, marcarPrincipal, principalDepoisDeRemover } from './fieldList';
import { TFieldList } from './TFieldList';
import { TForm } from './TForm';
import { TEntry } from './TEntry';
import { TRow } from './TRow';
import { focoPelaTecla } from '../shell/Submenu';
import { itemAtivo, secoesDaBarraInferior, telasDoMenu, type ItemMenu, type SecaoMenu } from '../shell/navegacao';
import { MobileNav, Sidebar } from '../shell/Sidebar';

const html = (el: ReactElement) => renderToStaticMarkup(el);

describe('erroApi com colchetes (Pessoas)', () => {
  it('telefones[0].numero vira telefones.0.numero; caminho sem lista não muda', () => {
    expect(caminhoDoCampo('telefones[0].numero')).toBe('telefones.0.numero');
    expect(caminhoDoCampo('enderecos[12].cidadeId')).toBe('enderecos.12.cidadeId');
    expect(caminhoDoCampo('a[1].b[2].c')).toBe('a.1.b.2.c');
    expect(caminhoDoCampo('administrador.email')).toBe('administrador.email');
  });

  it('o 400 marca o campo da linha pelo caminho com ponto', () => {
    const e = erroDeProblemDetail(400, { detail: 'Inválido', erros: [{ campo: 'telefones[1].numero', mensagem: 'Telefone inválido.' }] });
    const t = tratarErroApi(e, (c) => c === 'telefones.1.numero');
    expect(t).toMatchObject({ tipo: 'campos', campos: [{ campo: 'telefones.1.numero', mensagem: 'Telefone inválido.' }], semCampo: [] });
  });
});

describe('TEntry.onCompletar', () => {
  it('a máscara completa devolve o cru; incompleta, null', () => {
    expect(valorCompleto('cep', '90610-00')).toBeNull();
    expect(valorCompleto('cep', '90610-000')).toBe('90610000');
    expect(valorCompleto('cpf', '123.456.789-09')).toBe('12345678909');
    expect(valorCompleto('cpfCnpj', '123.456.789-09')).toBeNull();
    expect(valorCompleto('telefone', '(51) 99988-7766')).toBe('51999887766');
    expect(valorCompleto('moeda', '1.234,56')).toBeNull();
    expect(valorCompleto(undefined, '90610000')).toBeNull();
  });
});

describe('TCombo com largura automática', () => {
  it('até 18 caracteres situacao, até 36 medio, acima metade (a régua do medir-campos.mjs)', () => {
    expect(ROTULO_MAX_DO_COMBO).toEqual({ situacao: 18, medio: 36 });
    expect(larguraDoCombo(18)).toBe('situacao');
    expect(larguraDoCombo(19)).toBe('medio');
    expect(larguraDoCombo(36)).toBe('medio');
    expect(larguraDoCombo(37)).toBe('metade');
  });

  it('o inativo gravado aparece como "(inativo)" e conta na largura', () => {
    expect(opcoesDoTCombo([{ valor: 'a', rotulo: 'Celular' }, { valor: 'b', rotulo: 'Fax', inativo: true }], 'Todos')).toEqual([
      { valor: '', rotulo: 'Todos' },
      { valor: 'a', rotulo: 'Celular' },
      { valor: 'b', rotulo: 'Fax (inativo)' },
    ]);
    const curto = html(
      <TRow>
        <TCombo label="Tipo" opcoes={[{ valor: 'a', rotulo: 'Celular' }]} />
      </TRow>,
    );
    expect(curto).toContain('data-largura="situacao"');
    const comInativo = html(
      <TRow>
        <TCombo label="Tipo" opcoes={[{ valor: 'a', rotulo: 'Celular' }, { valor: 'b', rotulo: 'Recado com a vizinha', inativo: true }]} value="b" onChange={() => {}} />
      </TRow>,
    );
    expect(comInativo).toContain('data-largura="medio"');
    expect(comInativo).toContain('data-rotulo-max="30"');
    // width explícito continua valendo; fora da TRow, a célula
    expect(html(<TRow><TCombo label="Tipo" width="cpf" opcoes={[{ valor: 'b', rotulo: 'Um nome bem comprido de tipo' }]} /></TRow>)).toContain('data-largura="cpf"');
    expect(html(<TCombo label="Tipo" opcoes={[{ valor: 'b', rotulo: 'Um nome bem comprido de tipo' }]} />)).toContain('data-largura="celula"');
  });
});

describe('TTextArea', () => {
  it('contador: vazio diz o máximo; com texto, quanto já foi', () => {
    expect(textoDoContador(0, 500)).toBe('máx. 500 caracteres');
    expect(textoDoContador(120, 500)).toBe('120 de 500 caracteres');
    expect(textoDoContador(3)).toBeUndefined();
  });

  it('largura longo, 3 linhas, contador na ajuda; só leitura sem contador, readOnly', () => {
    function Form({ somenteLeitura }: { somenteLeitura?: boolean }) {
      const form = useForm({ defaultValues: { observacao: 'Oi' } });
      return (
        <TForm form={form} onSubmit={() => {}} somenteLeitura={somenteLeitura}>
          <TRow>
            <TTextArea name="observacao" label="Observação" maxLength={500} />
          </TRow>
        </TForm>
      );
    }
    const h = html(<Form />);
    expect(h).toContain('data-kit="TTextArea"');
    expect(h).toContain('data-largura="longo"');
    expect(h).toContain(`rows="${LINHAS_DO_TTEXTAREA}"`);
    expect(h).toContain('2 de 500 caracteres');
    expect(h).toContain('input-area');
    const ro = html(<Form somenteLeitura />);
    expect(ro).toContain('readOnly=""');
    expect(ro).not.toContain('de 500 caracteres');
  });
});

describe('TFieldList: regras puras', () => {
  it('colunas de uma linha ou de várias', () => {
    expect(linhasDasColunas([1, 2])).toEqual([[1, 2]]);
    expect(linhasDasColunas([[1], [2, 3]])).toEqual([[1], [2, 3]]);
  });

  it('a 1ª linha acrescentada vem principal; as seguintes, não', () => {
    expect(linhaParaAcrescentar({ n: '', principal: false }, [], 'principal')).toEqual({ n: '', principal: true });
    expect(linhaParaAcrescentar({ n: '', principal: false }, [{ n: 'a', principal: true }], 'principal')).toEqual({ n: '', principal: false });
    expect(linhaParaAcrescentar({ n: '' }, [], undefined)).toEqual({ n: '' });
  });

  it('remover a principal passa a marca para a 1ª que sobrou', () => {
    const l = [{ principal: false }, { principal: true }, { principal: false }];
    expect(principalDepoisDeRemover(l, 1, 'principal')).toBe(0);
    expect(principalDepoisDeRemover(l, 0, 'principal')).toBeNull();
    expect(principalDepoisDeRemover([{ principal: true }], 0, 'principal')).toBeNull();
    expect(principalDepoisDeRemover(l, 1, undefined)).toBeNull();
  });

  it('marcar uma desmarca as outras', () => {
    expect(marcarPrincipal(3, 1)).toEqual([false, true, false]);
  });
});

describe('TFieldList: tela', () => {
  type Tel = { numero: string; principal: boolean };
  function Lista({ somenteLeitura, variasLinhas, minimo, acoes }: { somenteLeitura?: boolean; variasLinhas?: boolean; minimo?: number; acoes?: ReactNode }) {
    const form = useForm<{ telefones: Tel[] }>({
      defaultValues: { telefones: [{ numero: '51999887766', principal: true }, { numero: '5133224455', principal: false }] },
    });
    const numero = { name: 'numero', componente: (campo: string) => <TEntry name={campo} label="Número" mascara="telefone" /> };
    const obs = { name: 'obs', dividir: true, componente: (campo: string) => <TEntry name={campo} label="Observação" /> };
    return (
      <TForm form={form} onSubmit={() => {}} somenteLeitura={somenteLeitura}>
        <TFieldList<Tel>
          name="telefones"
          principal="principal"
          minimo={minimo}
          acoes={acoes}
          rotuloAdicionar="Acrescentar telefone"
          rotuloLinha={(i) => `Telefone ${i + 1}`}
          novaLinha={{ numero: '', principal: false }}
          colunas={variasLinhas ? [[numero], [obs]] : [numero, obs]}
        />
      </TForm>
    );
  }

  it('uma linha por item: name completo, rádio Principal exclusivo, remover com o nome da linha, Acrescentar', () => {
    const h = html(<Lista />);
    expect(h).toContain('data-kit="TFieldList"');
    expect(h).toContain('data-linhas="2"');
    expect(h).toContain('role="group" aria-label="Telefone 1"');
    expect(h).toContain('value="(51) 99988-7766"');
    expect(h.match(/type="radio"/g)).toHaveLength(2);
    expect(h.match(/checked=""/g)).toHaveLength(1);
    expect(h).toContain('aria-label="Remover Telefone 2"');
    expect(h).toContain('Acrescentar telefone');
    // coluna `dividir` vai numa TCol sem largura
    expect(h).toContain('data-kit="TCol"');
  });

  it('item em várias linhas: uma TRow por grupo, com a borda do item', () => {
    const h = html(<Lista variasLinhas />);
    const item = h.split('data-linha="0"')[1].split('data-linha="1"')[0];
    expect(item.match(/data-kit="TRow"/g)).toHaveLength(2);
    expect(h).toContain('rounded-2xl border border-line');
  });

  it('só leitura: sem Acrescentar e sem remover; o rádio fica, focável e readOnly', () => {
    const h = html(<Lista somenteLeitura />);
    expect(h).not.toContain('Acrescentar telefone');
    expect(h).not.toContain('Remover Telefone');
    expect(h.match(/type="radio"/g)).toHaveLength(2);
    expect(h).not.toMatch(/type="radio"[^>]*disabled/);
  });

  it('acoes: os botões extras ficam ao lado do Acrescentar, no grupo que quebra no celular; somem em só leitura', () => {
    const extra = <button type="button">Todas as filiais</button>;
    const h = html(<Lista acoes={extra} />);
    expect(h).toMatch(/data-kit="TFieldList-acoes" class="[^"]*flex-wrap/);
    const grupo = h.split('data-kit="TFieldList-acoes"')[1];
    expect(grupo.indexOf('Acrescentar telefone')).toBeGreaterThan(-1);
    expect(grupo.indexOf('Acrescentar telefone')).toBeLessThan(grupo.indexOf('Todas as filiais'));
    expect(html(<Lista somenteLeitura acoes={extra} />)).not.toContain('Todas as filiais');
    expect(html(<Lista />)).not.toContain('Todas as filiais');
  });

  it('minimo: não oferece remover abaixo dele', () => {
    expect(html(<Lista minimo={2} />)).not.toContain('Remover Telefone');
  });
});

describe('casca: seções e submenu', () => {
  const auxiliares: ItemMenu = {
    to: '/cadastros/auxiliares',
    label: 'Cadastros auxiliares',
    icon: Tags,
    filhos: [
      { to: '/cadastros/auxiliares/tipos-de-telefone', label: 'Tipos de telefone', icon: Phone },
      { to: '/cadastros/auxiliares/tipos-de-email', label: 'Tipos de e-mail', icon: Mail },
    ],
  };
  const secoes: SecaoMenu[] = [
    { rotulo: 'Principal', itens: [{ to: '/', label: 'Início', icon: Users }] },
    { rotulo: 'Cadastros', itens: [{ to: '/cadastros/pessoas', label: 'Pessoas', icon: Users }, auxiliares] },
    { rotulo: 'Administrativo', itens: [] },
  ];

  it('Ctrl+K: os filhos entram com o caminho do pai; o pai não é tela', () => {
    expect(telasDoMenu(secoes).map((t) => `${t.secao}: ${t.rotulo}`)).toEqual([
      'Principal: Início',
      'Cadastros: Pessoas',
      'Cadastros: Cadastros auxiliares › Tipos de telefone',
      'Cadastros: Cadastros auxiliares › Tipos de e-mail',
    ]);
  });

  it('pai ativo quando a rota está sob ele ou num filho', () => {
    expect(itemAtivo('/cadastros/auxiliares/tipos-de-email', auxiliares)).toBe(true);
    expect(itemAtivo('/cadastros/pessoas', auxiliares)).toBe(false);
  });

  it('barra inferior: no máximo 5 contando as seções na ordem; acima disso o 5º lugar é "Mais" (navegacao.test)', () => {
    const muitas: SecaoMenu[] = [
      { rotulo: 'A', itens: [1, 2, 3].map((n) => ({ to: `/a${n}`, label: `A${n}`, icon: Users })) },
      { rotulo: 'B', itens: [1, 2, 3].map((n) => ({ to: `/b${n}`, label: `B${n}`, icon: Users })) },
      { rotulo: 'C', itens: [{ to: '/c', label: 'C', icon: Users }] },
    ];
    const r = secoesDaBarraInferior(muitas);
    expect(r.map((s) => [s.rotulo, s.itens.length])).toEqual([
      ['A', 3],
      ['B', 1],
      ['Mais telas', 1],
    ]);
  });

  it('teclas do botão do pai: setas abrem no 1º ou no último filho', () => {
    expect(focoPelaTecla('ArrowDown', 'direita')).toBe('primeiro');
    expect(focoPelaTecla('ArrowRight', 'direita')).toBe('primeiro');
    expect(focoPelaTecla('ArrowUp', 'acima')).toBe('ultimo');
    expect(focoPelaTecla('ArrowRight', 'acima')).toBeNull();
    expect(focoPelaTecla('a', 'direita')).toBeNull();
  });

  it('trilho e barra: um nav por seção com rótulo; o pai com filhos é botão de menu fechado', () => {
    const h = html(
      <MemoryRouter initialEntries={['/cadastros/auxiliares/tipos-de-email']}>
        <Sidebar secoes={secoes} onSair={() => {}} />
        <MobileNav secoes={secoes} />
      </MemoryRouter>,
    );
    expect(h.match(/<nav aria-label="Cadastros"/g)).toHaveLength(2);
    expect(h).not.toContain('aria-label="Administrativo"');
    expect(h).toMatch(/aria-haspopup="menu"[^>]*aria-expanded="false"|aria-expanded="false"[^>]*aria-haspopup="menu"/);
    expect(h).toContain('aria-label="Cadastros auxiliares"');
    expect(h).toContain('data-ativo="true"');
  });
});
