import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useController } from 'react-hook-form';
import { Combobox, type OpcaoCombobox } from '../ui/Combobox';
import { CampoDoKit, useLigadoAoForm, type PropsDeCampo } from './campo';
import { LARGURA_PADRAO, larguraEstreita } from './larguras';
import { useSomenteLeituraDoForm } from './somenteLeitura';
import { TCorMarca } from './TCorMarca';

/**
 * O que as rotas `GET /api/<recurso>/selecao` devolvem (`SelectDto`). `cor` (`#RRGGBB`, a cor de registro da filial):
 * com ela, a bolinha (`TCorMarca sm`) vai antes do nome na lista e no campo; cor fora do formato sai neutra; sem
 * `cor` (`undefined` ou `null`), nada muda.
 */
export type OpcaoDoBanco = { id: string; nome: string; cor?: string | null };

/** Uma opção do combo antes de virar `OpcaoCombobox`: a cor ainda é dado (a marca é desenhada pelo `TDBCombo`). */
export type OpcaoDoCombo = { valor: string; rotulo: string; cor?: string };

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
  /**
   * A cor do valor que já está escolhido (com o `rotuloInicial`), quando as opções têm `cor`: a bolinha aparece no
   * campo fechado desde a carga, antes de a lista ser buscada.
   */
  corInicial?: string | null;
  /** primeira opção, de valor `''` ("Todos", "Nenhum"); sem ela, a escolha não se desfaz (só se troca) */
  vazio?: string;
  /** botão colado ao campo, na altura dele: o cadastro rápido (`<TButton variant="novo" label="" …/>`) */
  acao?: ReactNode;
  /** id escolhido, ou `''` (controlado, fora de `TForm`) */
  value?: string;
  onChange?: (id: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** foca o campo ao montar, sem abrir a lista: o primeiro campo do formulário (`autoFocus={!somenteLeitura}`) */
  autoFocus?: boolean;
};

/** Espera entre a última tecla e a busca no servidor (ms). Não é animação: é o ritmo da consulta. */
export const ESPERA_DA_BUSCA_MS = 300;

/**
 * As opções que o `Combobox` mostra (função pura): o `vazio` primeiro, depois as do servidor; o valor escolhido
 * entra com o nome conhecido quando ainda não veio na lista (carga do formulário, termo que não o traz). A `cor` da
 * opção do banco vai junto (só quando veio: `null`/`undefined` não viram cor); o `vazio` nunca tem cor.
 */
export function opcoesDoCombo(
  lista: OpcaoDoBanco[],
  valor: string,
  conhecido: OpcaoDoBanco | null,
  vazio?: string,
): OpcaoDoCombo[] {
  const opcao = (o: OpcaoDoBanco): OpcaoDoCombo => (o.cor == null ? { valor: o.id, rotulo: o.nome } : { valor: o.id, rotulo: o.nome, cor: o.cor });
  const opcoes = lista.map(opcao);
  if (valor && conhecido?.id === valor && !lista.some((o) => o.id === valor)) opcoes.unshift(opcao(conhecido));
  return vazio !== undefined ? [{ valor: '', rotulo: vazio }, ...opcoes] : opcoes;
}

/**
 * A opção do `Combobox`: com `cor`, a marca é a `TCorMarca sm` `aria-hidden` (o nome ao lado é o que se lê; a cor
 * nunca é a única informação). O `TCorMarca` confere o formato: cor inválida sai neutra, nada vai para o CSS.
 */
export function paraOpcaoDoCombobox({ cor, ...o }: OpcaoDoCombo): OpcaoCombobox {
  return cor === undefined ? o : { ...o, marca: <TCorMarca cor={cor} tamanho="sm" /> };
}

/**
 * Combo com as **opções do banco** (docs/07 §3.2): Usuário e Contratante nos filtros dos Logs, responsável no
 * cadastro. Sobre o `Combobox` glass (WAI-ARIA, lista `glass-flutuante` em portal): busca ao abrir e, a cada termo, depois
 * de `ESPERA_DA_BUSCA_MS`; resposta velha que chega depois da nova é descartada. Grava o `id`; o rótulo do valor
 * salvo vem do `rotuloInicial`. Opção com `cor` (a filial) ganha a bolinha `TCorMarca sm` antes do nome, na lista e no
 * campo (a do valor salvo vem do `corInicial`). Largura padrão `metade`.
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
  corInicial,
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
  autoFocus,
}: TDBComboProps) {
  const somenteLeitura = useSomenteLeituraDoForm();
  const [lista, setLista] = useState<OpcaoDoBanco[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  const [conhecido, setConhecido] = useState<OpcaoDoBanco | null>(rotuloInicial && value ? { id: value, nome: rotuloInicial, cor: corInicial } : null);
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
    if (rotuloInicial) return setConhecido({ id: value, nome: rotuloInicial, cor: corInicial });
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
  }, [value, lista, rotuloInicial, corInicial, conhecido]);

  const escolher = (v: string | null) => {
    const id = v ?? '';
    const achado = lista.find((o) => o.id === id);
    if (achado) setConhecido(achado);
    onChange?.(id);
  };

  const combo = (ids: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => (
    <Combobox
      {...ids}
      opcoes={opcoesDoCombo(lista, value, conhecido, vazio).map(paraOpcaoDoCombobox)}
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
      limpavel={vazio === undefined && !required && !larguraEstreita(width)}
      invalido={!!error}
      desabilitado={!!disabled}
      somenteLeitura={somenteLeitura}
      autoFocus={autoFocus}
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
