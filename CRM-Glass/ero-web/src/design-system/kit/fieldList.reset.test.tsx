// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { valoresNoCaminho } from './fieldList';
import { TFieldList } from './TFieldList';
import { TForm } from './TForm';
import { TEntry } from './TEntry';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// O Motion mede o layout na saída da linha; o jsdom não tem scrollTo.
window.scrollTo = () => {};

let raiz: Root | null = null;
let caixa: HTMLDivElement | null = null;

function montar(el: ReactElement) {
  caixa = document.createElement('div');
  document.body.appendChild(caixa);
  raiz = createRoot(caixa);
  act(() => raiz!.render(el));
  return caixa;
}

afterEach(() => {
  act(() => raiz?.unmount());
  caixa?.remove();
  raiz = null;
  caixa = null;
});

/** Como a linha de "Filiais e preços": campos que aparecem (filial, preço) e campos que só desenham (rótulo, ativa). */
const linha = z.object({ filialId: z.string().min(1), filialRotulo: z.string(), filialAtiva: z.boolean(), preco: z.string() });
const schema = z.object({ nome: z.string().min(1), valores: z.array(linha).min(1) });
type Dados = z.infer<typeof schema>;
type Linha = Dados['valores'][number];

const DUAS: Dados = {
  nome: 'Corte',
  valores: [
    { filialId: 'a', filialRotulo: 'Centro', filialAtiva: true, preco: '10,00' },
    { filialId: 'b', filialRotulo: 'Norte', filialAtiva: true, preco: '20,00' },
  ],
};
const UMA: Dados = { nome: 'Corte', valores: [DUAS.valores[0]] };

/** A tela: o `useEffect` do Form refaz o `reset` quando a consulta devolve o registro (o Recarregar do 409). */
function Tela({ inicial, onValid, pegar }: { inicial: Dados; onValid: (d: Dados) => void; pegar: (f: UseFormReturn<Dados>) => void }) {
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: inicial });
  pegar(form);
  useEffect(() => {
    form.reset(inicial);
  }, [inicial, form]);
  return (
    <TForm form={form} onSubmit={onValid}>
      <TFieldList<Linha>
        name="valores"
        novaLinha={{ filialId: '', filialRotulo: '', filialAtiva: true, preco: '' }}
        colunas={[
          { name: 'filialId', componente: (campo) => <TEntry name={campo} label="Filial" /> },
          { name: 'preco', componente: (campo) => <TEntry name={campo} label="Preço" /> },
        ]}
      />
      <button type="submit">Salvar</button>
    </TForm>
  );
}

const esperar = () => act(async () => new Promise((r) => setTimeout(r, 0)));

describe('TFieldList: reset que encolhe a lista (Recarregar do 409)', () => {
  it('depois de recarregar com menos linhas, o Salvar valida só as que ficaram e grava', async () => {
    const onValid = vi.fn();
    let form!: UseFormReturn<Dados>;
    const pegar = (f: UseFormReturn<Dados>) => (form = f);
    const c = montar(<Tela inicial={DUAS} onValid={onValid} pegar={pegar} />);
    const salvar = () => c.querySelector<HTMLButtonElement>('button[type="submit"]')!;

    // 1º Salvar (a API devolveu 409): o formulário já foi enviado uma vez
    await act(async () => salvar().click());
    await esperar();
    expect(onValid).toHaveBeenCalledTimes(1);

    // Recarregar: a consulta devolve o registro com uma linha só e o Form refaz o reset
    act(() => raiz!.render(<Tela inicial={UMA} onValid={onValid} pegar={pegar} />));
    await esperar();
    expect(form.getValues('valores')).toHaveLength(1);

    // muda o preço e salva de novo
    act(() => form.setValue('valores.0.preco', '15,00', { shouldDirty: true }));
    await act(async () => salvar().click());
    await esperar();
    expect(form.formState.errors).toEqual({});
    expect(onValid).toHaveBeenCalledTimes(2);
    expect(onValid.mock.calls[1][0].valores).toEqual([{ ...UMA.valores[0], preco: '15,00' }]);
  });

  it('remover a 1ª linha pelo botão: a que sobe para o índice 0 é a que vai, sem a removida', async () => {
    const onValid = vi.fn();
    let form!: UseFormReturn<Dados>;
    const c = montar(<Tela inicial={DUAS} onValid={onValid} pegar={(f) => (form = f)} />);
    await act(async () => c.querySelector<HTMLButtonElement>('button[aria-label="Remover Linha 1"]')!.click());
    await esperar();
    expect(form.getValues('valores')).toEqual([DUAS.valores[1]]);
    act(() => form.setValue('valores.0.preco', '25,00', { shouldDirty: true }));
    await act(async () => c.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    await esperar();
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid.mock.calls[0][0].valores).toEqual([{ ...DUAS.valores[1], preco: '25,00' }]);
  });
});

describe('valoresNoCaminho (o retrato da linha que sai)', () => {
  it('põe a linha no caminho, índice como posição de array', () => {
    expect(valoresNoCaminho('valores.1', { a: 1 })).toEqual({ valores: [undefined, { a: 1 }] });
    expect(valoresNoCaminho('pessoa.enderecos.0', { cep: 'x' })).toEqual({ pessoa: { enderecos: [{ cep: 'x' }] } });
  });
});
