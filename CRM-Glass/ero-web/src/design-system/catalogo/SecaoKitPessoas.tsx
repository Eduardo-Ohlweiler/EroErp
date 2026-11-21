import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Contact, TriangleAlert } from 'lucide-react';
import { erroDeProblemDetail } from '../../shared/api/erros';
import { Toggle } from '../ui/Bits';
import {
  TBadge,
  TButton,
  TCombo,
  TDBCombo,
  TEntry,
  TFieldList,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPanel,
  TRadio,
  TRow,
  TTextArea,
  useMessage,
  type OpcaoCombo,
  type OpcaoDoBanco,
} from '../kit';

/* ---------------- Dados fictícios: os tipos "do banco" e as rotas de seleção ---------------- */
const TIPOS_TELEFONE: OpcaoCombo[] = [
  { valor: 't1', rotulo: 'Celular' },
  { valor: 't2', rotulo: 'Comercial' },
  { valor: 't3', rotulo: 'Residencial' },
  { valor: 't4', rotulo: 'WhatsApp' },
];
/** Um tipo próprio inativado que continua gravado numa linha: aparece como "… (inativo)" e o combo passa a `medio`. */
const TIPO_INATIVO: OpcaoCombo = { valor: 't9', rotulo: 'Recado com a vizinha', inativo: true };
const TIPOS_ENDERECO: OpcaoCombo[] = [
  { valor: 'e1', rotulo: 'Residencial' },
  { valor: 'e2', rotulo: 'Comercial' },
  { valor: 'e3', rotulo: 'Cobrança' },
  { valor: 'e4', rotulo: 'Entrega' },
];
const VINCULOS: OpcaoCombo[] = [
  { valor: 'CONJUGE', rotulo: 'Cônjuge' },
  { valor: 'PAI_MAE', rotulo: 'Pai ou mãe' },
  { valor: 'FILHO', rotulo: 'Filho ou filha' },
  { valor: 'CONTATO', rotulo: 'Contato da empresa' },
];
const CIDADES: OpcaoDoBanco[] = [
  { id: 'c1', nome: 'Porto Alegre - RS' },
  { id: 'c2', nome: 'Canoas - RS' },
  { id: 'c3', nome: 'Florianópolis - SC' },
  { id: 'c4', nome: 'São Paulo - SP' },
];
const PESSOAS: OpcaoDoBanco[] = [
  { id: 'p1', nome: '12 · Ana Ribeiro' },
  { id: 'p2', nome: '27 · Bruno Carvalho' },
  { id: 'p3', nome: '31 · Solar Energia Ltda.' },
];
const demora = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 500));
const filtrar = (lista: OpcaoDoBanco[]) => (termo?: string) =>
  demora(termo ? lista.filter((o) => o.nome.toLowerCase().includes(termo.toLowerCase())) : lista);
/** Simula o `GET /api/localidade/cep/{cep}` (o ViaCEP pela ero-api). */
const consultarCep = (cep: string) =>
  demora(cep.startsWith('9') ? { rua: 'Avenida Ipiranga', bairro: 'Partenon', cidadeId: 'c1', cidadeRotulo: 'Porto Alegre - RS' } : null);

const telefone = z.object({ tipoId: z.string().min(1, 'Escolha o tipo.'), numero: z.string().min(10, 'Telefone incompleto.'), observacao: z.string(), principal: z.boolean() });
const endereco = z.object({
  tipoId: z.string().min(1, 'Escolha o tipo.'),
  principal: z.boolean(),
  cep: z.string(),
  numero: z.string(),
  complemento: z.string(),
  rua: z.string(),
  bairro: z.string(),
  cidadeId: z.string().min(1, 'Escolha a cidade.'),
  cidadeRotulo: z.string(),
});
const vinculo = z.object({ pessoaId: z.string().min(1, 'Escolha a pessoa.'), pessoaRotulo: z.string(), tipo: z.string().min(1, 'Escolha o vínculo.'), observacao: z.string() });
const schema = z.object({
  tipoPessoa: z.string(),
  observacao: z.string().max(500, 'Até 500 caracteres.'),
  telefones: z.array(telefone).min(1, 'Informe ao menos um telefone.'),
  enderecos: z.array(endereco),
  vinculos: z.array(vinculo),
});
type Dados = z.infer<typeof schema>;
type Telefone = z.infer<typeof telefone>;
type Endereco = z.infer<typeof endereco>;
type Vinculo = z.infer<typeof vinculo>;

