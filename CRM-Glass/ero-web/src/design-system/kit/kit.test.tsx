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
import { useForm } from 'react-hook-form';
import { brParaIso, dentroDosLimites, diaDaSemana, isoParaBr, mascararData, nomeDoMes, semanasDoMes, somarDias, somarMeses } from '../../shared/util/datas';
import { TRadio } from './TRadio';
import { TCheckBox } from './TCheckBox';
import { TDate } from './TDate';
import { ESPERA_DA_BUSCA_MS, opcoesDoCombo, TDBCombo } from './TDBCombo';
import { TPanel } from './TPanel';
import { TForm } from './TForm';
import { DentroDoModal, LARGURA_DO_MODAL } from './TModal';
import { TTabPanel, TTabs } from './TTabs';
import { filtrarContratantes, SeletorContratante } from '../shell/SeletorContratante';
import { ATRASO_DO_ANUNCIO_MS, AvisoContexto } from '../ui/AvisoContexto';
import { Calendario } from '../ui/Calendario';
import { ReservaErroDoForm } from './campo';
import { dicasDasOpcoes, maiorRotulo } from './opcoes';

const html = (el: ReactElement) => renderToStaticMarkup(el);
// O CSS de verdade, lido do disco: o vitest não processa CSS (o `?raw` viria vazio). Import dinâmico com tipo próprio
// para não pôr os tipos do Node no programa inteiro (o tsconfig só tem `vite/client`).
type LeitorDeArquivo = { readFileSync: (caminho: URL, codificacao: 'utf8') => string };
const fs = (await import(/* @vite-ignore */ 'node:fs' as string)) as LeitorDeArquivo;
const INDEX_CSS = fs.readFileSync(new URL('../../styles/index.css', import.meta.url), 'utf8');
const TOKENS_CSS = fs.readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');

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

  it('TButton só ícone é quadrado em qualquer variante (genérica com ícone também), com nome e dica', () => {
    const Icone = ({ className }: { className?: string }) => <svg data-icone="sim" className={className} />;
    const naGrade = (el: ReactElement) => html(<TamanhoDoTButton.Provider value="sm">{el}</TamanhoDoTButton.Provider>);
    for (const v of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      const h = naGrade(<TButton variant={v} icone={Icone} label="" aria-label="Acessar Demo Solar" title="Acessar contratante" />);
      expect(h).toContain('size-8');
      expect(h).not.toContain('h-8 px-3');
      expect(h).toContain('aria-label="Acessar Demo Solar"');
      expect(h).toContain('title="Acessar contratante"');
    }
    // fora da grade: 40×40; sem `title`, a dica é o próprio nome
    const md = html(<TButton variant="secondary" icone={Icone} label="" aria-label="Desbloquear Marina" />);
    expect(md).toContain('size-10');
    expect(md).toContain('title="Desbloquear Marina"');
    // carregando continua quadrado
    expect(naGrade(<TButton variant="secondary" icone={Icone} label="" aria-label="Acessar" loading />)).toContain('size-8');
    // genérica sem ícone e com `label=""` não vira botão de ícone
    expect(html(<TButton variant="secondary" label="" />)).not.toContain('size-10');
    // ações seguem com o nome delas
    expect(naGrade(<TButton variant="editar" label="" />)).toContain('aria-label="Editar"');
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

describe('fatia 3: datas do TDate (shared/util/datas)', () => {
  it('máscara, conversão e datas que não existem', () => {
    expect(mascararData('1')).toBe('1');
    expect(mascararData('1411')).toBe('14/11');
    expect(mascararData('14112026999')).toBe('14/11/2026');
    expect(mascararData('14/ab11-2026')).toBe('14/11/2026');
    expect(brParaIso('14/11/2026')).toBe('2026-11-14');
    expect(brParaIso('31/02/2026')).toBeNull();
    expect(brParaIso('29/02/2028')).toBe('2028-02-29');
    expect(brParaIso('14/11')).toBeNull();
    expect(isoParaBr('2026-11-14')).toBe('14/11/2026');
    expect(isoParaBr('')).toBe('');
    expect(isoParaBr('2026-13-01')).toBe('');
  });

  it('somar dias e meses (encosta no fim do mês) e limites', () => {
    expect(somarDias('2026-11-14', -6)).toBe('2026-11-08');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2028-01-31', 1)).toBe('2028-02-29');
    expect(somarMeses('2026-03-15', -12)).toBe('2025-03-15');
    expect(dentroDosLimites('2026-11-14', '2026-11-08', '2026-11-14')).toBe(true);
    expect(dentroDosLimites('2026-11-07', '2026-11-08')).toBe(false);
    expect(dentroDosLimites('2026-11-07')).toBe(true);
  });

  it('a grade do mês tem 6 semanas, começa no domingo e contém o mês inteiro', () => {
    const semanas = semanasDoMes(2026, 10); // novembro de 2026: o dia 1 é domingo
    expect(semanas).toHaveLength(6);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    expect(semanas[0][0]).toBe('2026-11-01');
    expect(semanasDoMes(2026, 1).flat()).toContain('2026-02-28');
    const dez = semanasDoMes(2026, 11); // 1º de dezembro de 2026 é terça
    expect(dez[0][0]).toBe('2026-11-29');
    expect(diaDaSemana(dez[0][0])).toBe(0);
    expect(nomeDoMes(2026, 10)).toBe('novembro de 2026');
  });
});

describe('fatia 3: TRadio, TCheckBox, TDate, TDBCombo', () => {
  const leitura = (el: ReactElement) => html(<SomenteLeituraDoForm.Provider value>{el}</SomenteLeituraDoForm.Provider>);
  const NIVEIS = [
    { valor: 'NENHUM', rotulo: 'Sem acesso' },
    { valor: 'LER', rotulo: 'Ler' },
    { valor: 'ESCREVER', rotulo: 'Ler e escrever', desabilitada: true, dica: 'Você só libera o que tem' },
  ];

  it('TRadio: radiogroup com o rótulo, inputs nativos com o mesmo name, largura do conteúdo', () => {
    const h = html(
      <TRow>
        <TRadio label="Usuários" opcoes={NIVEIS} value="LER" onChange={() => {}} required />
      </TRow>,
    );
    expect(h).toMatch(/data-kit="TRadio"[^>]*data-largura="conteudo"/);
    expect(h).toMatch(/role="radiogroup"[^>]*aria-labelledby="[^"]+-rotulo"/);
    expect(h).toContain('aria-required="true"');
    expect(h.match(/type="radio"/g)).toHaveLength(3);
    const nomes = new Set([...h.matchAll(/<input type="radio"[^>]*name="([^"]+)"/g)].map((m) => m[1]));
    expect(nomes.size).toBe(1);
    expect(h).toMatch(/<input type="radio"[^>]*checked=""[^>]*value="LER"/);
    // opção desabilitada: disabled, dica no title (mouse) e visível na ajuda do grupo (toque, teclado, leitor de tela)
    expect(h).toMatch(/<input type="radio" disabled=""[^>]*value="ESCREVER"/);
    expect(h).toContain('title="Você só libera o que tem"');
    expect(h).not.toContain('sr-only">. Você só libera o que tem');
    const descId = /role="radiogroup"[^>]*aria-describedby="([^"]+)"/.exec(h)?.[1];
    expect(descId).toBeTruthy();
    expect(h).toMatch(new RegExp(`id="${descId}"[^>]*>Você só libera o que tem<`));
  });

  it('TRadio: vazio vira a última opção de valor vazio; só leitura marca o grupo e não desabilita', () => {
    const h = html(<TRadio label="Tema" opcoes={NIVEIS.slice(0, 2)} vazio="Não informado" value="" onChange={() => {}} />);
    expect(h).toMatch(/<input type="radio"[^>]*checked=""[^>]*value=""/);
    expect(h.indexOf('Não informado')).toBeGreaterThan(h.indexOf('>Ler<'));
    const l = leitura(<TRadio label="Usuários" opcoes={NIVEIS.slice(0, 2)} value="LER" onChange={() => {}} required />);
    expect(l).toContain('aria-readonly="true"');
    expect(l).not.toContain('aria-required');
    expect(l).not.toMatch(/type="radio"[^>]*disabled=""/);
    expect(l).toMatch(/type="radio"[^>]*readOnly=""/);
  });

  it('TCheckBox: booleano com rótulo ao lado (for = id), caixa glass; só leitura sem disabled', () => {
    const h = html(
      <TRow>
        <TCheckBox label="Liberar acesso a outros usuários" checked onChange={() => {}} ajuda="Só com Ler ou acima" />
      </TRow>,
    );
    expect(h).toMatch(/data-kit="TCheckBox"[^>]*data-largura="conteudo"/);
    const id = /<label for="([^"]+)"/.exec(h)?.[1];
    expect(id).toBeTruthy();
    expect(h).toContain(`id="${id}"`);
    expect(h).toContain('marca marca-caixa');
    expect(h).toMatch(/checked=""/);
    expect(h).toContain('Só com Ler ou acima');
    const l = leitura(<TCheckBox label="Liberar" checked onChange={() => {}} />);
    expect(l).toContain('aria-readonly="true"');
    expect(l).not.toMatch(/type="checkbox"[^>]*disabled=""/);
    expect(html(<TCheckBox label="Liberar" checked={false} onChange={() => {}} disabled />)).toMatch(/disabled=""/);
  });

  it('caixa e rádio desabilitados: fundo de só leitura (o medidor do §7.1 reprova o fundo de editável), sem opacity', () => {
    const d = html(<TCheckBox label="Liberar acesso" checked={false} onChange={() => {}} disabled />);
    expect(d).toMatch(/<input[^>]*disabled=""[^>]*class="marca marca-caixa/);
    expect(d).toContain('cursor-not-allowed text-muted');
    // a regra de index.css: :disabled divide o bloco do [readonly] (fundo --input-bg-readonly)
    const regra = INDEX_CSS.match(/\.marca\[readonly\],[^{]*\{[^}]*\}/)?.[0] ?? '';
    expect(regra).toContain('.marca:disabled,');
    expect(regra).toContain('.marca:disabled:checked');
    expect(regra).toContain('background: var(--input-bg-readonly)');
    expect(INDEX_CSS).not.toMatch(/\.marca:disabled\s*\{[^}]*opacity/);
    expect(INDEX_CSS).toMatch(/\.marca:disabled \+ \.marca-sinal\s*\{[^}]*var\(--fg-muted\)/);
  });

  it('TCheckBox com opções: grupo com rótulo de grupo, marca os valores da lista', () => {
    const h = html(
      <TCheckBox
        label="Avisos por"
        opcoes={[
          { valor: 'email', rotulo: 'E-mail' },
          { valor: 'sms', rotulo: 'SMS' },
        ]}
        valores={['sms']}
        onValoresChange={() => {}}
      />,
    );
    expect(h).toMatch(/role="group"[^>]*aria-labelledby/);
    expect(h.match(/type="checkbox"/g)).toHaveLength(2);
    expect((h.match(/checked=""/g) ?? []).length).toBe(1);
  });

  it('TDate: exibe DD/MM/AAAA, largura data, botão do calendário; só leitura sem calendário nem limpar', () => {
    const h = html(
      <TRow>
        <TDate label="De" value="2026-11-08" onChange={() => {}} />
      </TRow>,
    );
    expect(h).toMatch(/data-kit="TDate"[^>]*data-largura="data"/);
    expect(h).toContain('value="08/11/2026"');
    expect(h).toContain('inputMode="numeric"');
    expect(h).toContain('aria-label="Abrir calendário de De"');
    expect(h).toContain('aria-label="Limpar De"');
    expect(html(<TDate label="De" value="" onChange={() => {}} />)).not.toContain('Limpar De');
    const l = leitura(<TDate label="De" value="2026-11-08" onChange={() => {}} />);
    expect(l).toContain('readOnly=""');
    expect(l).toContain('aria-readonly="true"');
    expect(l).not.toContain('Abrir calendário');
    expect(l).not.toContain('Limpar De');
  });

  it('TDBCombo: largura metade, mostra o rotuloInicial do valor salvo, ação colada ao campo', () => {
    const buscar = async () => [];
    const h = html(
      <TRow>
        <TDBCombo label="Usuário" buscar={buscar} value="u3" rotuloInicial="Carla Menezes" onChange={() => {}} acao={<button>novo</button>} />
      </TRow>,
    );
    expect(h).toMatch(/data-kit="TDBCombo"[^>]*data-largura="metade"/);
    expect(h).toContain('role="combobox"');
    expect(h).toContain('value="Carla Menezes"');
    expect(h).toContain('>novo</button>');
  });

  it('TDBCombo: opções do combo com o vazio e o valor conhecido que não veio na lista', () => {
    const lista = [{ id: 'u1', nome: 'Ana' }];
    expect(opcoesDoCombo(lista, '', null, 'Todos')).toEqual([
      { valor: '', rotulo: 'Todos' },
      { valor: 'u1', rotulo: 'Ana' },
    ]);
    expect(opcoesDoCombo(lista, 'u3', { id: 'u3', nome: 'Carla' })).toEqual([
      { valor: 'u3', rotulo: 'Carla' },
      { valor: 'u1', rotulo: 'Ana' },
    ]);
    // já está na lista: não repete; conhecido de outro id: não entra
    expect(opcoesDoCombo(lista, 'u1', { id: 'u1', nome: 'Ana' })).toHaveLength(1);
    expect(opcoesDoCombo(lista, 'u9', { id: 'u3', nome: 'Carla' })).toHaveLength(1);
    expect(ESPERA_DA_BUSCA_MS).toBe(300);
  });

  it('TEntry com acao: o botão vai colado ao campo e some em só leitura', () => {
    const acao = <button>Gerar</button>;
    expect(html(<TEntry label="Senha temporária" type="password" value="" onChange={() => {}} acao={acao} />)).toContain('>Gerar</button>');
    expect(leitura(<TEntry label="Senha" value="x" onChange={() => {}} acao={acao} />)).not.toContain('Gerar');
  });
});

