import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { GlassCard } from '../../../design-system/ui';
import { coreografias, login } from '../../../motion/tokens';
import { Tela, TrocaEtapa } from '../../../motion/coreografia';
import type { UsuarioLogado } from '../../../shared/api/tipos';
import { ehCaminhoInterno, sanitizarVoltar, useSessao } from '../../../shared/sessao';
import type { Aviso, DesafioAtivo, EtapaLogin } from '../components/comum';
import { EtapaCodigo } from '../components/EtapaCodigo';
import { EtapaCredenciais } from '../components/EtapaCredenciais';
import { EtapaTrocarSenha } from '../components/EtapaTrocarSenha';
import { VitrineLogin } from '../components/VitrineLogin';

const AVISO_SESSAO_EXPIRADA: Aviso = { tom: 'aviso', texto: 'Sua sessão expirou. Entre de novo.' };

/**
 * /login: credenciais → código por e-mail → (troca de senha obrigatória) → `?voltar=` ou Início.
 * Sempre com a aparência padrão do sistema; a do contratante entra quando esta tela termina de sair (Raiz).
 *
 * A tela decide o que mostrar só ao montar: depois de entrar, ela continua igual enquanto se desmonta
 * em blocos (a casca monta depois), em vez de reagir à sessão nova.
 */
export function LoginPage() {
  const sessao = useSessao();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  // Sempre um caminho interno: o sanitizador já garante; a 2ª checagem impede tela em branco se ele mudar.
  const lido = sanitizarVoltar(params.get('voltar'));
  const voltar = ehCaminhoInterno(lido) ? lido : '/';
  const [aoAbrir] = useState(() => sessao.estado);

  const [etapa, setEtapa] = useState<EtapaLogin>(aoAbrir.tipo === 'pendente' ? 'trocar-senha' : 'credenciais');
  const [direcao, setDirecao] = useState(1);
  const [email, setEmail] = useState('');
  const [desafio, setDesafio] = useState<DesafioAtivo | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(
    aoAbrir.tipo === 'anonimo' && aoAbrir.motivo === 'expirou' ? AVISO_SESSAO_EXPIRADA : null,
  );
  /** senha das credenciais, só em memória, para a troca obrigatória não pedir de novo */
  const senhaDigitada = useRef<string | null>(null);
  useEffect(
    () => () => {
      senhaDigitada.current = null;
    },
    [],
  );

  const ir = useCallback((proxima: EtapaLogin, d: number) => {
    setDirecao(d);
    setEtapa(proxima);
  }, []);

  const voltarCredenciais = useCallback(
    (a: Aviso | null) => {
      senhaDigitada.current = null;
      setAviso(a);
      ir('credenciais', -1);
    },
    [ir],
  );

  const concluir = useCallback(
    (u: UsuarioLogado) => {
      if (u.pendencia === 'TROCAR_SENHA') {
        ir('trocar-senha', 1);
        return;
      }
      // A senha em memória some quando esta tela desmonta (não antes: ela ainda se desmonta em blocos).
      navegar(voltar, { replace: true });
    },
    [ir, navegar, voltar],
  );

  // A sessão acabou durante a troca de senha (renovação recusada): de volta às credenciais.
  const { estado } = sessao;
  useEffect(() => {
    if (etapa === 'trocar-senha' && estado.tipo === 'anonimo' && estado.motivo === 'expirou') voltarCredenciais(AVISO_SESSAO_EXPIRADA);
  }, [etapa, estado, voltarCredenciais]);

  const sairDaTroca = async () => {
    await sessao.sair();
    voltarCredenciais(null);
  };

  if (aoAbrir.tipo === 'autenticado') return <Navigate to={voltar} replace />;

  const v = coreografias.login.variantes;
  return (
    <Tela coreografia="login" className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] items-center">
      <VitrineLogin />
      <div className="px-3 sm:px-5 py-8 lg:py-0 flex justify-center">
        <GlassCard level="solid" variants={v.cartao} padded={false} className="w-full max-w-[440px] rounded-[30px] p-4 sm:p-8 overflow-hidden">
          <TrocaEtapa etapa={etapa} direcao={direcao} atrasoInicial={login.atrasoCampos}>
            {etapa === 'codigo' && desafio ? (
              <EtapaCodigo
                desafio={desafio}
                atualizarDesafio={(p) => setDesafio((d) => (d ? { ...d, ...p } : d))}
                aoEntrar={concluir}
                aoVoltar={voltarCredenciais}
              />
            ) : etapa === 'trocar-senha' ? (
              <EtapaTrocarSenha senhaAtual={senhaDigitada.current} aoConcluir={concluir} aoSair={sairDaTroca} />
            ) : (
              <EtapaCredenciais
                emailInicial={email}
                avisoInicial={aviso}
                aoEnviarCodigo={(d) => {
                  setEmail(d.email);
                  senhaDigitada.current = d.senha;
                  setDesafio(d.desafio);
                  setAviso(null);
                  ir('codigo', 1);
                }}
              />
            )}
          </TrocaEtapa>
        </GlassCard>
      </div>
    </Tela>
  );
}
