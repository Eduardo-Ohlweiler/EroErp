import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useController } from 'react-hook-form';
import { Combobox, type OpcaoCombobox } from '../ui/Combobox';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO } from './larguras';
import { useSomenteLeituraDoForm } from './somenteLeitura';

/** O que as rotas `GET /api/<recurso>/selecao` devolvem (`SelectDto`). */
export type OpcaoDoBanco = { id: string; nome: string };

export type TDBComboProps = PropsDeCampo & {
  /**
   * Busca as opções no servidor: `undefined` ao abrir, o termo digitado depois (com espera de 300 ms). As rotas
   * `/selecao` de hoje ignoram o termo e devolvem tudo; o `Combobox` filtra na tela.
   */
  buscar: (termo?: string) => Promise<OpcaoDoBanco[]>;
  /**
   * O nome do valor que já está escolhido, quando quem chama sabe (carga do formulário, filtro restaurado).
   * **Passe sempre que tiver**: sem ele o campo procura o id numa busca sem termo, e o que não vier nela aparece vazio.
   */
  rotuloInicial?: string;
  /** primeira opção, de valor `''` ("Todos", "Nenhum"); sem ela, a escolha não se desfaz (só se troca) */
  vazio?: string;
  /** botão colado ao campo, na altura dele: o cadastro rápido (`<TButton variant="novo" label="" …/>`) */
  acao?: ReactNode;
  /** id escolhido, ou `''` (controlado, fora de `TForm`) */
  value?: string;
  onChange?: (id: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

/** Espera entre a última tecla e a busca no servidor (ms). Não é animação: é o ritmo da consulta. */
export const ESPERA_DA_BUSCA_MS = 300;

/**
 * As opções que o `Combobox` mostra (função pura): o `vazio` primeiro, depois as do servidor; o valor escolhido
 * entra com o nome conhecido quando ainda não veio na lista (carga do formulário, termo que não o traz).
 */
export function opcoesDoCombo(
  lista: OpcaoDoBanco[],
  valor: string,
  conhecido: OpcaoDoBanco | null,
  vazio?: string,
): OpcaoCombobox[] {
  const opcoes: OpcaoCombobox[] = lista.map((o) => ({ valor: o.id, rotulo: o.nome }));
  if (valor && conhecido?.id === valor && !lista.some((o) => o.id === valor)) opcoes.unshift({ valor, rotulo: conhecido.nome });
  return vazio !== undefined ? [{ valor: '', rotulo: vazio }, ...opcoes] : opcoes;
}

/**
 * Combo com as **opções do banco** (docs/07 §3.2): Usuário e Contratante nos filtros dos Logs, responsável no
 * cadastro. Sobre o `Combobox` glass (WAI-ARIA, lista `glass-solid` em portal): busca ao abrir e, a cada termo, depois
 * de `ESPERA_DA_BUSCA_MS`; resposta velha que chega depois da nova é descartada. Grava o `id`; o rótulo do valor
 * salvo vem do `rotuloInicial`. Largura padrão `metade`.
 */
export function TDBCombo(props: TDBComboProps) {
  const ligado = useLigadoAoForm(props.name, props.onChange !== undefined || props.value !== undefined);
  if (ligado) return <TDBComboLigado {...props} name={props.name!} />;
  return <TDBComboBase {...props} />;
}

function TDBComboLigado(props: TDBComboProps & { name: string }) {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <TDBComboBase
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={props.error ?? fieldState.error?.message}
    />
  );
}

function TDBComboBase({
  label,
  buscar,
  rotuloInicial,
  vazio,
  acao,
  value = '',
  onChange,
  width,
  ajuda,
  error,
  rotuloOculto,
  required,
  disabled,
  id,
  placeholder,
}: TDBComboProps) {
  const somenteLeitura = useSomenteLeituraDoForm();
  const [lista, setLista] = useState<OpcaoDoBanco[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  const [conhecido, setConhecido] = useState<OpcaoDoBanco | null>(rotuloInicial && value ? { id: value, nome: rotuloInicial } : null);
  // `buscar` costuma ser recriada a cada render da tela: guardada numa ref, não dispara busca nova sozinha.
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;
  const pedido = useRef(0);

  const carregar = useCallback((t: string) => {
    const n = ++pedido.current;
    setCarregando(true);
    setFalhou(false);
    buscarRef
      .current(t || undefined)
      .then((r) => {
        if (n === pedido.current) setLista(r);
      })
      .catch(() => {
        if (n === pedido.current) setFalhou(true);
      })
      .finally(() => {
        if (n === pedido.current) setCarregando(false);
      });
  }, []);

  // Ao abrir busca já; a cada termo, depois da espera.
  useEffect(() => {
    if (!aberto) return;
    const t = setTimeout(() => carregar(termo), termo ? ESPERA_DA_BUSCA_MS : 0);
    return () => clearTimeout(t);
  }, [aberto, termo, carregar]);

  // O nome do valor que veio de fora (carga do formulário).
  useEffect(() => {
    if (!value || conhecido?.id === value) return;
    const naLista = lista.find((o) => o.id === value);
    if (naLista) return setConhecido(naLista);
    if (rotuloInicial) return setConhecido({ id: value, nome: rotuloInicial });
    // Último recurso: procurar o id numa busca sem termo (é para não depender disto que existe `rotuloInicial`).
    let vivo = true;
    buscarRef
      .current()
      .then((r) => {
        const achado = r.find((o) => o.id === value);
        if (vivo && achado) setConhecido(achado);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [value, lista, rotuloInicial, conhecido]);

  const escolher = (v: string | null) => {
    const id = v ?? '';
    const achado = lista.find((o) => o.id === id);
    if (achado) setConhecido(achado);
    onChange?.(id);
  };

  const combo = (ids: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => (
    <Combobox
      {...ids}
      opcoes={opcoesDoCombo(lista, value, conhecido, vazio)}
      valor={value === '' && vazio === undefined ? null : value}
      onChange={escolher}
      onBuscaChange={setTermo}
      onAbertoChange={(a) => {
        if (a) setTermo('');
        setAberto(a);
      }}
      carregando={carregando}
      textoVazio={falhou ? 'Não foi possível carregar a lista.' : 'Nada encontrado'}
      placeholder={placeholder ?? vazio ?? 'Selecione…'}
      limpavel={vazio === undefined && !required}
      invalido={!!error}
      desabilitado={!!disabled}
      somenteLeitura={somenteLeitura}
    />
  );

  return (
    <CampoDoKit
      kit="TDBCombo"
      padrao={LARGURA_PADRAO.TDBCombo}
      label={label}
      width={width}
      ajuda={ajuda}
      error={error}
      rotuloOculto={rotuloOculto}
      required={required}
      id={id}
      semReserva={somenteLeitura || !!disabled}
    >
      {(ids) =>
        acao ? (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{combo(ids)}</div>
            <div className="shrink-0 flex items-center h-11">{acao}</div>
          </div>
        ) : (
          combo(ids)
        )
      }
    </CampoDoKit>
  );
}
