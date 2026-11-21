import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { TButton, TEntry, TForm, TFormActionsLeft, TFormFooter, TModal, TRow, useMessage } from '../../../design-system/kit';
import type { TipoAuxiliarResponse } from '../../../shared/api/auxiliares';
import { categoriasServicoApi } from '../../auxiliares/api/categoriasServico';
import { NOME_MAXIMO, paraCorpo, schema, VAZIO, type Dados } from '../../auxiliares/schemas/categoriaServico';

/** Cópia do PessoaRapidaModal (docs/07 §6), com o nome como único campo. Fica fora do `TForm` da tela: os dois formulários não se misturam. */

type Props = {
  aberto: boolean;
  onFechar: () => void;
  /** a categoria já gravada: quem abriu a seleciona no combo */
  onCriada: (categoria: TipoAuxiliarResponse) => void;
};

export function CategoriaRapidaModal({ aberto, onFechar, onCriada }: Props) {
  const msg = useMessage();
  const queryClient = useQueryClient();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO });

  // Cada vez que abre, o formulário recomeça.
  useEffect(() => {
    if (aberto) form.reset(VAZIO);
  }, [aberto, form]);

  const salvar = async (d: Dados) => {
    try {
      const nova = await categoriasServicoApi.criar(paraCorpo(d));
      msg.sucesso('Categoria cadastrada');
      await queryClient.invalidateQueries({ queryKey: ['categorias-servico'] });
      onCriada(nova);
    } catch (e) {
      msg.erroApi(e, form); // 400 e 409 de nome repetido → o campo Nome do modal
    }
  };

  return (
    <TModal
      aberto={aberto}
      titulo="Nova categoria"
      descricao="Cadastro rápido. O código e a situação se acertam depois, em Categorias de serviço."
      largura="sm"
      onFechar={onFechar}
      bloquearFechar={form.formState.isSubmitting}
    >
      <TForm form={form} onSubmit={salvar}>
        <TRow>
          <TEntry name="nome" label="Nome" required maxLength={NOME_MAXIMO} />
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
