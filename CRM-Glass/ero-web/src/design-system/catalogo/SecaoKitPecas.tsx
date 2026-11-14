import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Puzzle } from 'lucide-react';
import { hojeIso } from '../../shared/util/format';
import { somarDias } from '../../shared/util/datas';
import { Toggle } from '../ui/Bits';
import {
  TButton,
  TCheckBox,
  TCol,
  TCombo,
  TDBCombo,
  TDate,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TModal,
  TPanel,
  TRadio,
  TRow,
  TTabPanel,
  TTabs,
  useMessage,
  type OpcaoDoBanco,
  type OpcaoRadio,
} from '../kit';

/* ---------------- Dados fictícios: a "API" do catálogo ---------------- */
const USUARIOS: OpcaoDoBanco[] = [
  { id: 'u1', nome: 'Ana Ribeiro' },
  { id: 'u2', nome: 'Bruno Carvalho' },
  { id: 'u3', nome: 'Carla Menezes' },
  { id: 'u4', nome: 'Diego Fontana (inativo)' },
  { id: 'u5', nome: 'Elisa Prado' },
  { id: 'u6', nome: 'Fábio Nunes' },
];
/** Simula a rota `/api/usuarios/selecao` com a demora de uma rede de verdade (o carregando aparece). */
const buscarUsuarios = (termo?: string) =>
  new Promise<OpcaoDoBanco[]>((resolve) =>
    setTimeout(() => resolve(termo ? USUARIOS.filter((u) => u.nome.toLowerCase().includes(termo.toLowerCase())) : USUARIOS), 600),
  );

const NIVEIS: OpcaoRadio[] = [
  { valor: 'NENHUM', rotulo: 'Sem acesso' },
  { valor: 'LER', rotulo: 'Ler' },
  { valor: 'ESCREVER', rotulo: 'Ler e escrever' },
];
const NIVEIS_LIMITADOS: OpcaoRadio[] = NIVEIS.map((n) => (n.valor === 'ESCREVER' ? { ...n, desabilitada: true, dica: 'Você só libera o que tem' } : n));
const TEMAS: OpcaoRadio[] = [
  { valor: 'CONTRATANTE', rotulo: 'Seguir o contratante' },
  { valor: 'CLARO', rotulo: 'Claro' },
  { valor: 'ESCURO', rotulo: 'Escuro' },
];

const schema = z
  .object({
    de: z.string().min(1, 'Informe a data inicial.'),
    ate: z.string().min(1, 'Informe a data final.'),
    usuario: z.string(),
    responsavel: z.string(),
    nivelUsuarios: z.string(),
    nivelLogs: z.string(),
    liberarAcesso: z.boolean(),
    avisos: z.array(z.string()),
    tema: z.string(),
  })
  .refine((d) => !d.de || !d.ate || d.ate >= d.de, { path: ['ate'], message: 'O "Até" não pode ser antes do "De".' });
type Dados = z.infer<typeof schema>;

const senhaSchema = z.object({ senha: z.string().min(12, 'A senha precisa de 12 caracteres ou mais.') });

/**
 * Catálogo das peças do kit que a fatia 3 pediu: TDate, TDBCombo, TRadio, TCheckBox, TPanel somenteLeitura, TModal e
 * TTabs/TTabPanel — num TForm com resolver (erro com linha reservada), com os interruptores de só leitura.
 */
