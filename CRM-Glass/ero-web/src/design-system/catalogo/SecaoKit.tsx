import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, LayoutList, LockKeyholeOpen, LogIn, LogOut } from 'lucide-react';
import { ErroApi } from '../../shared/api/erros';
import { formatarDocumento } from '../../shared/util/format';
import { Toggle } from '../ui/Bits';
import { Button } from '../ui/Button';
import { CardHeader, GlassCard } from '../ui/Glass';
import {
  DocumentoLista,
  SITUACAO_OPCOES,
  TAuditoria,
  TBadge,
  TButton,
  TCol,
  TCombo,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPanel,
  TRow,
  useMessage,
  useQuestion,
  type Largura,
  type VarianteTButton,
} from '../kit';

const ACOES: VarianteTButton[] = ['salvar', 'buscar', 'limpar', 'novo', 'exportar', 'pdf', 'voltar'];
const FIXAS: Largura[] = ['uf', 'codigo', 'quantidade', 'data', 'valor', 'cpf', 'situacao', 'cnpj', 'dataHora', 'medio'];

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.'),
  documento: z.string(),
  telefone: z.string(),
  cep: z.string(),
  valor: z.string(),
  inteiro: z.string(),
  hora: z.string(),
  situacao: z.string(),
  de: z.string(),
  ate: z.string(),
});
type Dados = z.infer<typeof schema>;

/**
 * "Kit de telas" no catálogo: as peças do docs/07 (botões de ação, larguras, máscaras, só leitura, mensagens,
 * confirmação, folha) e os links para os modelos List e Form em tela cheia (?kit=...).
 */
