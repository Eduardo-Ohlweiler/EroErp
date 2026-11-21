import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConciergeBell, ListChecks } from 'lucide-react';
import { Toggle } from '../ui/Bits';
import { TButton, TDBCombo, TEntry, TFieldList, TForm, TFormActionsLeft, TFormFooter, TPanel, TRow, useMessage, type OpcaoDoBanco } from '../kit';
import { lerCoresSugeridas } from '../kit/cores';
import { CORES_DE_REGISTRO_DEMO as DEMO } from './kitDados';

/* ---------------- Dados fictícios: a rota `/api/filiais/selecao` com a cor de cada filial ---------------- */

/** As filiais "do banco": a cor das sugeridas vem dos tokens (nenhum hex aqui); uma "Outra" e uma inválida (neutra). */
function filiaisDemo(): OpcaoDoBanco[] {
  const s = lerCoresSugeridas();
  return [
    { id: 'f1', nome: '1 · Matriz Centro', cor: s[0].hex },
    { id: 'f2', nome: '2 · Zona Norte', cor: s[1].hex },
    { id: 'f3', nome: '3 · Zona Sul', cor: s[2].hex },
    { id: 'f4', nome: '4 · Shopping Leste', cor: s[3].hex },
    { id: 'f5', nome: '5 · Quiosque Aeroporto', cor: DEMO.outra },
    // cor fora do formato (não deveria passar do DTO): a bolinha sai neutra, nada vai para o CSS
    { id: 'f6', nome: '6 · Unidade antiga (cor inválida)', cor: DEMO.invalida },
  ];
}

/** Simula a rede (o "carregando" aparece). Não é animação: é a espera da consulta. */
const demora = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 400));
const filtrar = (lista: OpcaoDoBanco[]) => (termo?: string) =>
  demora(termo ? lista.filter((o) => o.nome.toLowerCase().includes(termo.toLowerCase())) : lista);

type Linha = { filialId: string; filialRotulo: string; filialCor: string | null; preco: string };
const linha = z.object({ filialId: z.string().min(1, 'Escolha a filial.'), filialRotulo: z.string(), filialCor: z.string().nullable(), preco: z.string() });
const schema = z.object({ filiais: z.array(linha).min(1, 'Acrescente as filiais onde o serviço é prestado.') });
type Dados = z.infer<typeof schema>;

/**
 * Catálogo das peças que o cadastro de Serviços pediu (docs/07 §3.2): o `TDBCombo` com a bolinha da cor de registro
 * (`cor` na opção, `corInicial` no valor salvo), lado a lado nos dois temas, e o `TFieldList` com `acoes` (o "Todas
 * as filiais" ao lado do Acrescentar). A lista do combo abre em portal, no tema da página (troque pelo topo); os
 * destaques também.
 */
