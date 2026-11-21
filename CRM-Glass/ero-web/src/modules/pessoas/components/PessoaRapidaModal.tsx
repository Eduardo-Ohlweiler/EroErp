import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  TButton,
  TCheckBox,
  TDate,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TModal,
  TRadio,
  TRow,
  useMessage,
} from '../../../design-system/kit';
import { tipoPorChave, type TipoSelect } from '../../../shared/api/auxiliares';
import { hojeIso } from '../../../shared/util/format';
import { pessoasApi, type PessoaResponse } from '../api/pessoas';
import { opcoesDosTiposDeCadastro, SEXO_OPCOES, TIPO_PESSOA_OPCOES } from '../schemas/pessoa';
import { paraCorpoRapido, schemaRapido, telefoneDoRapido, vazioRapido, type DadosRapidos } from '../schemas/pessoaRapida';

/** Cópia do modal "Redefinir senha" do UsuarioForm (docs/07 §6). Fica fora do `TForm` da tela: os dois formulários não se misturam. */

type Props = {
  aberto: boolean;
  onFechar: () => void;
  /** a pessoa já gravada: quem abriu a seleciona no combo da linha que pediu */
  onCriada: (pessoa: PessoaResponse) => void;
  /** os ativos dos cadastros auxiliares (`/selecao`), os mesmos que a tela já leu */
  tiposCadastro: readonly TipoSelect[];
  tiposTelefone: readonly TipoSelect[];
};

export function PessoaRapidaModal({ aberto, onFechar, onCriada, tiposCadastro, tiposTelefone }: Props) {
  const msg = useMessage();
  const queryClient = useQueryClient();
  const form = useForm<DadosRapidos>({ resolver: zodResolver(schemaRapido), defaultValues: vazioRapido(tiposCadastro) });

  // Cada vez que abre, o formulário recomeça (física, com Cliente marcado). Os tipos vão por ref: se a lista renovar
  // com o modal aberto, não apaga o que a pessoa já digitou.
  const tiposRef = useRef(tiposCadastro);
  tiposRef.current = tiposCadastro;
  useEffect(() => {
    if (aberto) form.reset(vazioRapido(tiposRef.current));
  }, [aberto, form]);

  const fisica = form.watch('tipoPessoa') === 'FISICA';
  const marcados = form.watch('tiposCadastroIds');
  const opcoesTipoCadastro = opcoesDosTiposDeCadastro(tiposCadastro, [], marcados ?? []);

  const salvar = async (d: DadosRapidos) => {
    const celular = tipoPorChave(tiposTelefone, 'CELULAR');
    if (telefoneDoRapido(d) && !celular) {
      form.setError('telefones.0.numero', { type: 'server', message: 'O tipo de telefone Celular não está disponível.' });
      return;
    }
    try {
      const nova = await pessoasApi.criar(paraCorpoRapido(d, celular?.id));
      msg.sucesso('Pessoa cadastrada');
      await queryClient.invalidateQueries({ queryKey: ['pessoas', 'lista'] });
      onCriada(nova);
    } catch (e) {
      msg.erroApi(e, form); // 400 e 409 com campo → o campo do modal
    }
  };

  return (
    <TModal
      aberto={aberto}
      titulo="Cadastro rápido de pessoa"
      descricao="O básico para vincular agora. O resto se completa depois, na ficha da pessoa."
      largura="md"
      onFechar={onFechar}
      bloquearFechar={form.formState.isSubmitting}
    >
      <TForm form={form} onSubmit={salvar}>
        <TRow>
          <TRadio name="tipoPessoa" label="Tipo de pessoa" opcoes={TIPO_PESSOA_OPCOES} required />
        </TRow>
        <TRow>
          <TEntry name="nome" label={fisica ? 'Nome' : 'Razão social'} required maxLength={255} />
        </TRow>
        {fisica ? (
          <>
            <TRow>
              <TEntry name="cpf" label="CPF" mascara="cpf" />
            </TRow>
            <TRow>
              <TDate name="dataNascimento" label="Data de nascimento" max={hojeIso()} />
            </TRow>
            <TRow>
              <TRadio name="sexo" label="Sexo" opcoes={SEXO_OPCOES} vazio="Não informado" />
            </TRow>
          </>
        ) : (
          <TRow>
            <TEntry name="cnpj" label="CNPJ" mascara="cnpj" />
          </TRow>
        )}
        <TRow>
          <TCheckBox name="tiposCadastroIds" label="Tipos de cadastro" opcoes={opcoesTipoCadastro} required />
        </TRow>
        <TRow>
          <TEntry name="telefones.0.numero" label="Telefone" mascara="telefone" ajuda="Opcional. Entra como celular principal." />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="voltar" label="Cancelar" onClick={onFechar} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TModal>
  );
}
