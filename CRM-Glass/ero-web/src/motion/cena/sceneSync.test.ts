import { describe, expect, it } from 'vitest';
import { cenaAtiva, cenaPronta, pedirCena, registrarCena } from './sceneSync';

describe('ponte da cena com a troca de tema', () => {
  it('sem cena, a troca segue direto', async () => {
    expect(cenaAtiva()).toBe(false);
    await expect(pedirCena(1)).resolves.toBe(true);
    await expect(cenaPronta()).resolves.toBeUndefined();
  });

  it('a cena que sai não desfaz o registro da que entrou (esmaecimento cruzado)', async () => {
    const sairA = registrarCena(async () => false);
    const sairB = registrarCena(async () => true);
    sairA();
    expect(cenaAtiva()).toBe(true);
    await expect(pedirCena(0)).resolves.toBe(true);
    sairB();
    expect(cenaAtiva()).toBe(false);
  });

  it('espera as fotos da cena registrada', async () => {
    let pronta = false;
    const sair = registrarCena(async () => true, async () => {
      pronta = true;
    });
    await cenaPronta();
    expect(pronta).toBe(true);
    sair();
  });
});
