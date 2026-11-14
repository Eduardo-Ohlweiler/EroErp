import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Palette } from 'lucide-react';
import {
  TAuditoria,
  TButton,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TPanel,
  TRow,
  useMessage,
  useSomenteLeitura,
} from '../../../design-system/kit';
import { ROTULO_ADMINISTRATIVO } from '../../../shared/sessao';
import { formatarNumero } from '../../../shared/util/format';
import { tenantsApi } from '../api/tenants';
import {
  paraCorpo,
  paraCorpoCriacao,
  paraForm,
  schemaCriacao,
  schemaEdicao,
  VAZIO,
  type DadosContratante,
} from '../schemas/contratante';

/** Cópia do modelo Form (docs/07 §4.2). Difere dele só no que é `// troca`. */

const LISTA = '/admin/contratantes'; // troca

/** "1 ativo hoje", "1.200 ativos hoje". */
const ativosHoje = (n: number) => `${formatarNumero(n, 0)} ${n === 1 ? 'ativo' : 'ativos'} hoje`;

export function ContratanteForm() {
  // troca
  const { id } = useParams();
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura(); // troca: presa ao papel (SUPERADMIN), sem grupo
  const msg = useMessage();
  const queryClient = useQueryClient();
  const form = useForm<DadosContratante>({
    // troca: o schema espelha o TenantCreateDto (com o administrador) e o TenantUpdateDto
    resolver: zodResolver(id ? schemaEdicao : schemaCriacao) as unknown as Resolver<DadosContratante>,
    defaultValues: VAZIO,
  });
  const salvo = useQuery({ queryKey: ['tenants', id], queryFn: () => tenantsApi.buscar(id!), enabled: !!id }); // troca

  useEffect(() => {
    if (salvo.data) form.reset(paraForm(salvo.data));
  }, [salvo.data, form]);

  // Registro que não existe (ou a Plataforma, que a API devolve como 404): avisa e volta à lista.
  useEffect(() => {
    if (!salvo.error) return;
    msg.erroApi(salvo.error);
    navigate(LISTA, { replace: true });
  }, [salvo.error, msg, navigate]);

  const salvar = async (d: DadosContratante) => {
    try {
      const t = id
        ? await tenantsApi.alterar(id, { ...paraCorpo(d), version: salvo.data!.version }) // troca: 409 se outra pessoa salvou antes
        : await tenantsApi.criar(paraCorpoCriacao(d)); // troca
      msg.sucesso('Contratante salvo'); // troca
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate(`${LISTA}/${t.id}`);
    } catch (e) {
      msg.erroApi(e, form);
    }
  };
  const novo = () => (id ? navigate(`${LISTA}/novo`) : form.reset(VAZIO));

  return (
    <TPage
      title={somenteLeitura ? 'Contratante' : id ? 'Editar contratante' : 'Novo contratante'} // troca
      breadcrumb={[ROTULO_ADMINISTRATIVO, 'Contratantes', id ? (salvo.data?.nome ?? 'Editar') : 'Novo']} // troca
      coreografia="formulario"
      carregando={salvo.isLoading}
      actions={
        // troca: ação que não é salvar fica no `actions` da TPage (docs/07 §4.2, item 6)
        id && !somenteLeitura ? (
          <TButton
            variant="secondary"
            icone={Palette}
            label="Configurar aparência"
            onClick={() => navigate(`${LISTA}/${id}/aparencia`)}
          />
        ) : undefined
      }
    >
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        {/* troca: campos */}
        <TRow>
          <TEntry name="nome" label="Nome" required autoFocus={!somenteLeitura} maxLength={150} />
        </TRow>
        <TRow>
          <TEntry name="documento" label="CNPJ ou CPF" mascara="cpfCnpj" ajuda="Aceita o CNPJ alfanumérico" />
        </TRow>
        <TRow>
          <TEntry name="email" label="E-mail" type="email" maxLength={255} />
        </TRow>
        <TRow>
          <TEntry
            name="limiteUsuarios"
            label="Limite de usuários"
            mascara="inteiro"
            required
            ajuda={id ? ativosHoje(salvo.data?.usuariosAtivos ?? 0) : 'O administrador conta como um'}
          />
        </TRow>

        {!id && (
          // troca: só na criação
          <TPanel title="Administrador" subtitle="O primeiro acesso do contratante">
            <TRow>
              <TEntry name="administrador.nome" label="Nome" required maxLength={150} />
            </TRow>
            <TRow>
              <TEntry name="administrador.email" label="E-mail" type="email" required maxLength={255} />
            </TRow>
            <TRow>
              <TEntry
                name="administrador.senha"
                label="Senha temporária"
                type="password"
                required
                maxLength={128}
                ajuda="Ele troca no primeiro acesso"
              />
            </TRow>
          </TPanel>
        )}

        {/* Sem Situação: o TenantUpdateDto não recebe `ativo` (docs/07 §0) — inativar e reativar ficam na grade. */}
        <TAuditoria registro={salvo.data} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />
            <TButton variant="voltar" onClick={() => navigate(LISTA)} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  );
}
