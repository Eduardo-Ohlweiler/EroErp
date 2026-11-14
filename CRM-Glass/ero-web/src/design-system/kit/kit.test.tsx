import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErroApi, erroDeProblemDetail } from '../../shared/api/erros';
import { classeDaLargura, CLASSE_LARGURA, LARGURA_PADRAO, larguraAplicada } from './larguras';
import { aplicarMascara, larguraPadraoDoEntry, valorParaExibir, valorParaGravar } from './mascaras';
import { somenteLeituraPara, SomenteLeituraDoForm } from './somenteLeitura';
import { avisoDosCampos, textoDeEspera, tratarErroApi } from './erroApi';
import { celulaCsv, montarCsv, nomeDeArquivo } from './planilha';
import { carregarAteOTeto, TETO_DE_EXPORTACAO } from './TAcoesDeExportacao';
import { foiAlterado } from './TAuditoria';
import { ehPerigo } from './useQuestion';
import { textoExibindo } from './TDataGridFooter';
import { TamanhoDoTButton, TButton } from './TButton';
import { TDataGrid } from './TDataGrid';
import { TEntry } from './TEntry';
import { TCombo } from './TCombo';
import { TRow } from './TRow';
import { SITUACAO_OPCOES } from './opcoes';

const html = (el: ReactElement) => renderToStaticMarkup(el);

describe('larguras (docs/07 §2)', () => {
  it('largura padrão de cada componente', () => {
    expect(LARGURA_PADRAO.TEntry).toBe('metade');
    expect(LARGURA_PADRAO.TCombo).toBe('situacao');
    expect(LARGURA_PADRAO.TDate).toBe('data');
    expect(LARGURA_PADRAO.TDateTime).toBe('dataHora');
    expect(LARGURA_PADRAO.TTextArea).toBe('longo');
    expect(LARGURA_PADRAO.TDBCombo).toBe('metade');
  });

  it('largura padrão do TEntry pela máscara', () => {
    expect(larguraPadraoDoEntry()).toBe('metade');
    expect(larguraPadraoDoEntry('cpf')).toBe('cpf');
    expect(larguraPadraoDoEntry('telefone')).toBe('cpf');
    expect(larguraPadraoDoEntry('celular')).toBe('cpf');
    expect(larguraPadraoDoEntry('cnpj')).toBe('cnpj');
    expect(larguraPadraoDoEntry('cpfCnpj')).toBe('cnpj');
    expect(larguraPadraoDoEntry('cep')).toBe('cep');
    expect(larguraPadraoDoEntry('hora')).toBe('hora');
    expect(larguraPadraoDoEntry('moeda')).toBe('valor');
    expect(larguraPadraoDoEntry('decimal')).toBe('valor');
    expect(larguraPadraoDoEntry('decimalComSinal')).toBe('valor');
    expect(larguraPadraoDoEntry('inteiro')).toBe('quantidade');
  });

  it('o padrão só vale dentro de TRow; width explícito vale sempre', () => {
    expect(larguraAplicada(undefined, 'metade', true)).toBe('metade');
    expect(larguraAplicada(undefined, 'metade', false)).toBe('celula');
    expect(larguraAplicada('cnpj', 'metade', false)).toBe('cnpj');
    expect(larguraAplicada('longo', 'metade', true)).toBe('longo');
    expect(classeDaLargura('celula')).toBe('w-full');
    expect(classeDaLargura('cnpj')).toBe('w-full sm:w-52 max-w-full');
    expect(CLASSE_LARGURA.metade).toBe('sm:w-1/2 sm:min-w-64');
  });

  it('o campo emite data-kit, data-largura e data-mascara no div de fora (§7.1)', () => {
    const dentro = html(
      <TRow>
        <TEntry label="CNPJ ou CPF" mascara="cpfCnpj" value="" onChange={() => {}} />
      </TRow>,
    );
    expect(dentro).toContain('data-kit="TRow"');
    expect(dentro).toMatch(/data-kit="TEntry"[^>]*data-largura="cnpj"[^>]*data-mascara="cpfCnpj"/);
    expect(dentro).toContain('sm:w-52');

    const fora = html(<TEntry label="Nome" value="" onChange={() => {}} />);
    expect(fora).toContain('data-largura="celula"');

    const combo = html(
      <TRow>
        <TCombo label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" value="" onChange={() => {}} />
      </TRow>,
    );
    expect(combo).toMatch(/data-kit="TCombo"[^>]*data-largura="situacao"/);
    expect(combo).toContain('role="combobox"');
  });
});

