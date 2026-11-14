import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { LockKeyholeOpen } from 'lucide-react';
import {
  DocumentoLista,
  TAcoesDeExportacao,
  TBadge,
  TButton,
  TCombo,
  TDataGrid,
  TDataGridFooter,
  TEntry,
  TForm,
  TFormActionsLeft,
  TFormFooter,
  TPage,
  TRow,
  useMessage,
  useQuestion,
  useSomenteLeitura,
  type Coluna,
  type ColunaExportavel,
  type PaginaDaCarga,
  type ResultadoDaCarga,
} from '../../../design-system/kit';
import { api } from '../../../shared/api/cliente';
import { ehAdministrador, ROTULO_ADMINISTRATIVO, rotuloDoPapel, useUsuarioAtual } from '../../../shared/sessao';
import { formatarDataHora, rotuloDe } from '../../../shared/util/format';
import { formatarTelefone } from '../../../shared/util/telefone';
import { usuariosApi, type UsuarioResponse } from '../api/usuarios';
import {
  estaBloqueado,
  FILTROS_VAZIOS,
  PAPEL_OPCOES,
  paraConsulta,
  SITUACAO_USUARIO_OPCOES,
  situacaoDoUsuario,
  type FiltrosUsuario,
} from '../schemas/usuario';

/** Cópia do modelo List (docs/07 §4.1), a partir do ContratanteList. Difere dele só no que é `// troca`. */

const LISTA = '/admin/usuarios'; // troca
const ORDEM = 'nome,asc'; // troca
const POR_PAGINA = 20;

