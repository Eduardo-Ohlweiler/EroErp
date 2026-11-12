/*
 * `?voltar=` do login: para onde ir depois de entrar. Só aceita caminho interno do próprio app, para o
 * login não virar trampolim para outro site (open redirect).
 */

const ORIGEM_FICTICIA = 'http://ero.invalid';

/**
 * Devolve o caminho se for interno e seguro; senão, `/`.
 * Recusa: vazio, sem `/` no começo, `//` (outro host) antes ou depois de normalizar os pontos, `\`
 * (navegadores tratam como `/`), esquema (`javascript:`, `https:`), caracteres de controle e o próprio
 * `/login` (evita voltar ao login).
 */
export function sanitizarVoltar(valor: string | null | undefined): string {
  if (typeof valor !== 'string') return '/';
  const v = valor.trim();
  if (v === '' || v.length > 2048) return '/';
  if (!v.startsWith('/') || v.startsWith('//')) return '/';
  if (v.includes('\\')) return '/';
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(v)) return '/';

  let url: URL;
  try {
    url = new URL(v, ORIGEM_FICTICIA);
  } catch {
    return '/';
  }
  if (url.origin !== ORIGEM_FICTICIA) return '/';
  // A normalização remove `.` e `..` (também `%2e`): "/.//evil.com" vira "//evil.com". Testa de novo no resultado.
  if (/^[/\\]{2}/.test(url.pathname)) return '/';
  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) return '/';
  const destino = `${url.pathname}${url.search}${url.hash}`;
  return ehCaminhoInterno(destino) ? destino : '/';
}

/** Começa com uma barra só (`/x`), nunca `//` nem `/\` (que o navegador lê como outro host). */
export function ehCaminhoInterno(v: string): boolean {
  return /^\/(?![/\\])/.test(v);
}

/** Rota do login com o `voltar` (omitido quando o destino é o Início). */
export function rotaDoLogin(destino?: string | null): string {
  const v = sanitizarVoltar(destino);
  return v === '/' ? '/login' : `/login?voltar=${encodeURIComponent(v)}`;
}
