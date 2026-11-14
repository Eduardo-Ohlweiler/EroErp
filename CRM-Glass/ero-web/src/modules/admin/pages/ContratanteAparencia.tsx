import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AvisoContexto,
  EditorAparencia,
  TButton,
  TCombo,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  useMessage,
  useQuestion,
} from '../../../design-system/kit';
import { usePreviaDaTela } from '../../../motion/cena';
import { ROTULO_ADMINISTRATIVO } from '../../../shared/sessao';
import { tenantsApi } from '../api/tenants';
import { aparenciaDoEditor, configuracaoDe, configuracaoMudou, type ConfiguracaoContratante } from '../schemas/aparencia';

/*
 * Aparência do contratante (não é cadastro: docs/07 §3.5). Editor de aparência com prévia ao vivo na interface
 * inteira; a prévia sai na ordem do motion (a tela desmonta, a prévia é limpa, a troca de tema roda, a próxima
 * tela monta), pelo `usePreviaDaTela`.
 */

export function ContratanteAparencia() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const ficha = `/admin/contratantes/${id}`;

  const salvo = useQuery({ queryKey: ['tenants', id], queryFn: () => tenantsApi.buscar(id), enabled: !!id });
  const fundos = useQuery({ queryKey: ['tenants', id, 'fundos'], queryFn: () => tenantsApi.fundos(id), enabled: !!id });

  const inicial = useMemo(() => (salvo.data ? configuracaoDe(salvo.data) : null), [salvo.data]);
  const [valor, setValor] = useState<ConfiguracaoContratante | null>(null);
  const [salvando, setSalvando] = useState(false);

  // O editor nasce com o que está gravado e não é sobrescrito por uma releitura em segundo plano (perderia o que
  // a pessoa escolheu); só o Recarregar do 409 o devolve ao gravado.
  useEffect(() => {
    if (inicial) setValor((v) => v ?? inicial);
  }, [inicial]);

  // A interface inteira mostra a aparência em edição enquanto a tela está aberta.
  usePreviaDaTela(valor?.aparencia);

  useEffect(() => {
    const erro = salvo.error ?? fundos.error;
    if (!erro) return;
    msg.erroApi(erro);
    navigate('/admin/contratantes', { replace: true });
  }, [salvo.error, fundos.error, msg, navigate]);

  const mudou = configuracaoMudou(valor, inicial);
  const exclusivas = (fundos.data ?? []).filter((f) => f.exclusiva);
  const nome = salvo.data?.nome ?? '';

  const salvar = async () => {
    if (!valor || !salvo.data) return;
    setSalvando(true);
    try {
      await tenantsApi.configurar(id, {
        aparencia: valor.aparencia,
        fundoExclusivo: valor.fundoExclusivo || null,
        version: salvo.data.version,
      });
      msg.sucesso('Aparência salva');
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate(ficha);
    } catch (e) {
      // 409: o Recarregar relê o contratante e o editor volta ao que está gravado.
      msg.erroApi(e, undefined, {
        recarregar: async () => {
          const r = await salvo.refetch();
          if (r.data) setValor(configuracaoDe(r.data));
        },
      });
    } finally {
      setSalvando(false);
    }
  };

  const voltar = async () => {
    if (mudou && !(await confirmar({ titulo: 'Descartar as mudanças?', mensagem: 'A aparência volta ao que está salvo.', confirmar: 'Descartar', variante: 'excluir' }))) return;
    navigate(ficha);
  };

  return (
    <TPage
      title={nome ? `Aparência de ${nome}` : 'Aparência'}
      breadcrumb={[ROTULO_ADMINISTRATIVO, 'Contratantes', nome || 'Contratante', 'Aparência']}
      coreografia="formulario"
      carregando={salvo.isLoading || fundos.isLoading || !valor}
    >
      {valor && (
        <>
          <AvisoContexto tipo="previa">Prévia de {nome}: a interface inteira mostra como vai ficar</AvisoContexto>
          <EditorAparencia
            valor={valor.aparencia}
            onChange={(editada) => setValor({ ...valor, aparencia: aparenciaDoEditor(editada, valor.aparencia) })}
            fundos={fundos.data ?? []}
            desabilitado={salvando}
            extra={
              exclusivas.length > 0 && (
                <TCombo
                  label="Cena exclusiva"
                  opcoes={exclusivas.map((f) => ({ valor: f.codigo, rotulo: f.rotulo }))}
                  vazio="Nenhuma"
                  value={valor.fundoExclusivo}
                  onChange={(fundoExclusivo) => setValor({ ...valor, fundoExclusivo })}
                  disabled={salvando}
                  ajuda="Cena feita só para este contratante"
                />
              )
            }
          />
          {/* Sem <form> nesta tela: o Salvar age pelo clique (um type="submit" aqui não enviaria nada). */}
          <TFormFooter>
            <TFormActionsLeft>
              <TButton variant="salvar" loading={salvando} onClick={() => void salvar()} />
              <TButton variant="voltar" onClick={() => void voltar()} />
            </TFormActionsLeft>
          </TFormFooter>
        </>
      )}
    </TPage>
  );
}
