/**
 * Ponte entre o botão de tema e o fundo de cena: o botão pede a cena primeiro e só troca o tema
 * da interface quando a luz já mudou o bastante (ponto definido em motion/tokens.ts, cena.trocaInterface).
 */
type Pedido = (alvo: 0 | 1) => Promise<boolean>;

let atual: Pedido | null = null;

export function registrarCena(pedido: Pedido | null) {
  atual = pedido;
}

/** true quando há um fundo de cena montado (escritório, cidade). */
export function cenaAtiva() {
  return atual !== null;
}

/**
 * Começa a sequência da cena. Resolve true no momento de trocar o tema da interface,
 * ou false se outra troca a substituiu (aí quem pediu desiste).
 */
export function pedirCena(alvo: 0 | 1) {
  return atual ? atual(alvo) : Promise.resolve(true);
}
