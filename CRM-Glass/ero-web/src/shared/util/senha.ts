/**
 * Senha temporária gerada no navegador (cadastro de usuário e "Redefinir senha"), com `crypto.getRandomValues`.
 * Sem letras e números que se confundem ao ditar (0/O, 1/l/I). Sorteio sem viés: o byte que passa do maior múltiplo
 * do alfabeto é descartado. A política de senha continua sendo da API (12 ou mais, sem o nome nem o e-mail).
 */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LIMITE = 256 - (256 % ALFABETO.length);

export const TAMANHO_SENHA_GERADA = 16;

export function gerarSenhaTemporaria(
  tamanho = TAMANHO_SENHA_GERADA,
  sortear: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b),
): string {
  let senha = '';
  while (senha.length < tamanho) {
    for (const b of sortear(new Uint8Array(tamanho * 2))) {
      if (b < LIMITE) senha += ALFABETO[b % ALFABETO.length];
      if (senha.length === tamanho) break;
    }
  }
  return senha;
}