export function UsuarioList() {
  // troca
  const navigate = useNavigate();
  const somenteLeitura = useSomenteLeitura('USUARIOS'); // troca: grupo USUARIOS
  const msg = useMessage();
  const { confirmar } = useQuestion();
  const queryClient = useQueryClient();
  const form = useForm<FiltrosUsuario>({ defaultValues: FILTROS_VAZIOS });
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(0);
  const [paraImprimir, setParaImprimir] = useState<ResultadoDaCarga<UsuarioResponse>>();
  // troca: quem sou eu decide as ações de cada linha (conforto: quem barra é a API)
  const eu = useUsuarioAtual();
  const souAdministrador = ehAdministrador(eu);
  const agora = api.agoraServidor();

  const lista = useQuery({
    queryKey: ['usuarios', 'lista', aplicados, pagina], // troca
    queryFn: () => usuariosApi.listar({ ...paraConsulta(aplicados), page: pagina, size: POR_PAGINA, sort: ORDEM }), // troca
    placeholderData: keepPreviousData,
  });

  const filtrar = (f: FiltrosUsuario) => {
    setAplicados(f);
    setPagina(0);
  };
  const limpar = () => {
    form.reset(FILTROS_VAZIOS);
    filtrar(FILTROS_VAZIOS);
  };

  // troca
  const alternar = async (u: UsuarioResponse) => {
    const ok = await confirmar({
      titulo: u.ativo ? 'Inativar usuário?' : 'Reativar usuário?',
      mensagem: u.ativo
        ? `Inativar ${u.nome}? Ele não consegue mais entrar e as sessões abertas caem.`
        : `Reativar ${u.nome}? Ele volta a conseguir entrar.`,
      variante: u.ativo ? 'inativar' : 'reativar',
    });
    if (!ok) return;
    try {
      await (u.ativo ? usuariosApi.inativar(u.id) : usuariosApi.ativar(u.id));
      msg.sucesso(u.ativo ? `${u.nome} foi inativado` : `${u.nome} foi reativado`);
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    } catch (e) {
      msg.erroApi(e); // 422: último administrador ativo; limite de usuários ao reativar
    }
  };

  // troca
  const desbloquear = async (u: UsuarioResponse) => {
    try {
      await usuariosApi.desbloquear(u.id);
      msg.sucesso(`${u.nome} foi desbloqueado`);
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    } catch (e) {
      msg.erroApi(e);
    }
  };

  // A exportação repete os filtros aplicados, página a página.
  const carregarTudo = useCallback(
    async (limite: number, indice: number): Promise<PaginaDaCarga<UsuarioResponse>> => {
      const p = await usuariosApi.listar({ ...paraConsulta(aplicados), page: indice, size: limite, sort: ORDEM }); // troca
      return { linhas: p.conteudo, total: p.totalElementos };
    },
    [aplicados],
  );

  // troca
  const colunasExportadas: ColunaExportavel<UsuarioResponse>[] = [
    { titulo: 'Nome', valor: (u) => u.nome },
    { titulo: 'E-mail', quebra: 'email', valor: (u) => u.email },
    { titulo: 'Telefone', semQuebra: true, valor: (u) => formatarTelefone(u.telefone) },
    { titulo: 'Papel', valor: (u) => rotuloDoPapel(u.papel) },
    { titulo: 'Último acesso', semQuebra: true, valor: (u) => formatarDataHora(u.ultimoLoginEm) },
    { titulo: 'Situação', valor: (u) => situacaoDoUsuario(u, agora).texto },
  ];

  // troca
  const colunas: Coluna<UsuarioResponse>[] = [
    { chave: 'nome', cabecalho: 'Nome', principal: true, render: (u) => <span className="font-medium">{u.nome}</span> },
    { chave: 'email', cabecalho: 'E-mail', secundaria: true, render: (u) => <span className="text-muted">{u.email}</span> },
    {
      chave: 'telefone',
      cabecalho: 'Telefone',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (u) => formatarTelefone(u.telefone),
    },
    { chave: 'papel', cabecalho: 'Papel', className: 'w-px whitespace-nowrap', render: (u) => rotuloDoPapel(u.papel) },
    {
      chave: 'ultimo',
      cabecalho: 'Último acesso',
      secundaria: true,
      className: 'w-px whitespace-nowrap tabular-nums',
      render: (u) => formatarDataHora(u.ultimoLoginEm),
    },
    {
      chave: 'situacao',
      cabecalho: 'Situação',
      className: 'w-px whitespace-nowrap',
      render: (u) => {
        const s = situacaoDoUsuario(u, agora);
        return (
          <TBadge tom={s.tom} ponto>
            {s.texto}
          </TBadge>
        );
      },
    },
  ];

  // troca: inativar nunca na própria linha, nem para usuário comum numa linha de administrador; desbloquear só
  // administrador, em outra pessoa bloqueada.
  const podeAlternar = (u: UsuarioResponse) => u.id !== eu.id && (souAdministrador || u.papel !== 'ADMIN');
  const podeDesbloquear = (u: UsuarioResponse) => souAdministrador && u.id !== eu.id && estaBloqueado(u, agora);

  return (
    <TPage
      title="Usuários" // troca
      breadcrumb={[ROTULO_ADMINISTRATIVO, 'Usuários']} // troca
      documento={
        paraImprimir && (
          <DocumentoLista
            titulo="Usuários" // troca
            colunas={colunasExportadas}
            linhas={paraImprimir.linhas}
            truncado={paraImprimir.restantes}
            chaveDe={(u) => u.id}
            filtros={[
              // troca
              { rotulo: 'Nome ou e-mail', valor: aplicados.busca.trim() },
              { rotulo: 'Papel', valor: rotuloDe(PAPEL_OPCOES, aplicados.papel) ?? '' },
              { rotulo: 'Situação', valor: rotuloDe(SITUACAO_USUARIO_OPCOES, aplicados.situacao) ?? '' },
            ]}
          />
        )
      }
    >
      <TForm form={form} onSubmit={filtrar}>
        {/* troca */}
        <TRow>
          <TEntry name="busca" label="Nome ou e-mail" placeholder="Nome ou e-mail" maxLength={100} />
        </TRow>
        <TRow>
          <TCombo name="papel" label="Papel" opcoes={PAPEL_OPCOES} vazio="Todos" />
        </TRow>
        <TRow>
          <TCombo name="situacao" label="Situação" opcoes={SITUACAO_USUARIO_OPCOES} vazio="Todas" />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate(`${LISTA}/novo`)} />}
            <TAcoesDeExportacao
              nome="Usuários" // troca
              colunas={colunasExportadas}
              carregar={carregarTudo}
              aoCarregarParaImprimir={setParaImprimir}
            />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        rotulo="Usuários" // troca
        colunas={colunas}
        linhas={lista.data?.conteudo ?? []}
        chaveDe={(u) => u.id}
        carregando={lista.isFetching}
        erro={lista.error}
        onTentarDeNovo={() => void lista.refetch()}
        onLinhaClick={(u) => navigate(`${LISTA}/${u.id}`)}
        tituloCartao={(u) => u.nome}
        acoes={
          somenteLeitura
            ? undefined
            : (u) => (
                <>
                  <TButton
                    variant="editar"
                    label=""
                    aria-label={`Editar ${u.nome}`}
                    title={`Editar ${u.nome}`}
                    onClick={() => navigate(`${LISTA}/${u.id}`)}
                  />
                  {podeAlternar(u) && (
                    <TButton
                      variant={u.ativo ? 'inativar' : 'reativar'}
                      label=""
                      aria-label={`${u.ativo ? 'Inativar' : 'Reativar'} ${u.nome}`}
                      title={`${u.ativo ? 'Inativar' : 'Reativar'} ${u.nome}`}
                      onClick={() => void alternar(u)}
                    />
                  )}
                  {podeDesbloquear(u) && (
                    // troca
                    <TButton
                      variant="secondary"
                      icone={LockKeyholeOpen}
                      label=""
                      aria-label={`Desbloquear ${u.nome}`}
                      title={`Desbloquear ${u.nome}`}
                      onClick={() => void desbloquear(u)}
                    />
                  )}
                </>
              )
        }
        vazioTitulo="Nenhum usuário encontrado" // troca
        vazioDescricao="Ajuste os filtros ou cadastre o primeiro."
      />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} carregando={lista.isFetching} />
    </TPage>
  );
}