const INICIAL: Dados = {
  tipoPessoa: 'FISICA',
  observacao: 'Prefere contato pela manhã.',
  telefones: [
    { tipoId: 't1', numero: '51999887766', observacao: '', principal: true },
    { tipoId: 't9', numero: '5133224455', observacao: 'Só em horário comercial', principal: false },
  ],
  enderecos: [
    {
      tipoId: 'e1',
      principal: true,
      cep: '90610000',
      numero: '1200',
      complemento: 'Ap. 301',
      rua: 'Avenida Ipiranga',
      bairro: 'Partenon',
      cidadeId: 'c1',
      cidadeRotulo: 'Porto Alegre - RS',
    },
  ],
  vinculos: [{ pessoaId: 'p3', pessoaRotulo: '31 · Solar Energia Ltda.', tipo: 'CONTATO', observacao: '' }],
};

/**
 * Catálogo das peças que o cadastro de Pessoas pediu (docs/07): `TFieldList` (telefones numa linha, endereço em várias
 * linhas com o CEP que completa, vínculo com cadastro rápido), `TTextArea` com contador, `TCombo` com largura
 * automática (com o inativo gravado) e o `erroApi` com colchetes. O submenu flutuante está no trilho desta página
 * ("Cadastros auxiliares"). Interruptor de só leitura; teste nos dois temas e com dois destaques (violeta e âmbar).
 */