describe('máscaras do TEntry', () => {
  it('documento exibe pontuado e grava cru (CNPJ alfanumérico em maiúsculas)', () => {
    expect(aplicarMascara('cpfCnpj', '12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(valorParaGravar('cpfCnpj', '12.ABC.345/01DE-35')).toBe('12ABC34501DE35');
    expect(valorParaGravar('cpfCnpj', '123.456.789-09')).toBe('12345678909');
    expect(valorParaExibir('cpfCnpj', '12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
    expect(valorParaGravar('telefone', '(11) 98765-4321')).toBe('11987654321');
    expect(valorParaExibir('cep', '01310100')).toBe('01310-100');
  });

  it('numéricas gravam o texto da máscara; inteiro sem casas', () => {
    expect(aplicarMascara('inteiro', '0025')).toBe('25');
    expect(aplicarMascara('inteiro', '1a0')).toBe('10');
    expect(valorParaGravar('inteiro', '25')).toBe('25');
    expect(aplicarMascara('moeda', '7250')).toBe('72,50');
    expect(aplicarMascara('decimal', '70', { colou: true })).toBe('70,00');
    expect(aplicarMascara('decimal', '1234', { casas: 3 })).toBe('1,234');
    expect(valorParaExibir(undefined, null)).toBe('');
    expect(valorParaExibir('inteiro', 5)).toBe('5');
  });
});

describe('useSomenteLeitura', () => {
  it('sem grupo (tela presa ao papel) nunca é só leitura', () => {
    expect(somenteLeituraPara([], undefined)).toBe(false);
    expect(somenteLeituraPara(undefined)).toBe(false);
  });
  it('com grupo, só leitura quando falta <GRUPO>_ESCREVER', () => {
    expect(somenteLeituraPara(['USUARIOS_LER'], 'USUARIOS')).toBe(true);
    expect(somenteLeituraPara(['USUARIOS_LER', 'USUARIOS_ESCREVER'], 'USUARIOS')).toBe(false);
    expect(somenteLeituraPara(['PESSOAS_ESCREVER'], 'USUARIOS')).toBe(true);
    expect(somenteLeituraPara(undefined, 'USUARIOS')).toBe(true);
  });
});

describe('TButton', () => {
  const comLeitura = (sl: boolean, el: ReactElement) => html(<SomenteLeituraDoForm.Provider value={sl}>{el}</SomenteLeituraDoForm.Provider>);

  it('dentro de TForm somenteLeitura, salvar, novo, inativar e reativar não aparecem', () => {
    for (const v of ['salvar', 'novo', 'inativar', 'reativar'] as const) {
      expect(comLeitura(true, <TButton variant={v} />)).toBe('');
      expect(comLeitura(false, <TButton variant={v} />)).toContain(`data-variante="${v}"`);
    }
    for (const v of ['buscar', 'limpar', 'voltar', 'exportar', 'pdf', 'editar'] as const) {
      expect(comLeitura(true, <TButton variant={v} />)).toContain(`data-variante="${v}"`);
    }
  });

  it('ações trazem rótulo, cor e type="button"; label="" deixa só o ícone com aria-label e dica', () => {
    const salvar = html(<TButton variant="salvar" type="submit" />);
    expect(salvar).toContain('>Salvar<');
    expect(salvar).toContain('acao-sucesso');
    expect(salvar).toContain('type="submit"');
    expect(html(<TButton variant="limpar" />)).toContain('type="button"');
    expect(html(<TButton variant="pdf" />)).toContain('acao-alerta');
    expect(html(<TButton variant="novo" />)).toContain('accent-gradient');
    const editar = html(<TButton variant="editar" label="" size="sm" />);
    expect(editar).toContain('aria-label="Editar"');
    expect(editar).toContain('title="Editar"');
    expect(editar).not.toContain('>Editar<');
    expect(editar).toContain('size-8');
  });

  it('loading é o carregando do Button: aria-busy, continua focável', () => {
    const h = html(<TButton variant="salvar" loading />);
    expect(h).toContain('aria-busy="true"');
    expect(h).not.toMatch(/<button[^>]*\sdisabled=""/);
  });
});

describe('erroApi (docs/07 §3.3)', () => {
  const campos = new Set(['nome', 'administrador.email']);
  const temCampo = (c: string) => campos.has(c);

  it('400 marca o campo pelo caminho do DTO; o que a tela não tem vai para a mensagem', () => {
    const e = erroDeProblemDetail(400, {
      detail: 'Existem campos inválidos.',
      erros: [
        { campo: 'administrador.email', mensagem: 'E-mail já usado' },
        { campo: 'limite', mensagem: 'Limite inválido' },
      ],
    });
    const t = tratarErroApi(e, temCampo);
    expect(t.tipo).toBe('campos');
    if (t.tipo !== 'campos') return;
    expect(t.campos).toEqual([{ campo: 'administrador.email', mensagem: 'E-mail já usado' }]);
    expect(t.semCampo).toEqual([{ campo: 'limite', mensagem: 'Limite inválido' }]);
    expect(t.texto).toBe('Existem campos inválidos.');
  });

  it('400 sem formulário: nenhum campo marcado', () => {
    const e = erroDeProblemDetail(400, { erros: [{ campo: 'nome', mensagem: 'Obrigatório' }] });
    const t = tratarErroApi(e);
    expect(t.tipo === 'campos' && t.campos.length === 0 && t.semCampo.length === 1).toBe(true);
  });

  it('409 com erros (duplicidade) marca o campo pelo caminho, sem aviso e sem Recarregar', () => {
    const e = erroDeProblemDetail(409, {
      detail: 'Já existe um cadastro com estes dados.',
      codigo: 'CONFLITO',
      erros: [{ campo: 'administrador.email', mensagem: 'Este e-mail já está em uso.' }],
    });
    const t = tratarErroApi(e, temCampo);
    expect(t.tipo).toBe('campos');
    if (t.tipo !== 'campos') return;
    expect(t.campos).toEqual([{ campo: 'administrador.email', mensagem: 'Este e-mail já está em uso.' }]);
    expect(t.semCampo).toEqual([]);
    expect(avisoDosCampos(t)).toBeNull();
  });

  it('409 com erros que o form não tem: o detail num aviso comum, sem Recarregar', () => {
    const e = erroDeProblemDetail(409, {
      detail: 'Já existe um cadastro com estes dados.',
      codigo: 'CONFLITO',
      erros: [{ campo: 'documento', mensagem: 'Este documento já está em uso.' }],
    });
    const t = tratarErroApi(e, temCampo);
    expect(t.tipo).toBe('campos');
    if (t.tipo !== 'campos') return;
    expect(t.campos).toEqual([]);
    expect(avisoDosCampos(t)).toEqual({ titulo: 'Já existe um cadastro com estes dados.', descricao: 'Este documento já está em uso.' });
    // sem formulário, o mesmo
    const semForm = tratarErroApi(e);
    expect(semForm.tipo === 'campos' && avisoDosCampos(semForm)?.titulo).toBe('Já existe um cadastro com estes dados.');
  });

  it('409 sem erros (conflito de versão) oferece Recarregar', () => {
    const t = tratarErroApi(erroDeProblemDetail(409, { codigo: 'CONFLITO' }), temCampo);
    expect(t.tipo).toBe('conflito');
    if (t.tipo === 'conflito') expect(t.texto).toMatch(/alterado por outra pessoa/);
    const comDetail = tratarErroApi(erroDeProblemDetail(409, { detail: 'Outra pessoa salvou antes.', codigo: 'CONFLITO', erros: [] }));
    expect(comDetail).toEqual({ tipo: 'conflito', texto: 'Outra pessoa salvou antes.' });
  });

  it('429 lê o retryAfter', () => {
    const t = tratarErroApi(erroDeProblemDetail(429, { detail: 'Muitos códigos pedidos.' }, '42'));
    expect(t).toEqual({ tipo: 'espera', segundos: 42, texto: 'Muitos códigos pedidos. Tente de novo em 42 segundos.' });
    const semRetry = tratarErroApi(erroDeProblemDetail(429, {}));
    expect(semRetry.tipo === 'espera' && semRetry.segundos === null).toBe(true);
    expect(textoDeEspera(1)).toBe('1 segundo');
    expect(textoDeEspera(61)).toBe('2 minutos');
    expect(textoDeEspera(3600)).toBe('60 minutos');
  });

  it('401 não mostra nada; demais mostram o detail; erro que não é da API, texto genérico', () => {
    expect(tratarErroApi(new ErroApi({ status: 401 })).tipo).toBe('nada');
    expect(tratarErroApi(erroDeProblemDetail(422, { detail: 'Limite de usuários atingido.', correlationId: 'abc' }))).toEqual({
      tipo: 'mensagem',
      texto: 'Limite de usuários atingido.',
      codigo: 'abc',
    });
    expect(tratarErroApi(new Error('x'))).toEqual({ tipo: 'mensagem', texto: 'Não foi possível concluir a operação.' });
  });
});

describe('exportação', () => {
  it('CSV escapa separador, aspas e injeção de fórmula', () => {
    expect(celulaCsv('Ana')).toBe('Ana');
    expect(celulaCsv('a;b')).toBe('"a;b"');
    expect(celulaCsv('diz "oi"')).toBe('"diz ""oi"""');
    expect(celulaCsv('=cmd|x')).toBe("'=cmd|x");
    expect(celulaCsv('-1')).toBe("'-1");
    const csv = montarCsv([{ titulo: 'Nome', valor: (l: { n: string }) => l.n }], [{ n: 'Ana' }, { n: '@x' }]);
    expect(csv).toBe("Nome\r\nAna\r\n'@x");
    expect(nomeDeArquivo('Contratantes ativos', new Date(2026, 10, 13))).toBe('contratantes-ativos-2026-11-13');
  });

  it('CSV pega a fórmula escondida atrás de branco Unicode e nas formas de largura total', () => {
    // brancos à frente: NBSP, ideográfico, em-space, zero-width, BOM, espaço comum, tab e quebra
    for (const branco of [' ', '　', ' ', '​', '﻿', ' ', '\t', '\n', ' 　 ']) {
      expect(celulaCsv(`${branco}=HYPERLINK("http://x","y")`)).toBe(`"'${branco}=HYPERLINK(""http://x"",""y"")"`);
      expect(celulaCsv(`${branco}@SUM(A1);x`)).toBe(`"'${branco}@SUM(A1);x"`);
    }
    // largura total e pequena: ＝ ＋ － ＠ ﹦ ﹢ ﹣ ﹫
    for (const g of ['＝', '＋', '－', '＠', '﹦', '﹢', '﹣', '﹫']) {
      expect(celulaCsv(`${g}cmd|x`)).toBe(`'${g}cmd|x`);
      expect(celulaCsv(` ${g}cmd|x`)).toBe(`' ${g}cmd|x`);
    }
    expect(celulaCsv('\nlinha')).toBe(`"'\nlinha"`);
    // texto que só tem branco à frente, sem gatilho, segue igual
    expect(celulaCsv(' Ana')).toBe(' Ana');
    expect(celulaCsv('Ana = Bia')).toBe('Ana = Bia');
  });

  it('CSV deixa o negativo pt-BR seguir como número só na coluna numérica', () => {
    expect(celulaCsv('-1', true)).toBe('-1');
    expect(celulaCsv('-1.234,56', true)).toBe('-1.234,56');
    expect(celulaCsv('-12,5%', true)).toBe('-12,5%');
    // na coluna numérica, o que não é negativo puro leva o apóstrofo
    expect(celulaCsv('-1+cmd|x', true)).toBe("'-1+cmd|x");
    expect(celulaCsv('-SOMA(A1)', true)).toBe("'-SOMA(A1)");
    expect(celulaCsv(' -1', true)).toBe("' -1");
    expect(celulaCsv('－1', true)).toBe("'－1");
    expect(celulaCsv('=1', true)).toBe("'=1");
    // fora dela, "-1" é texto
    expect(celulaCsv('-1')).toBe("'-1");
    type L = { n: string; v: string };
    const colunas = [
      { titulo: '-Nome', valor: (l: L) => l.n },
      { titulo: 'Saldo', numerica: true, valor: (l: L) => l.v },
    ];
    expect(montarCsv(colunas, [{ n: '-Ana', v: '-1.234,56' }, { n: 'Bia', v: '-1;=x' }])).toBe("'-Nome;Saldo\r\n'-Ana;-1.234,56\r\nBia;\"'-1;=x\"");
  });

  it('carrega página a página até o total, o teto ou página vazia', async () => {
    const dados = Array.from({ length: 250 }, (_, i) => i);
    const pedidos: [number, number][] = [];
    const carregar = async (limite: number, indice: number) => {
      pedidos.push([limite, indice]);
      return { linhas: dados.slice(indice * limite, (indice + 1) * limite), total: dados.length };
    };
    const r = await carregarAteOTeto(carregar);
    expect(r.linhas).toHaveLength(250);
    expect(r.restantes).toBe(0);
    expect(pedidos).toEqual([
      [100, 0],
      [100, 1],
      [100, 2],
    ]);

    const muitos = async (limite: number) => ({ linhas: Array.from({ length: limite }, () => 1), total: 5000 });
    const corte = await carregarAteOTeto(muitos);
    expect(corte.linhas).toHaveLength(TETO_DE_EXPORTACAO);
    expect(corte.restantes).toBe(3000);

    const mentiroso = async (_l: number, i: number) => ({ linhas: i === 0 ? [1, 2] : [], total: 10 });
    expect((await carregarAteOTeto(mentiroso)).linhas).toEqual([1, 2]);
  });
});

describe('demais regras puras', () => {
  it('TAuditoria: updatedAt na mesma hora da criação não é alteração', () => {
    expect(foiAlterado({ createdAt: '2026-11-13T10:00:00Z', updatedAt: '2026-11-13T10:00:00.500Z' })).toBe(false);
    expect(foiAlterado({ createdAt: '2026-11-13T10:00:00Z', updatedAt: '2026-11-13T10:05:00Z' })).toBe(true);
    expect(foiAlterado({ alteradoPorNome: 'Ana' })).toBe(true);
    expect(foiAlterado({ createdAt: '2026-11-13T10:00:00Z' })).toBe(false);
  });
  it('useQuestion: inativar e excluir abrem como perigo', () => {
    expect(ehPerigo('inativar')).toBe(true);
    expect(ehPerigo('excluir')).toBe(true);
    expect(ehPerigo('reativar')).toBe(false);
    expect(ehPerigo(undefined)).toBe(false);
  });
  it('rodapé da grade', () => {
    expect(textoExibindo('1', '20', '137', 137)).toBe('Exibindo 1–20 de 137 registros');
    expect(textoExibindo('1', '1', '1', 1)).toBe('Exibindo 1–1 de 1 registro');
  });
});

describe('volta 1: só leitura, grade e ícone', () => {
  const leitura = (el: ReactElement) => html(<SomenteLeituraDoForm.Provider value>{el}</SomenteLeituraDoForm.Provider>);

  it('TEntry em só leitura: readOnly + aria-readonly, sem disabled, sem * e sem a dica', () => {
    const h = leitura(<TEntry label="Nome" required ajuda="Digite o nome" value="Ana" onChange={() => {}} />);
    expect(h).toContain('readOnly=""');
    expect(h).toContain('aria-readonly="true"');
    expect(h).not.toMatch(/<input[^>]*\sdisabled=""/);
    expect(h).not.toContain('aria-required');
    expect(h).not.toContain('Digite o nome');
    expect(h).not.toMatch(/text-danger[^>]*>\*/);
    // disabled de verdade continua disabled
    expect(html(<TEntry label="Código" value="1" onChange={() => {}} disabled />)).toMatch(/<input[^>]*\sdisabled=""/);
  });

  it('TCombo em só leitura: focável, readOnly, sem o botão de abrir', () => {
    const h = leitura(<TCombo label="Situação" opcoes={SITUACAO_OPCOES} value="true" onChange={() => {}} />);
    expect(h).toContain('role="combobox"');
    expect(h).toContain('aria-readonly="true"');
    expect(h).not.toMatch(/role="combobox"[^>]*\sdisabled=""/);
    expect(h).not.toContain('Limpar seleção');
  });

  it('TButton: ícone para genérica; tamanho imposto pelo contêiner quando a tela não passa size', () => {
    const Icone = ({ className }: { className?: string }) => <svg data-icone="sim" className={className} />;
    const h = html(<TButton variant="secondary" icone={Icone} label="Configurar aparência" />);
    expect(h).toContain('data-icone="sim"');
    expect(h).toContain('>Configurar aparência<');
    expect(html(<TamanhoDoTButton.Provider value="sm"><TButton variant="editar" label="" /></TamanhoDoTButton.Provider>)).toContain('size-8');
    expect(html(<TamanhoDoTButton.Provider value="sm"><TButton variant="editar" label="" size="md" /></TamanhoDoTButton.Provider>)).toContain('size-10');
  });

  it('cartão do celular com título não repete a coluna principal', () => {
    type L = { id: string; nome: string; email: string };
    const colunas = [
      { chave: 'email', cabecalho: 'E-mail', render: (l: L) => l.email },
      { chave: 'nome', cabecalho: 'NomeCol', principal: true as const, render: (l: L) => l.nome },
    ];
    const h = html(<TDataGrid colunas={colunas} linhas={[{ id: '1', nome: 'Demo', email: 'a@b' }]} chaveDe={(l) => l.id} tituloCartao={(l) => l.nome} />);
    const cartao = h.slice(h.indexOf('<dl'));
    expect(cartao).not.toContain('NomeCol');
    expect(cartao).toContain('E-mail');
  });
});
