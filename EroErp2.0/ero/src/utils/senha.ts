/**
 * O teto da senha é o do BCrypt: **72 bytes**, não 72 caracteres. Em UTF-8 uma
 * letra acentuada ocupa 2 bytes e um emoji 4, então `"é".repeat(40)` tem 40
 * caracteres e 80 bytes — e o `.max(72)` do zod deixava passar o que o
 * servidor recusa. A frase é a mesma do `@SenhaBcrypt` do backend.
 */
export const SENHA_PASSA_DE_72_BYTES =
  'A senha passa de 72 bytes: letras acentuadas e símbolos ocupam 2 ou mais; use menos caracteres'

const codificador = new TextEncoder()

/** true quando a senha cabe no BCrypt. Para o `refine` dos schemas zod. */
export const senhaCabeNoBcrypt = (senha: string) => codificador.encode(senha).length <= 72
