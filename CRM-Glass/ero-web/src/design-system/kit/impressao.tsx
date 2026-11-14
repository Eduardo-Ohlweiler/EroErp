import { Fragment, type ReactNode } from 'react';
import { LogoEroHorizontal } from '../../assets/brand/LogoEro';
import { useUsuarioDaCasca } from '../../shared/sessao/SessaoProvider';
import { nomeDoContratante } from '../../shared/sessao/rotulos';
import { formatarDataHora } from '../../shared/util/format';
import type { ColunaExportavel } from './planilha';

/*
 * Camada de impressão (docs/08-relatorios.md). Todo relatório tem a mesma moldura:
 *   - cabeçalho em TODAS as páginas: logo do Ero + barra na cor de destaque do contratante, com o emitente e o título;
 *   - filtros só na PRIMEIRA página;
 *   - rodapé em TODAS as páginas: "CRM Glass · data · gerado por <nome do usuário> · Página X de Y".
 *
 * A folha é o DOM impresso (não um print da tela nem um PDF remontado): lê os mesmos objetos e os mesmos
 * formatadores que a tela leu. Na tela ela não existe (`display: none`); no papel é a única coisa que existe
 * (index.css, `@media print`). Papel branco, texto escuro, sem vidro nem fundo de cena (tokens `--folha-*`).
 */

const inteiro = new Intl.NumberFormat('pt-BR');

/** Um filtro que estava aplicado, para o papel dizer o recorte que mostra. */
export type FiltroAplicado = { rotulo: string; valor: string };

/** Quem emite e quem gera a folha. Sem as props, vêm da sessão (contratante efetivo e usuário logado). */
export type IdentidadeDaFolha = {
  /** o contratante efetivo ("Plataforma" para o superadmin fora de um contratante) */
  emitente?: string;
  /** o nome de quem mandou gerar (nunca o e-mail; sem nome, o rodapé fica só "CRM Glass · data") */
  usuario?: string;
  /** o instante da geração (padrão: agora) */
  geradoEm?: Date;
};

/**
 * Texto como string CSS (`content` do `@page`): aspas e barra escapadas, quebra de linha vira espaço e `<` vira
 * escape CSS (nenhum texto de usuário fecha o `<style>`).
 */
export function textoCss(texto: string): string {
  return `"${texto.replace(/[\\"]/g, '\\$&').replace(/[\r\n\f]+/g, ' ').replace(/</g, '\\3c ')}"`;
}

/**
 * A linha de auditoria do rodapé, sem a página (que é do `@page`): "CRM Glass · data · gerado por <nome>". Sem nome,
 * só "CRM Glass · data" (o e-mail nunca entra no lugar).
 */
export function textoDoRodape({ usuario, geradoEm }: { usuario?: string | null; geradoEm: Date }): string {
  const nome = usuario?.trim();
  return ['CRM Glass', formatarDataHora(geradoEm.toISOString()), nome ? `gerado por ${nome}` : null].filter(Boolean).join(' · ');
}

/**
 * O rodapé de cada página. `counter(page)` e `counter(pages)` só existem nas caixas de margem do `@page`
 * (Chrome 131+): é ali que mora o rodapé no papel, e não num elemento da folha. O estilo das caixas (fonte, cor,
 * régua) está no index.css; aqui só o conteúdo, que só existe enquanto houver uma folha montada.
 */
export function regraDoRodape(texto: string): string {
  return (
    '@media print { @page { ' +
    `@bottom-left { content: ${textoCss(texto)}; } ` +
    '@bottom-right { content: "Página " counter(page) " de " counter(pages); } ' +
    '} }'
  );
}

/** "Filtros: Situação: Ativos · Nome: Solar". Filtro vazio não aparece; nenhum vira "sem filtro aplicado". */
export function textoDosFiltros(filtros: FiltroAplicado[]): string {
  const aplicados = filtros.filter((f) => f.valor.trim());
  return aplicados.length > 0 ? aplicados.map((f) => `${f.rotulo}: ${f.valor.trim()}`).join(' · ') : 'sem filtro aplicado';
}

/**
 * Os pedaços de um e-mail entre os pontos naturais de quebra: depois do `@` e de cada `.`
 * ("contato@demomarina.test" → "contato@", "demomarina.", "test"). O hífen já é ponto de quebra do navegador.
 */
export function pedacosDoEmail(email: string): string[] {
  return email.split(/(?<=[@.])/);
}

/** O texto da célula com os pontos de quebra (`<wbr>`) que a coluna pede; sem `quebra`, o texto puro. */
function textoDaCelula(texto: string, quebra?: 'email'): ReactNode {
  if (quebra !== 'email') return texto;
  return pedacosDoEmail(texto).map((p, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {p}
    </Fragment>
  ));
}

