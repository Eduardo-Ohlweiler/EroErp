import { useForm } from 'react-hook-form';
import { TrocaDeBlocos } from '../../motion/coreografia';
import { TCombo, TEntry, TFieldList, TForm, TPanel, TRadio, TRow, type OpcaoCombo } from '../kit';

/*
 * Demonstração da coreografia `linhaDaLista` (motion/tokens.ts) com as peças reais do kit, dentro da ficha da
 * demonstração entre rotas (aba "Contatos"):
 *  - Acrescentar telefone: o espaço abre e a linha aparece; o foco vai ao primeiro campo dela.
 *  - Remover: a linha some e recolhe, o Acrescentar sobe sem pulo e recebe o foco.
 *  - Física ↔ Jurídica: <TrocaDeBlocos> troca os campos no lugar, sem pular o que está embaixo.
 * Com movimento reduzido, só esmaece; no modo leve, sem altura.
 */

type Telefone = { tipoId: string; numero: string; principal: boolean };
type Dados = { tipoPessoa: 'FISICA' | 'JURIDICA'; cpf: string; rg: string; cnpj: string; ie: string; telefones: Telefone[] };

const TIPOS: OpcaoCombo[] = [
  { valor: 't1', rotulo: 'Celular' },
  { valor: 't2', rotulo: 'Comercial' },
  { valor: 't3', rotulo: 'WhatsApp' },
];

const INICIAL: Dados = {
  tipoPessoa: 'FISICA',
  cpf: '',
  rg: '',
  cnpj: '',
  ie: '',
  telefones: [{ tipoId: 't1', numero: '51999887766', principal: true }],
};

export function DemoContatos() {
  const form = useForm<Dados>({ defaultValues: INICIAL });
  const tipo = form.watch('tipoPessoa');
  return (
    <TForm form={form} onSubmit={() => {}}>
      <TRow>
        <TRadio
          name="tipoPessoa"
          label="Tipo de pessoa"
          opcoes={[
            { valor: 'FISICA', rotulo: 'Física' },
            { valor: 'JURIDICA', rotulo: 'Jurídica' },
          ]}
        />
      </TRow>
      <TrocaDeBlocos chave={tipo}>
        {tipo === 'FISICA' ? (
          <TRow>
            <TEntry name="cpf" label="CPF" mascara="cpf" />
            <TEntry name="rg" label="RG" maxLength={10} width="curto" />
          </TRow>
        ) : (
          <>
            <TRow>
              <TEntry name="cnpj" label="CNPJ" mascara="cnpj" />
            </TRow>
            <TRow>
              <TEntry name="ie" label="Inscrição estadual" maxLength={20} width="curto" />
            </TRow>
          </>
        )}
      </TrocaDeBlocos>
      <TPanel title="Telefones" subtitle="Acrescente e remova: a linha abre e recolhe; o foco acompanha">
        <TFieldList<Telefone>
          name="telefones"
          principal="principal"
          rotuloAdicionar="Acrescentar telefone"
          vazio="Nenhum telefone."
          rotuloLinha={(i) => `Telefone ${i + 1}`}
          novaLinha={{ tipoId: '', numero: '', principal: false }}
          colunas={[
            { name: 'tipoId', componente: (c) => <TCombo name={c} label="Tipo" opcoes={TIPOS} /> },
            { name: 'numero', componente: (c) => <TEntry name={c} label="Número" mascara="telefone" /> },
          ]}
        />
      </TPanel>
    </TForm>
  );
}
