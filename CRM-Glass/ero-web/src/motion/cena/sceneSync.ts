/**
 * Ponte entre a troca de tema e o fundo de cena: a troca pede a cena primeiro e só troca o tema
 * da interface quando a luz já mudou o bastante (ponto definido em motion/tokens.ts, cena.trocaInterface).
 *
 * Diferença do protótipo: duas cenas podem estar montadas ao mesmo tempo (esmaecimento cruzado do
 * LiveBackground ao trocar de fundo). Por isso o registro tem dono: quem sai só desfaz o próprio
 * registro, nunca o da cena que entrou. E a cena informa quando as fotos terminaram de carregar.
 */
type Pedido = (alvo: 0 | 1) => Promise<boolean>;
type Registro = { pedido: Pedido; pronta: () => Promise<void> };

let atual: Registro | null = null;

/** Registra a cena ativa. Devolve a função que desfaz o registro (só se ainda for o desta cena). */
export function registrarCena(pedido: Pedido | null, pronta: () => Promise<void> = () => Promise.resolve()) {
  if (!pedido) {
    atual = null;
    return () => {};
  }
  const reg: Registro = { pedido, pronta };
  atual = reg;
  return () => {
    if (atual === reg) atual = null;
  };
}

/** true quando há um fundo de cena montado (escritório, cidade, marina...). */
export function cenaAtiva() {
  return atual !== null;
}

/**
 * Começa a sequência da cena. Resolve true no momento de trocar o tema da interface,
 * ou false se outra troca a substituiu (aí quem pediu desiste).
 */
export function pedirCena(alvo: 0 | 1) {
  return atual ? atual.pedido(alvo) : Promise.resolve(true);
}

/** Resolve quando as fotos da cena ativa estão no canvas (ou imediatamente, sem cena). */
export function cenaPronta() {
  return atual ? atual.pronta() : Promise.resolve();
}