describe('fatia 3: TPanel somenteLeitura, TForm no TModal, TTabs, seletor e aviso', () => {
  function FormDe({ children, somenteLeitura }: { children: ReactElement; somenteLeitura?: boolean }) {
    const form = useForm({ defaultValues: { nome: 'Ana', outro: 'Bia' } });
    return (
      <TForm form={form} onSubmit={() => {}} somenteLeitura={somenteLeitura}>
        {children}
      </TForm>
    );
  }

  it('TPanel somenteLeitura: só os campos e botões de dentro ficam só leitura', () => {
    const h = html(
      <FormDe>
        <>
          <TEntry name="nome" label="Fora" />
          <TPanel title="Acesso aos módulos" somenteLeitura>
            <TEntry name="outro" label="Dentro" />
            <TButton variant="salvar" />
          </TPanel>
        </>
      </FormDe>,
    );
    const [fora, dentro] = h.split('data-kit="TPanel"');
    expect(fora).not.toContain('readOnly=""');
    expect(dentro).toContain('readOnly=""');
    expect(dentro).not.toContain('data-variante="salvar"');
    expect(dentro).toContain('Só leitura');
    expect(h).toContain('data-somente-leitura="true"');
  });

  it('TForm dentro do TModal não desenha cartão de vidro', () => {
    expect(
      html(
        <FormDe>
          <TEntry name="nome" label="Nome" />
        </FormDe>,
      ),
    ).toContain('glass-solid');
    const noModal = html(
      <DentroDoModal.Provider value>
        <FormDe>
          <TEntry name="nome" label="Nome" />
        </FormDe>
      </DentroDoModal.Provider>,
    );
    expect(noModal).toContain('data-kit="TForm"');
    expect(noModal).not.toContain('glass-solid');
    expect(LARGURA_DO_MODAL.sm).toBe(448);
  });

  it('TTabs: barra que não imprime e é bloco, só a aba ativa montada, título só no papel', () => {
    const h = html(
      <TTabs
        ativa="dados"
        onChange={() => {}}
        label="Minha conta"
        abas={[
          { id: 'dados', rotulo: 'Meus dados' },
          { id: 'senha', rotulo: 'Senha', alerta: true },
        ]}
      >
        <TTabPanel id="dados" rotulo="Meus dados">
          <p>conteúdo A</p>
        </TTabPanel>
        <TTabPanel id="senha" rotulo="Senha">
          <p>conteúdo B</p>
        </TTabPanel>
      </TTabs>,
    );
    expect(h).toContain('data-kit="TTabs"');
    expect(h).toContain('role="tablist"');
    expect(h).toContain('aria-label="Minha conta"');
    expect(h).toContain('nao-imprime');
    expect(h).toContain('conteúdo A');
    expect(h).not.toContain('conteúdo B');
    expect(h).toMatch(/role="tabpanel"[^>]*data-kit="TTabPanel"|data-kit="TTabPanel"[^>]*role="tabpanel"/);
    expect(h).toContain('so-impressao');
    expect(h).toContain('(requer atenção)');
  });

  it('SeletorContratante: filtro sem acento e o chip vira botão', () => {
    const opcoes = [
      { id: '1', nome: 'Clínica Bem Estar' },
      { id: '2', nome: 'Demo Solar', detalhe: '12.ABC.345/01DE-35' },
    ];
    expect(filtrarContratantes(opcoes, 'clinica').map((o) => o.id)).toEqual(['1']);
    expect(filtrarContratantes(opcoes, '12.abc').map((o) => o.id)).toEqual(['2']);
    expect(filtrarContratantes(opcoes, '  ')).toHaveLength(2);
    const h = html(<SeletorContratante opcoes={opcoes} atual={{ id: '2', nome: 'Demo Solar' }} onEscolher={() => {}} onSair={() => {}} detalhe="Superadmin" />);
    expect(h).toContain('<button');
    expect(h).toContain('aria-haspopup="dialog"');
    expect(h).toContain('Contratante: Demo Solar');
    expect(h).toContain('aria-expanded="false"');
  });

  it('SeletorContratante controlado: `aberto` de fora abre (Ctrl+K da Casca); sem ele, começa fechado', () => {
    const opcoes = [{ id: '1', nome: 'Clínica Bem Estar' }];
    const aberto = html(<SeletorContratante opcoes={opcoes} aberto onAbertoChange={() => {}} onEscolher={() => {}} onSair={() => {}} />);
    expect(aberto).toContain('aria-expanded="true"');
    expect(aberto).toContain('data-state="open"');
    const fechado = html(<SeletorContratante opcoes={opcoes} aberto={false} onAbertoChange={() => {}} onEscolher={() => {}} onSair={() => {}} />);
    expect(fechado).toContain('aria-expanded="false"');
  });

  it('AvisoContexto não imprime', () => {
    expect(html(<AvisoContexto acao={{ rotulo: 'Sair do contratante', onClick: () => {} }}>Você está dentro de X</AvisoContexto>)).toContain('nao-imprime');
  });
});

