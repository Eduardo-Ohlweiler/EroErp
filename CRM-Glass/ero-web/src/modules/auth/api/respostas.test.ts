import { describe, expect, it } from 'vitest';
import { erroDeProblemDetail, ErroApi } from '../../../shared/api/erros';
import { reacaoAoVerificar } from './respostas';

describe('reacaoAoVerificar (POST /api/auth/2fa/verificar)', () => {
  it('CODIGO_INVALIDO fica na etapa, pelo código e não pelo texto', () => {
    const e = erroDeProblemDetail(401, { detail: 'Qualquer texto que a API mande.', codigo: 'CODIGO_INVALIDO' });
    expect(reacaoAoVerificar(e)).toEqual({ tipo: 'codigo-invalido', mensagem: 'Qualquer texto que a API mande.' });
  });

  it('DESAFIO_EXPIRADO volta às credenciais com o detail', () => {
    const detail = 'O tempo para digitar o código acabou. Entre de novo.';
    const e = erroDeProblemDetail(401, { detail, codigo: 'DESAFIO_EXPIRADO' });
    expect(reacaoAoVerificar(e)).toEqual({ tipo: 'recomecar', mensagem: detail });
  });

  it('o texto "Código inválido." sem o codigo não basta para ficar na etapa', () => {
    const e = erroDeProblemDetail(401, { detail: 'Código inválido.', codigo: 'NAO_AUTENTICADO' });
    expect(reacaoAoVerificar(e).tipo).toBe('recomecar');
  });

  it('400 mostra a mensagem no campo do código', () => {
    const e = erroDeProblemDetail(400, { detail: 'Existem campos inválidos.', codigo: 'VALIDACAO', erros: [{ campo: 'codigo', mensagem: 'Use 6 números.' }] });
    expect(reacaoAoVerificar(e)).toEqual({ tipo: 'campo', mensagem: 'Use 6 números.' });
  });

  it('429 avisa quanto esperar', () => {
    const e = erroDeProblemDetail(429, { detail: 'Muitas tentativas.', codigo: 'MUITAS_REQUISICOES' }, '30');
    expect(reacaoAoVerificar(e)).toMatchObject({ tipo: 'aviso', tom: 'aviso', mensagem: 'Muitas tentativas. Aguarde 30 s e tente de novo.' });
  });

  it('erro do servidor leva o código para o suporte', () => {
    const e = erroDeProblemDetail(500, { detail: 'Algo deu errado.', codigo: 'ERRO_INTERNO', correlationId: 'abc' });
    expect(reacaoAoVerificar(e)).toEqual({ tipo: 'aviso', tom: 'perigo', mensagem: 'Algo deu errado.', correlationId: 'abc' });
  });

  it('sem conexão ou erro que não veio da API', () => {
    expect(reacaoAoVerificar(new ErroApi({ status: 0 }))).toMatchObject({ tipo: 'aviso', tom: 'perigo' });
    expect(reacaoAoVerificar(new Error('x'))).toMatchObject({ tipo: 'aviso', tom: 'perigo' });
  });
});