export function SecaoKitServicos() {
  const msg = useMessage();
  const filiais = useMemo(filiaisDemo, []);
  const [soLeitura, setSoLeitura] = useState(false);
  const [filtro, setFiltro] = useState<Record<'dark' | 'light', string>>({ dark: '', light: '' });
  const [escolhida, setEscolhida] = useState<Record<'dark' | 'light', string>>({ dark: 'f2', light: 'f5' });
  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: { filiais: [{ filialId: 'f1', filialRotulo: filiais[0].nome, filialCor: filiais[0].cor ?? null, preco: '90,00' }] },
  });

  const linhaDe = (f: OpcaoDoBanco): Linha => ({ filialId: f.id, filialRotulo: f.nome, filialCor: f.cor ?? null, preco: '' });
  /** As que ainda não estão na lista (cada filial uma vez): o que o combo da linha oferece, menos a da própria linha. */
  const livres = (propria: string) => {
    const usadas = new Set(form.getValues('filiais').map((l) => l.filialId));
    return filiais.filter((f) => f.id === propria || !usadas.has(f.id));
  };
  const todasAsFiliais = () => {
    const atuais = form.getValues('filiais').filter((l) => l.filialId);
    const faltam = filiais.filter((f) => !atuais.some((l) => l.filialId === f.id)).map(linhaDe);
    form.setValue('filiais', [...atuais, ...faltam], { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  };

  return (
    <div className="col-span-12 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <ConciergeBell className="size-4" aria-hidden /> Kit de telas: peças de Serviços
          </h2>
          <p className="text-xs text-muted text-pretty break-words">
            TDBCombo com a bolinha da filial (cor na opção, corInicial no valor salvo; inválida neutra) · TFieldList com acoes ("Todas as filiais" ao lado do Acrescentar)
          </p>
        </div>
        <Toggle checked={soLeitura} onChange={setSoLeitura} label="TForm somenteLeitura" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {(['dark', 'light'] as const).map((tema) => (
          <div key={tema} data-theme={tema} className="col-span-12 lg:col-span-6 rounded-[22px] bg-[var(--bg)] p-5 text-fg">
            <div className="glass-solid rounded-2xl p-4 flex flex-col gap-4">
              <h3 className="text-sm font-semibold">TDBCombo de filiais — tema {tema === 'dark' ? 'escuro' : 'claro'}</h3>
              <TRow>
                <TDBCombo
                  label="Filial (filtro, com Todas)"
                  vazio="Todas"
                  buscar={filtrar(filiais)}
                  value={filtro[tema]}
                  onChange={(v) => setFiltro((f) => ({ ...f, [tema]: v }))}
                />
              </TRow>
              <TRow>
                <TDBCombo
                  label="Filial (valor salvo)"
                  buscar={filtrar(filiais)}
                  rotuloInicial={filiais.find((f) => f.id === escolhida[tema])?.nome}
                  corInicial={filiais.find((f) => f.id === escolhida[tema])?.cor}
                  value={escolhida[tema]}
                  onChange={(v) => setEscolhida((e) => ({ ...e, [tema]: v }))}
                />
              </TRow>
              <TRow>
                <TDBCombo label="Filial (cor inválida: neutra)" buscar={filtrar(filiais)} rotuloInicial={filiais[5].nome} corInicial={filiais[5].cor} value="f6" disabled />
              </TRow>
            </div>
          </div>
        ))}
      </div>

      <TForm form={form} onSubmit={(d) => msg.sucesso('Válido', JSON.stringify(d))} somenteLeitura={soLeitura}>
        <TPanel title="Filiais e preços" subtitle="Onde o serviço é prestado. Preço vazio é não informado; 0 é gratuito.">
          <TFieldList<Linha>
            name="filiais"
            rotuloAdicionar="Acrescentar filial"
            vazio="Acrescente as filiais onde o serviço é prestado."
            rotuloLinha={(i) => `Filial ${i + 1}`}
            novaLinha={{ filialId: '', filialRotulo: '', filialCor: null, preco: '' }}
            acoes={<TButton variant="secondary" size="sm" icone={ListChecks} label="Todas as filiais" onClick={todasAsFiliais} />}
            colunas={[
              {
                name: 'filialId',
                // rotulo e cor da linha carregada (ou posta pelo "Todas as filiais"); o que se escolhe depois o combo já sabe
                componente: (campo, _i, l) => (
                  <TDBCombo
                    name={campo}
                    label="Filial"
                    required
                    width="medio"
                    buscar={(termo) => filtrar(livres(l.filialId))(termo)}
                    rotuloInicial={l.filialRotulo}
                    corInicial={l.filialCor}
                  />
                ),
              },
              { name: 'preco', componente: (campo) => <TEntry name={campo} label="Preço" mascara="moeda" placeholder="Não informado" /> },
            ]}
          />
        </TPanel>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" />
            <TButton variant="novo" onClick={() => form.reset({ filiais: [] })} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </div>
  );
}