export function SecaoKitPecas() {
  const msg = useMessage();
  const [formSoLeitura, setFormSoLeitura] = useState(false);
  const [painelSoLeitura, setPainelSoLeitura] = useState(true);
  const [modal, setModal] = useState(false);
  const [aba, setAba] = useState('dados');
  const [avisarPor, setAvisarPor] = useState('EMAIL');

  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: {
      de: somarDias(hojeIso(), -6),
      ate: hojeIso(),
      usuario: 'u3',
      responsavel: '',
      nivelUsuarios: 'LER',
      nivelLogs: 'NENHUM',
      liberarAcesso: false,
      avisos: ['email'],
      tema: 'CONTRATANTE',
    },
  });
  const de = form.watch('de');
  const nivelUsuarios = form.watch('nivelUsuarios');

  const formDados = useForm<{ valor: string }>({ defaultValues: { valor: 'Ana Ribeiro' } });
  const formSenha = useForm<{ valor: string }>({ defaultValues: { valor: '' } });
  const formSessoes = useForm<{ valor: string }>({ defaultValues: { valor: 'Chrome no Windows' } });

  const senha = useForm<{ senha: string }>({ resolver: zodResolver(senhaSchema), defaultValues: { senha: '' } });
  const gerar = () => {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    senha.setValue('senha', Array.from(bytes, (b) => 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 56]).join(''), { shouldValidate: true });
  };

  return (
    <div className="col-span-12 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <Puzzle className="size-4" aria-hidden /> Kit de telas: peças da fatia 3
          </h2>
          <p className="text-xs text-muted">TDate · TDBCombo · TRadio · TCheckBox · TPanel somenteLeitura · TModal · TTabs/TTabPanel</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={formSoLeitura} onChange={setFormSoLeitura} label="TForm somenteLeitura" />
          <Toggle checked={painelSoLeitura} onChange={setPainelSoLeitura} label="TPanel somenteLeitura" />
        </div>
      </div>

      <TForm form={form} onSubmit={(d) => msg.sucesso('Válido', JSON.stringify(d))} somenteLeitura={formSoLeitura}>
        <TPanel title="Filtros dos Logs" subtitle="De · Até (TDate, largura data, o Até com min = De) e TDBCombo com busca no servidor">
          <TRow>
            <TCol width="auto">
              <TDate name="de" label="De" required />
            </TCol>
            <TCol width="auto">
              <TDate name="ate" label="Até" min={de} required />
            </TCol>
          </TRow>
          <TRow>
            <TDBCombo name="usuario" label="Usuário" buscar={buscarUsuarios} rotuloInicial="Carla Menezes" vazio="Todos" />
          </TRow>
          <TRow>
            <TDBCombo
              name="responsavel"
              label="Responsável (com cadastro rápido)"
              buscar={buscarUsuarios}
              acao={<TButton variant="novo" label="" aria-label="Cadastrar responsável" title="Cadastrar responsável" onClick={() => msg.info('Cadastro rápido')} />}
            />
          </TRow>
        </TPanel>

        <TPanel
          title="Acesso aos módulos"
          subtitle="TRadio por grupo (setas entre as opções) e TCheckBox para a ação extra"
          somenteLeitura={painelSoLeitura}
        >
          <TRow>
            <TRadio name="nivelUsuarios" label="Usuários" opcoes={NIVEIS} />
          </TRow>
          <TRow>
            <TCheckBox
              name="liberarAcesso"
              label="Liberar acesso a outros usuários"
              ajuda="Só com o grupo em Ler ou acima"
              disabled={nivelUsuarios === 'NENHUM'}
            />
          </TRow>
          <TRow>
            <TRadio name="nivelLogs" label="Logs (quem libera só tem Ler)" opcoes={NIVEIS_LIMITADOS} />
          </TRow>
        </TPanel>

        <TPanel title="Acesso aos módulos do administrador" subtitle="TPanel sem conteúdo ({null}): só o título, sem corpo vazio embaixo">
          {null}
        </TPanel>

        <TPanel title="Preferências" subtitle="TRadio vertical e TCheckBox com opções (grava a lista dos marcados)">
          <TRow>
            <TRadio name="tema" label="Tema" opcoes={TEMAS} vertical />
          </TRow>
          <TRow>
            <TCheckBox
              name="avisos"
              label="Avisos por"
              opcoes={[
                { valor: 'email', rotulo: 'E-mail' },
                { valor: 'sistema', rotulo: 'No sistema' },
                { valor: 'sms', rotulo: 'SMS', desabilitada: true, dica: 'Ainda não disponível' },
              ]}
            />
          </TRow>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={() => form.reset()} />
            <TButton variant="secondary" icone={KeyRound} label="Redefinir senha" onClick={() => setModal(true)} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TModal
        aberto={modal}
        titulo="Redefinir senha"
        descricao="A pessoa troca a senha temporária no próximo acesso."
        onFechar={() => setModal(false)}
        bloquearFechar={senha.formState.isSubmitting}
      >
        <TForm
          form={senha}
          onSubmit={async () => {
            await new Promise((r) => setTimeout(r, 800));
            msg.sucesso('Senha redefinida');
            setModal(false);
            senha.reset();
          }}
        >
          <TRow>
            <TEntry
              name="senha"
              label="Senha temporária"
              type="password"
              required
              width="longo"
              ajuda="12 caracteres ou mais"
              acao={<TButton variant="secondary" label="Gerar" onClick={gerar} />}
            />
          </TRow>
          <TRow>
            <TCombo
              label="Avisar a pessoa por"
              ajuda="A lista abre por cima do modal (camada popover-sobre-modal)"
              opcoes={[
                { valor: 'EMAIL', rotulo: 'E-mail' },
                { valor: 'NENHUM', rotulo: 'Não avisar' },
              ]}
              value={avisarPor}
              onChange={setAvisarPor}
            />
          </TRow>
          <TFormFooter>
            <TFormActionsLeft>
              <TButton variant="salvar" type="submit" loading={senha.formState.isSubmitting} />
              <TButton variant="voltar" label="Cancelar" onClick={() => setModal(false)} />
            </TFormActionsLeft>
          </TFormFooter>
        </TForm>
      </TModal>

      <div>
        <h3 className="text-sm font-semibold">TTabs · TTabPanel (Minha conta)</h3>
        <p className="text-xs text-muted">Cada aba com o seu TForm; o useForm mora na tela, então o que foi digitado sobrevive à troca de aba.</p>
      </div>
      <TTabs
        label="Minha conta"
        ativa={aba}
        onChange={setAba}
        abas={[
          { id: 'dados', rotulo: 'Meus dados' },
          { id: 'senha', rotulo: 'Senha', alerta: true },
          { id: 'sessoes', rotulo: 'Sessões' },
        ]}
      >
        <TTabPanel id="dados" rotulo="Meus dados">
          <AbaDemo form={formDados} campo="Nome" />
        </TTabPanel>
        <TTabPanel id="senha" rotulo="Senha">
          <AbaDemo form={formSenha} campo="Senha atual" senha />
        </TTabPanel>
        <TTabPanel id="sessoes" rotulo="Sessões">
          <AbaDemo form={formSessoes} campo="Navegador" />
        </TTabPanel>
      </TTabs>
    </div>
  );
}

/** O `useForm` de cada aba mora na tela (acima): o que foi digitado sobrevive à troca de aba. */
function AbaDemo({ form, campo, senha }: { form: UseFormReturn<{ valor: string }>; campo: string; senha?: boolean }) {
  const msg = useMessage();
  return (
    <TForm form={form} onSubmit={() => msg.sucesso(`${campo}: salvo`)}>
      <TRow>
        <TEntry name="valor" label={campo} type={senha ? 'password' : undefined} />
      </TRow>
      <TFormFooter>
        <TFormActionsLeft>
          <TButton variant="salvar" type="submit" />
        </TFormActionsLeft>
      </TFormFooter>
    </TForm>
  );
}
