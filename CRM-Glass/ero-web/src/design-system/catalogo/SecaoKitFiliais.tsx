import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Palette } from 'lucide-react';
import { Toggle } from '../ui/Bits';
import { TButton, TCor, TCorMarca, TForm, TFormActionsLeft, TFormFooter, TRow, useMessage } from '../kit';
import { FORMATO_DA_COR, lerCoresSugeridas, rotuloDaCor } from '../kit/cores';
import { CORES_DE_REGISTRO_DEMO as DEMO } from './kitDados';

const schema = z.object({
  vazia: z.string().regex(FORMATO_DA_COR, 'Escolha a cor.'),
  sugerida: z.string().regex(FORMATO_DA_COR, 'Escolha a cor.'),
  outra: z.string().regex(FORMATO_DA_COR, 'Escolha a cor.'),
});
type Dados = z.infer<typeof schema>;
const INICIAL: Dados = { vazia: '', sugerida: DEMO.sugerida, outra: DEMO.outra };

/**
 * Catálogo das peças que o cadastro de Filiais pediu (docs/07 §3.2, "Cor de registro"): o `TCor` (vazio, sugerida,
 * "Outra", erro, só leitura, desabilitado) e o `TCorMarca` numa grade, lado a lado nos dois temas, com as 8 sugeridas
 * e as cores-limite do anel (`#FFFF00`, `#111111`). Os seis destaques pelo seletor do topo da página.
 */
export function SecaoKitFiliais() {
  const msg = useMessage();
  const [soLeitura, setSoLeitura] = useState(false);
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: INICIAL });
  const leitura = useForm<{ cor: string }>({ defaultValues: { cor: DEMO.sugerida } });
  const [solta, setSolta] = useState('');
  const sugeridas = useMemo(() => lerCoresSugeridas(), []);

  const marcas: { cor: string; nome: string }[] = [
    ...sugeridas.map((s) => ({ cor: s.hex ?? '', nome: s.nome })),
    { cor: DEMO.outra, nome: rotuloDaCor(DEMO.outra, sugeridas) },
    { cor: DEMO.amareloLimite, nome: rotuloDaCor(DEMO.amareloLimite, sugeridas) },
    { cor: DEMO.pretoLimite, nome: rotuloDaCor(DEMO.pretoLimite, sugeridas) },
    { cor: DEMO.invalida, nome: 'Inválida (neutra)' },
  ];

  return (
    <div className="col-span-12 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* a legenda quebra a linha (min-w-0 + flex-1): nada cortado no 1440 nem no 360 */}
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <Palette className="size-4" aria-hidden /> Kit de telas: peças de Filiais
          </h2>
          <p className="text-xs text-muted text-pretty break-words">
            TCor (radiogroup: setas, Home, End; Enter em Outra abre o seletor) · TCorMarca (sm 12 px, md 16 px, anel --line-strong) ·
            barra inferior com "Mais" (celular, abaixo de 768 px)
          </p>
        </div>
        <Toggle checked={soLeitura} onChange={setSoLeitura} label="TForm somenteLeitura" />
      </div>

      <TForm form={form} onSubmit={(d) => msg.sucesso('Válido', JSON.stringify(d))} somenteLeitura={soLeitura}>
        <TRow>
          <TCor name="vazia" label="Cor (vazio, obrigatório)" required ajuda="Cadastro novo abre sem cor: a escolha é consciente." />
        </TRow>
        <TRow>
          <TCor name="sugerida" label="Cor (sugerida: Verde)" required />
        </TRow>
        <TRow>
          <TCor name="outra" label="Cor (Outra)" required />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" />
            <TButton variant="novo" onClick={() => form.reset({ vazia: '', sugerida: '', outra: '' })} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <TForm form={leitura} onSubmit={() => {}} somenteLeitura>
            <TRow>
              <TCor name="cor" label="Cor (só leitura)" />
            </TRow>
          </TForm>
        </div>
        <div className="col-span-12 lg:col-span-6 glass-solid rounded-[22px] p-5 flex flex-col gap-4">
          <TCor label="Cor (erro, fora de TForm)" value={solta} onChange={setSolta} required error={solta ? undefined : 'Escolha a cor.'} />
          <TCor label="Cor (desabilitado)" value={DEMO.sugerida} disabled />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {(['dark', 'light'] as const).map((tema) => (
          <div key={tema} data-theme={tema} className="col-span-12 lg:col-span-6 rounded-[22px] bg-[var(--bg)] p-5 text-fg">
            <div className="glass-solid rounded-2xl p-4">
              <h3 className="mb-3 text-sm font-semibold">TCorMarca — tema {tema === 'dark' ? 'escuro' : 'claro'}</h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                {marcas.map((m) => (
                  <li key={m.nome} className="flex items-center gap-2 min-w-0">
                    <TCorMarca cor={m.cor} tamanho="sm" />
                    <TCorMarca cor={m.cor} rotulo={`Cor: ${m.nome}`} />
                    {/* quebra a linha em vez de cortar: o hex de "Outra (#A1B2C3)" fica visível no 360 */}
                    <span aria-hidden className="min-w-0 break-words">{m.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