export function SecaoKitPessoas() {
  const msg = useMessage();
  const [soLeitura, setSoLeitura] = useState(false);
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: INICIAL });
  const pj = form.watch('tipoPessoa') === 'JURIDICA';

  const completarCep = async (i: number, cep: string) => {
    const achado = await consultarCep(cep);
    if (!achado) {
      form.setError(`enderecos.${i}.cep`, { message: 'CEP não encontrado.' });
      return;
    }
    form.clearErrors(`enderecos.${i}.cep`);
    (['rua', 'bairro', 'cidadeId', 'cidadeRotulo'] as const).forEach((c) => form.setValue(`enderecos.${i}.${c}`, achado[c], { shouldDirty: true }));
  };

  const simular400 = () =>
    msg.erroApi(
      erroDeProblemDetail(400, {
        detail: 'Existem campos inválidos.',
        erros: [{ campo: 'telefones[0].numero', mensagem: 'Este telefone já está em outra linha.' }],
      }),
      form,
    );

  return (
    <div className="col-span-12 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <Contact className="size-4" aria-hidden /> Kit de telas: peças de Pessoas
          </h2>
          <p className="text-xs text-muted">
            TFieldList · TTextArea · TCombo automático · TEntry onCompletar · erroApi com colchetes · submenu no trilho (Cadastros auxiliares)
          </p>
        </div>
        <Toggle checked={soLeitura} onChange={setSoLeitura} label="TForm somenteLeitura" />
      </div>

      <TForm form={form} onSubmit={(d) => msg.sucesso('Válido', JSON.stringify(d))} somenteLeitura={soLeitura}>
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
        <TRow>
          <TTextArea name="observacao" label={pj ? 'Observação sobre a empresa' : 'Observação'} maxLength={500} />
        </TRow>

        <TPanel title="Telefones" subtitle="Uma linha por item; Principal exclusivo; o tipo inativo gravado aparece como (inativo) e o combo vai a medio">
          <TFieldList<Telefone>
            name="telefones"
            principal="principal"
            rotuloAdicionar="Acrescentar telefone"
            vazio="Nenhum telefone."
            rotuloLinha={(i) => `Telefone ${i + 1}`}
            novaLinha={{ tipoId: '', numero: '', observacao: '', principal: false }}
            colunas={[
              {
                name: 'tipoId',
                componente: (campo, _i, linha) => (
                  <TCombo name={campo} label="Tipo" required opcoes={linha.tipoId === TIPO_INATIVO.valor ? [...TIPOS_TELEFONE, TIPO_INATIVO] : TIPOS_TELEFONE} />
                ),
              },
              { name: 'numero', componente: (campo) => <TEntry name={campo} label="Número" mascara="telefone" required /> },
              { name: 'observacao', dividir: true, componente: (campo) => <TEntry name={campo} label="Observação" maxLength={255} /> },
            ]}
          />
        </TPanel>

        <TPanel title="Endereços" subtitle="Item em várias linhas; o CEP completo (8 dígitos) consulta e preenche rua, bairro e cidade — teste com 9…">
          <TFieldList<Endereco>
            name="enderecos"
            principal="principal"
            rotuloAdicionar="Acrescentar endereço"
            vazio="Nenhum endereço."
            rotuloLinha={(i) => `Endereço ${i + 1}`}
            novaLinha={() => ({ tipoId: '', principal: false, cep: '', numero: '', complemento: '', rua: '', bairro: '', cidadeId: '', cidadeRotulo: '' })}
            colunas={[
              [{ name: 'tipoId', componente: (campo) => <TCombo name={campo} label="Tipo" required opcoes={TIPOS_ENDERECO} /> }],
              [
                {
                  name: 'cep',
                  componente: (campo, i) => <TEntry name={campo} label="CEP" mascara="cep" onCompletar={(cep) => void completarCep(i, cep)} />,
                },
                { name: 'numero', componente: (campo) => <TEntry name={campo} label="Número" maxLength={20} width="curto" /> },
                { name: 'complemento', componente: (campo) => <TEntry name={campo} label="Complemento" maxLength={100} width="curto" /> },
              ],
              [{ name: 'rua', componente: (campo) => <TEntry name={campo} label="Rua" maxLength={255} width="longo" /> }],
              [
                { name: 'bairro', componente: (campo) => <TEntry name={campo} label="Bairro" maxLength={100} width="curto" /> },
                {
                  name: 'cidadeId',
                  componente: (campo, _i, linha) => (
                    <TDBCombo name={campo} label="Cidade" required width="medio" buscar={filtrar(CIDADES)} rotuloInicial={linha.cidadeRotulo} />
                  ),
                },
              ],
            ]}
          />
        </TPanel>

        <TPanel title="Vínculos" subtitle="TDBCombo com o cadastro rápido colado (acao); nota sob a linha (detalhe)">
          <TFieldList<Vinculo>
            name="vinculos"
            rotuloAdicionar="Acrescentar vínculo"
            vazio="Nenhum vínculo."
            rotuloLinha={(i) => `Vínculo ${i + 1}`}
            novaLinha={{ pessoaId: '', pessoaRotulo: '', tipo: '', observacao: '' }}
            detalhe={(_i, linha) =>
              linha.pessoaId === 'p3' ? (
                <span className="flex items-center gap-2 text-xs text-muted">
                  <TBadge tom="alerta">Inativa</TBadge> A pessoa vinculada está inativa.
                </span>
              ) : null
            }
            colunas={[
              {
                name: 'pessoaId',
                componente: (campo, _i, linha) => (
                  <TDBCombo
                    name={campo}
                    label="Pessoa"
                    required
                    width="medio"
                    buscar={filtrar(PESSOAS)}
                    rotuloInicial={linha.pessoaRotulo}
                    acao={<TButton variant="novo" label="" aria-label="Cadastrar pessoa" title="Cadastrar pessoa" onClick={() => msg.info('Cadastro rápido')} />}
                  />
                ),
              },
              { name: 'tipo', componente: (campo) => <TCombo name={campo} label="É o quê desta pessoa" required opcoes={VINCULOS} /> },
              { name: 'observacao', dividir: true, componente: (campo) => <TEntry name={campo} label="Observação" maxLength={255} /> },
            ]}
          />
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={() => form.reset({ ...INICIAL, telefones: [], enderecos: [], vinculos: [], observacao: '' })} />
            <TButton variant="secondary" icone={TriangleAlert} label="Simular 400 em telefones[0].numero" onClick={simular400} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </div>
  );
}