export function SecaoKit() {
  const [, setParams] = useSearchParams();
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const [carregando, setCarregando] = useState(false);
  const [somenteLeitura, setSomenteLeitura] = useState(false);
  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', documento: '12ABC34501DE35', telefone: '', cep: '', valor: '', inteiro: '', hora: '', situacao: 'true', de: '', ate: '' },
  });

  const abrir = (kit: string, id?: string) => setParams({ kit, ...(id ? { id } : {}) });

  return (
    <div className="col-span-12 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <LayoutList className="size-4" aria-hidden /> Kit de telas (docs/07)
          </h2>
          <p className="text-xs text-muted">
            TPage · TForm · TRow/TCol · TPanel · TEntry · TCombo · TButton · TDataGrid · TBadge · TAuditoria · TAcoesDeExportacao · useMessage · useQuestion
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={() => abrir('lista')}>
            Modelo List <ArrowRight aria-hidden className="size-4" />
          </Button>
          <Button size="sm" onClick={() => abrir('novo')}>
            Form: novo
          </Button>
          <Button size="sm" onClick={() => abrir('editar', 'c2')}>
            Form: editar
          </Button>
          <Button size="sm" onClick={() => abrir('leitura', 'c2')}>
            Só leitura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard level="solid" className="col-span-12 xl:col-span-6 min-w-0">
          <CardHeader
            title="TButton: ações"
            subtitle="Cores do 2.0 em vidro: degradê opaco (texto AA nos dois temas), brilho da cor, reflexo no hover"
            action={<Toggle checked={carregando} onChange={setCarregando} label="Carregando" />}
          />
          <div className="flex flex-wrap gap-2">
            {ACOES.map((v) => (
              <TButton key={v} variant={v} loading={carregando} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <span className="text-xs text-subtle">Grade (só ícone, sm, 32×32 em toda variante):</span>
            <TButton variant="editar" label="" size="sm" />
            <TButton variant="inativar" label="" size="sm" />
            <TButton variant="reativar" label="" size="sm" />
            <TButton variant="secondary" icone={LogIn} label="" size="sm" aria-label="Acessar Demo Solar" title="Acessar contratante" loading={carregando} />
            <TButton variant="secondary" icone={LockKeyholeOpen} label="" size="sm" aria-label="Desbloquear Marina" title="Desbloquear" />
            <TButton variant="danger" icone={LogOut} label="" size="sm" aria-label="Encerrar a sessão do Chrome" title="Encerrar sessão" />
            <span className="text-xs text-subtle ml-2">Genéricas:</span>
            <TButton variant="primary" label="Primary" />
            <TButton variant="secondary" label="Secondary" />
            <TButton variant="ghost" label="Ghost" />
            <TButton variant="danger" label="Danger" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-xs text-subtle">Etiquetas:</span>
            <TBadge tom="sucesso" ponto>
              Ativo
            </TBadge>
            <TBadge tom="erro" ponto>
              Inativo
            </TBadge>
            <TBadge tom="alerta">Bloqueado</TBadge>
            <TBadge tom="info">Matriz</TBadge>
            <TBadge tom="destaque">Administrador</TBadge>
            <TBadge>Neutro</TBadge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-xs text-subtle">useMessage · useQuestion:</span>
            <Button size="sm" onClick={() => msg.sucesso('Contratante salvo')}>
              Sucesso
            </Button>
            <Button size="sm" onClick={() => msg.erro('Não foi possível salvar', 'O erro fica até fechar.')}>
              Erro
            </Button>
            <Button size="sm" onClick={() => msg.erroApi(new ErroApi({ status: 409, codigo: 'CONFLITO' }))}>
              409
            </Button>
            <Button size="sm" onClick={() => msg.erroApi(new ErroApi({ status: 429, detail: 'Muitos códigos pedidos.', retryAfter: 1500 }))}>
              429
            </Button>
            <Button
              size="sm"
              onClick={() =>
                msg.erroApi(
                  new ErroApi({ status: 400, detail: 'Existem campos inválidos.', erros: [{ campo: 'nome', mensagem: 'Já existe um contratante com este nome.' }] }),
                  form,
                )
              }
            >
              400 no campo
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                const sim = await confirmar({ mensagem: 'Inativar Demo Solar? Ninguém dele consegue entrar e as sessões abertas caem.', variante: 'inativar' });
                msg.info(sim ? 'Confirmou' : 'Cancelou');
              }}
            >
              Confirmar inativar
            </Button>
          </div>
        </GlassCard>

        <GlassCard level="solid" className="col-span-12 xl:col-span-6 min-w-0">
          <CardHeader title="Larguras fixas (docs/07 §2.1)" subtitle="Dentro de TRow; abaixo de 640 px todo campo é 100 %" />
          <div className="flex flex-col gap-3">
            {FIXAS.map((w) => (
              <TRow key={w}>
                <TEntry label={w} width={w} value="" onChange={() => {}} placeholder={w} />
              </TRow>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Fora de qualquer cartão: o TForm já é o cartão de vidro (nada de vidro dentro de vidro). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">TForm com resolver: máscaras, TCol, TPanel, só leitura e TAuditoria</h3>
          <p className="text-xs text-muted">Com resolver o erro tem a linha reservada; nos filtros (sem resolver) não. Campo só leitura tem fundo próprio.</p>
        </div>
        <Toggle checked={somenteLeitura} onChange={setSomenteLeitura} label="TForm somenteLeitura" />
      </div>
      <TForm form={form} onSubmit={() => msg.sucesso('Válido')} somenteLeitura={somenteLeitura}>
        <TRow>
          <TEntry name="nome" label="Nome (metade, obrigatório)" required />
        </TRow>
        <TRow>
          <TEntry name="documento" label="CNPJ ou CPF (cpfCnpj)" mascara="cpfCnpj" ajuda="Grava cru e em maiúsculas" />
        </TRow>
        <TRow>
          <TCol width="auto">
            <TEntry name="telefone" label="Telefone" mascara="telefone" />
          </TCol>
          <TCol width="auto">
            <TEntry name="cep" label="CEP" mascara="cep" />
          </TCol>
          <TCol width="auto">
            <TEntry name="hora" label="Hora" mascara="hora" />
          </TCol>
        </TRow>
        <TRow>
          <TCol width="auto">
            <TEntry name="valor" label="Valor (moeda)" mascara="moeda" />
          </TCol>
          <TCol width="auto">
            <TEntry name="inteiro" label="Limite (inteiro)" mascara="inteiro" />
          </TCol>
          <TCol width="auto">
            <TCombo name="situacao" label="Situação" opcoes={SITUACAO_OPCOES} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="de" label="De (longo, linha dividida)" width="longo" />
          </TCol>
          <TCol>
            <TEntry name="ate" label="Até (longo, linha dividida)" width="longo" />
          </TCol>
        </TRow>
        <TPanel title="Painel recolhível" subtitle="TPanel sem vidro próprio" recolhido={false}>
          <TRow>
            <TEntry label="Código (disabled)" width="codigo" value="000123" onChange={() => {}} disabled />
          </TRow>
        </TPanel>
        <TAuditoria
          registro={{ criadoPorNome: 'Eduardo (superadmin)', createdAt: '2026-11-02T13:20:00Z', alteradoPorNome: 'Ana Ribeiro', updatedAt: '2026-11-12T18:45:00Z' }}
        />
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={() => form.reset()} />
            <TButton variant="voltar" onClick={() => msg.info('Voltar')} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <GlassCard level="solid" className="min-w-0">
        <CardHeader title="Folha impressa (documento da TPage)" subtitle="Papel branco e texto preto nos dois temas (--folha-*). Na tela real só aparece ao imprimir (Pdf)." />
        <div className="folha-na-tela">
          <DocumentoLista
            titulo="Contratantes"
            chaveDe={(c) => c.nome}
            filtros={[{ rotulo: 'Situação', valor: 'Ativos' }]}
            truncado={0}
            colunas={[
              { titulo: 'Nome', valor: (c) => c.nome },
              { titulo: 'Documento', semQuebra: true, valor: (c) => formatarDocumento(c.doc) },
              { titulo: 'Usuários', numerica: true, valor: (c) => c.u },
            ]}
            linhas={[
              { nome: 'Demo Solar', doc: '12ABC34501DE35', u: '2 de 5' },
              { nome: 'Demo Marina', doc: '11222333000181', u: '4 de 10' },
            ]}
          />
        </div>
      </GlassCard>
    </div>
  );
}