/** As classes de uma célula da tabela da folha. */
function classeDaCelula(c: { numerica?: boolean; semQuebra?: boolean }): string | undefined {
  return [c.numerica && 'folha-num', c.semQuebra && 'folha-sem-quebra'].filter(Boolean).join(' ') || undefined;
}

/**
 * A moldura de todo relatório (docs/08 §1).
 *
 * É uma tabela de uma célula: o cabeçalho vai no `thead`, que o navegador repete no topo de cada página; os filtros
 * e o corpo vão no `tbody`, em fluxo (os filtros aparecem uma vez só, na primeira). O rodapé vai nas caixas de margem
 * do `@page` (`regraDoRodape`); o `<footer>` da folha só aparece na prévia de tela do catálogo.
 */
export function Folha({
  titulo,
  filtros,
  complemento,
  emitente,
  usuario,
  geradoEm,
  children,
}: {
  /** o que este papel é: "Contratantes", "Atendimentos por filial e cliente" */
  titulo: string;
  /** os filtros que geraram o relatório (só na 1ª página). Sem a prop, a folha não tem bloco de filtros (ex.: ficha de um registro). */
  filtros?: FiltroAplicado[];
  /** o que vem depois dos filtros, na mesma linha: "23 registros" */
  complemento?: ReactNode;
  children: ReactNode;
} & IdentidadeDaFolha) {
  const sessao = useUsuarioDaCasca();
  const quem = emitente ?? (sessao ? nomeDoContratante(sessao) : 'CRM Glass');
  const rodape = textoDoRodape({ usuario: usuario ?? sessao?.nome, geradoEm: geradoEm ?? new Date() });

  return (
    <article className="folha">
      <style>{regraDoRodape(rodape)}</style>
      <table className="folha-moldura">
        <thead>
          <tr>
            <td>
              <header className="folha-cabecalho">
                <LogoEroHorizontal className="folha-logo" />
                <div className="folha-barra">
                  <p className="folha-emitente">{quem}</p>
                  <h1 className="folha-titulo">{titulo}</h1>
                </div>
              </header>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {filtros && (
                <p className="folha-filtros">
                  <strong>Filtros:</strong> {textoDosFiltros(filtros)}
                  {complemento != null && <> · {complemento}</>}
                </p>
              )}
              <div className="folha-corpo">{children}</div>
            </td>
          </tr>
        </tbody>
      </table>
      {/* Só na prévia de tela: no papel o rodapé é o do @page, com a página. */}
      <footer className="folha-rodape" aria-hidden="true">
        <span>{rodape}</span>
        <span>Página X de Y</span>
      </footer>
    </article>
  );
}

/**
 * Lista simples (docs/08 §2.1): uma listagem sem agrupamento, **no recorte que estava na tela**. Os filtros aplicados
 * vão escritos na 1ª página e o relatório cobre o filtro inteiro (quem carrega é o `TAcoesDeExportacao`, que refaz a
 * consulta sem paginação até o teto), não a página visível. As colunas são as mesmas da planilha: o CSV e o papel
 * nunca discordam.
 */
export function DocumentoLista<T>({
  titulo,
  colunas,
  linhas,
  filtros,
  chaveDe,
  truncado,
  ...identidade
}: {
  titulo: string;
  colunas: ColunaExportavel<T>[];
  linhas: T[];
  filtros: FiltroAplicado[];
  chaveDe: (linha: T, indice: number) => string | number;
  /** quantas linhas ficaram de fora do teto de exportação */
  truncado?: number;
} & IdentidadeDaFolha) {
  return (
    <Folha
      titulo={titulo}
      filtros={filtros}
      complemento={`${inteiro.format(linhas.length)} ${linhas.length === 1 ? 'registro' : 'registros'}`}
      {...identidade}
    >
      {linhas.length === 0 ? (
        <p className="folha-aviso">Nenhum registro para o filtro aplicado.</p>
      ) : (
        <table className="folha-tabela">
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c.titulo} className={c.numerica ? 'folha-num' : undefined}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={chaveDe(l, i)}>
                {colunas.map((c) => (
                  <td key={c.titulo} className={classeDaCelula(c)}>
                    {textoDaCelula(c.valor(l), c.quebra)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {truncado != null && truncado > 0 && (
        <p className="folha-aviso">
          Mais {inteiro.format(truncado)} {truncado === 1 ? 'registro atende' : 'registros atendem'} ao filtro e não {truncado === 1 ? 'coube' : 'couberam'} neste
          relatório. Estreite o filtro para a folha cobrir tudo: um relatório que corta em silêncio não serve de registro.
        </p>
      )}
    </Folha>
  );
}