describe('correções da revisão da fatia 3', () => {
  const NIVEIS = [
    { valor: 'NENHUM', rotulo: 'Sem acesso' },
    { valor: 'LER', rotulo: 'Ler' },
    { valor: 'ESCREVER', rotulo: 'Ler e escrever', desabilitada: true, dica: 'Você só libera o que tem' },
  ];
  /** como dentro de um TForm com resolver: os campos reservam a linha do erro */
  const reservando = (el: ReactElement) => html(<ReservaErroDoForm.Provider value>{el}</ReservaErroDoForm.Provider>);
  const RESERVA = 'relative mt-1.5 min-h-4';

  it('TRadio e TCheckBox (grupo e booleano) não reservam a linha do erro; o TEntry, sim', () => {
    expect(reservando(<TEntry label="Nome" value="" onChange={() => {}} />)).toContain(RESERVA);
    expect(reservando(<TRadio label="Usuários" opcoes={NIVEIS.slice(0, 2)} value="LER" onChange={() => {}} />)).not.toContain(RESERVA);
    expect(reservando(<TCheckBox label="Ações" opcoes={NIVEIS.slice(0, 2)} valores={[]} onValoresChange={() => {}} />)).not.toContain(RESERVA);
    expect(reservando(<TCheckBox label="Liberar acesso" checked={false} onChange={() => {}} />)).not.toContain(RESERVA);
    // com erro, a linha aparece
    expect(reservando(<TRadio label="Usuários" opcoes={NIVEIS} value="" onChange={() => {}} error="Escolha um nível" />)).toContain('Escolha um nível');
  });

  it('dica de opção vira ajuda visível do grupo, depois da ajuda, sem repetir; some em só leitura', () => {
    expect(dicasDasOpcoes([{ dica: 'A' }, {}, { dica: ' A ' }, { dica: 'B' }])).toEqual(['A', 'B']);
    const h = html(<TRadio label="Usuários" opcoes={NIVEIS} value="LER" onChange={() => {}} ajuda="Nível de acesso." />);
    expect(h).toContain('Nível de acesso. Você só libera o que tem');
    const c = html(
      <TCheckBox label="Ações" opcoes={[{ valor: 'L', rotulo: 'Liberar acesso', desabilitada: true, dica: 'Só com Ler ou acima' }]} valores={[]} onValoresChange={() => {}} />,
    );
    expect(c).toMatch(/role="group"[^>]*aria-describedby="[^"]+"/);
    expect(c).toContain('>Só com Ler ou acima<');
    const l = html(
      <SomenteLeituraDoForm.Provider value>
        <TRadio label="Usuários" opcoes={NIVEIS} value="LER" onChange={() => {}} />
      </SomenteLeituraDoForm.Provider>,
    );
    expect(l).not.toContain('>Você só libera o que tem<');
  });

  it('TCombo emite data-rotulo-max (maior rótulo, com o vazio) para a régua decidir situacao × medio', () => {
    expect(maiorRotulo([{ valor: 'a', rotulo: 'Ativo' }, { valor: 'b', rotulo: 'Inativo' }])).toBe(7);
    expect(maiorRotulo([])).toBe(0);
    const h = html(
      <TRow>
        <TCombo label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas as situações" value="" onChange={() => {}} />
      </TRow>,
    );
    expect(h).toMatch(/data-kit="TCombo"[^>]*data-rotulo-max="18"/);
    // os outros campos não emitem
    expect(html(<TEntry label="Nome" value="" onChange={() => {}} />)).not.toContain('data-rotulo-max');
  });

  it('TPanel: o primeiro não desenha a borda de cima; sem conteúdo não tem corpo nem recolhe', () => {
    const cheio = html(
      <TPanel title="Acesso aos módulos" recolhido={false}>
        <TEntry label="Nome" value="" onChange={() => {}} />
      </TPanel>,
    );
    expect(cheio).toContain('first:border-t-0 first:pt-0');
    expect(cheio).toContain('-corpo"');
    expect(cheio).toContain('aria-expanded="true"');
    const vazio = html(
      <TPanel title="Acesso aos módulos" subtitle="O administrador tem acesso a tudo" recolhido={false}>
        {null}
        {false}
      </TPanel>,
    );
    expect(vazio).toContain('Acesso aos módulos');
    expect(vazio).not.toContain('-corpo"');
    expect(vazio).not.toContain('aria-expanded');
  });

  it('Calendario: dia fora de min/max é aria-disabled e continua focável (sem disabled nem opacity)', () => {
    const h = html(<Calendario valor="2026-11-10" min="2026-11-08" onEscolher={() => {}} />);
    const dia7 = /<button[^>]*data-dia="2026-11-07"[^>]*>/.exec(h)?.[0] ?? '';
    expect(dia7).toContain('aria-disabled="true"');
    expect(dia7).not.toMatch(/\sdisabled=""/);
    expect(dia7).not.toContain('opacity');
    const dia10 = /<button[^>]*data-dia="2026-11-10"[^>]*>/.exec(h)?.[0] ?? '';
    expect(dia10).not.toContain('aria-disabled="');
    expect(dia10).toContain('tabindex="0"');
  });

  it('camadas: conteúdo < casca < faixa < popover < modal < popover sobre modal < paleta < toast, só por token', () => {
    const z = (nome: string) => Number(new RegExp(`--z-${nome}:\\s*(\\d+)`).exec(TOKENS_CSS)?.[1]);
    const ordem = ['conteudo', 'barra', 'menu', 'splash', 'faixa', 'popover', 'modal', 'popover-sobre-modal', 'paleta', 'toast'].map(z);
    expect(ordem.every((v) => Number.isFinite(v))).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
    expect(TOKENS_CSS).toMatch(/body:has\(\[aria-modal='true'\]\)\s*\{\s*--z-popover: var\(--z-popover-sobre-modal\)/);
    expect(INDEX_CSS).toContain('--z-index-popover: var(--z-popover)');
    expect(TOKENS_CSS).toMatch(/--folga-inferior:\s*0px/);
  });

  it('AvisoContexto: a região viva nasce sem o texto (entra depois) e o texto visível não é lido duas vezes', () => {
    const h = html(<AvisoContexto acao={{ rotulo: 'Sair do contratante', onClick: () => {} }}>Você está dentro de X</AvisoContexto>);
    expect(h).toMatch(/role="status"[^>]*><span class="sr-only"><\/span>/);
    expect(h).toMatch(/<span aria-hidden="true"[^>]*>Você está dentro de X<\/span>/);
    expect(ATRASO_DO_ANUNCIO_MS).toBeGreaterThan(0);
  });
});
