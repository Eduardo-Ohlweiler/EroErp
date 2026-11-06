package com.api.ero_api.auth.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.auth.dtos.AutenticacaoRespostaDto;
import com.api.ero_api.auth.dtos.DoisFatoresVerificarDto;
import com.api.ero_api.auth.dtos.LoginDto;
import com.api.ero_api.auth.dtos.TrocarSenhaDto;
import com.api.ero_api.auth.dtos.UsuarioLogadoDto;
import com.api.ero_api.auth.mapper.AuthMapper;
import com.api.ero_api.compartilhado.exception.AutenticacaoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.util.LogSeguro;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoService;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import com.api.ero_api.seguranca.jwt.JwtService;
import com.api.ero_api.seguranca.jwt.JwtService.TokenEmitido;
import com.api.ero_api.seguranca.senha.SenhaService;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.sessao.enums.MotivoRevogacao;
import com.api.ero_api.sessao.service.SessaoService;
import com.api.ero_api.sessao.service.SessaoService.ResultadoRenovacao;
import com.api.ero_api.sessao.service.SessaoService.SessaoCriada;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.service.TenantService;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
import com.api.ero_api.usuario.service.UsuarioService;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Login, 2FA no login, renovação, logout, troca da própria senha e o
 * "acessar contratante" do superadmin.
 *
 * <p>Por que não usa {@code @Transactional}: estes fluxos começam SEM tenant
 * conhecido. O contexto ROOT precisa ser ligado ANTES da transação abrir (o
 * Hibernate lê o tenant ao abrir a sessão), então usamos TransactionTemplate
 * dentro de {@link TenantContext#comoRoot}. Falhas são devolvidas como resultado
 * (não exceção) para que o contador de tentativas seja gravado.
 *
 * <p>Contra força bruta em paralelo, a linha do usuário é travada
 * (SELECT ... FOR UPDATE) enquanto a senha/código é conferido.
 */
@Service
public class AuthService {

    private static final String MSG_LOGIN = "E-mail ou senha inválidos.";
    private static final String MSG_SESSAO = "Sessão inválida ou expirada. Faça login de novo.";

    private final UsuarioService usuarioService;
    private final TenantService tenantService;
    private final SessaoService sessaoService;
    private final AutorizacaoService autorizacaoService;
    private final DoisFatoresService doisFatoresService;
    private final SenhaService senhaService;
    private final JwtService jwtService;
    private final EventoSegurancaService eventos;
    private final SegurancaProperties props;
    private final TransactionTemplate tx;
    private final String hashFalso;

    public AuthService(UsuarioService usuarioService, TenantService tenantService, SessaoService sessaoService,
                       AutorizacaoService autorizacaoService, DoisFatoresService doisFatoresService,
                       SenhaService senhaService, JwtService jwtService, EventoSegurancaService eventos,
                       SegurancaProperties props, PlatformTransactionManager transactionManager) {
        this.usuarioService = usuarioService;
        this.tenantService = tenantService;
        this.sessaoService = sessaoService;
        this.autorizacaoService = autorizacaoService;
        this.doisFatoresService = doisFatoresService;
        this.senhaService = senhaService;
        this.jwtService = jwtService;
        this.eventos = eventos;
        this.props = props;
        this.tx = new TransactionTemplate(transactionManager);
        // Usado quando o e-mail não existe: gasta o mesmo tempo de uma senha errada.
        this.hashFalso = senhaService.gerarHash(UUID.randomUUID().toString());
    }

    /** Resposta + refresh token para o controller colocar no cookie (null quando é só o desafio 2FA). */
    public record Resultado(AutenticacaoRespostaDto resposta, String refreshToken, Instant refreshExpiraEm) {
    }

    private sealed interface Verificacao {
        record Ok(UUID usuarioId, boolean doisFatores) implements Verificacao {
        }

        record Falha(UUID usuarioId, UUID tenantId, boolean bloqueou) implements Verificacao {
        }
    }

    private record Aberta(SessaoCriada sessao, UUID tenantId) {
    }

    // ---------------------------------------------------------------- login

    public Resultado login(LoginDto dto) {
        Instant agora = Instant.now();
        Verificacao v = rootContandoFalha(() -> verificarSenha(dto.email(), dto.senha(), agora));
        if (v instanceof Verificacao.Falha f) {
            registrarFalha(TipoEventoSeguranca.LOGIN_FALHA, f, "email=" + LogSeguro.email(dto.email()));
            throw new AutenticacaoException(MSG_LOGIN);
        }
        Verificacao.Ok ok = (Verificacao.Ok) v;
        if (ok.doisFatores()) {
            String desafio = jwtService.emitirDesafio2fa(ok.usuarioId()).token();
            return new Resultado(AutenticacaoRespostaDto.desafio(desafio), null, null);
        }
        return abrirSessao(ok.usuarioId());
    }

    public Resultado verificarDoisFatores(DoisFatoresVerificarDto dto) {
        UUID usuarioId;
        try {
            usuarioId = UUID.fromString(jwtService.validarDesafio(dto.desafio()).getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            throw new AutenticacaoException("O tempo para digitar o código acabou. Faça login de novo.");
        }
        Instant agora = Instant.now();
        Verificacao v = rootContandoFalha(() -> {
            Optional<Usuario> encontrado = usuarioService.buscarComBloqueio(usuarioId);
            if (encontrado.isEmpty()) {
                return new Verificacao.Falha(usuarioId, null, false);
            }
            Usuario u = encontrado.get();
            if (u.bloqueadoEm(agora) || !u.isAtivo() || !u.isTotpAtivo()) {
                return new Verificacao.Falha(u.getId(), u.getTenantId(), false);
            }
            if (!doisFatoresService.validarCodigoLogin(u, dto.codigo(), agora)) {
                return registrarErro(u, agora);
            }
            return new Verificacao.Ok(u.getId(), true);
        });
        if (v instanceof Verificacao.Falha f) {
            registrarFalha(TipoEventoSeguranca.DOIS_FATORES_FALHA, f, null);
            throw new AutenticacaoException("Código inválido.");
        }
        return abrirSessao(usuarioId);
    }

    // ---------------------------------------------------------------- sessão

    public Resultado renovar(String refreshToken) {
        ResultadoRenovacao r;
        try {
            r = TenantContext.comoRoot(() -> sessaoService.renovar(refreshToken));
        } catch (OptimisticLockingFailureException e) {
            // Duas abas renovando o mesmo cookie no mesmo instante: a outra já renovou.
            throw new AutenticacaoException(MSG_SESSAO);
        }
        return switch (r) {
            case ResultadoRenovacao.Renovada ok -> {
                UUID tenantId = ok.sessao().tenantEfetivo();
                AutenticacaoRespostaDto resposta = emitirParaSessao(ok.sessao().getUsuarioId(), ok.sessao().getId(), tenantId);
                yield new Resultado(resposta, ok.refreshToken(), ok.expiraEm());
            }
            case ResultadoRenovacao.Reutilizada x -> {
                eventos.registrarIndependente(TipoEventoSeguranca.REFRESH_REUTILIZADO, x.usuarioId(), x.tenantId(),
                        "sessão encerrada por reutilização de refresh token");
                throw new AutenticacaoException(MSG_SESSAO);
            }
            case ResultadoRenovacao.Invalida i -> throw new AutenticacaoException(MSG_SESSAO);
        };
    }

    public void logout(String refreshToken) {
        root(() -> {
            sessaoService.revogarPorRefresh(refreshToken, MotivoRevogacao.LOGOUT)
                    .ifPresent(s -> eventos.registrar(TipoEventoSeguranca.LOGOUT, s.getUsuarioId(), s.getTenantId(), null));
            return null;
        });
    }

    public UsuarioLogadoDto eu() {
        return usuarioLogado(SecurityUtils.exigirUsuario());
    }

    private enum ResultadoTroca { OK, SENHA_ERRADA, BLOQUEOU, BLOQUEADA }

    private record Troca(ResultadoTroca resultado, UUID tenantDoUsuario) {
    }

    /**
     * Troca a própria senha. Respeita o bloqueio de conta: com uma sessão roubada
     * não dá para ficar chutando a senha atual (OWASP A07).
     */
    public void trocarSenha(TrocarSenhaDto dto) {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        Instant agora = Instant.now();
        Troca troca = root(() -> {
            Usuario u = usuarioService.buscarComBloqueio(eu.usuarioId())
                    .orElseThrow(() -> new AutenticacaoException(MSG_SESSAO));
            if (u.bloqueadoEm(agora)) {
                return new Troca(ResultadoTroca.BLOQUEADA, u.getTenantId());
            }
            if (!senhaService.confere(dto.senhaAtual(), u.getSenhaHash())) {
                boolean bloqueou = registrarErro(u, agora).bloqueou();
                return new Troca(bloqueou ? ResultadoTroca.BLOQUEOU : ResultadoTroca.SENHA_ERRADA, u.getTenantId());
            }
            senhaService.validarPolitica(dto.novaSenha(), u.getEmail(), u.getNome());
            if (senhaService.confere(dto.novaSenha(), u.getSenhaHash())) {
                throw new RegraNegocioException("A nova senha precisa ser diferente da atual.");
            }
            u.setSenhaHash(senhaService.gerarHash(dto.novaSenha()));
            u.setSenhaAlteradaEm(agora);
            u.setExigirTrocaSenha(false);
            usuarioService.atualizarTentativas(u.getId(), 0, null);
            sessaoService.revogarTodasDoUsuario(u.getId(), MotivoRevogacao.TROCA_SENHA, eu.sessaoId());
            eventos.registrar(TipoEventoSeguranca.SENHA_ALTERADA, u.getId(), u.getTenantId(), null);
            return new Troca(ResultadoTroca.OK, u.getTenantId());
        });
        switch (troca.resultado()) {
            case OK -> { }
            case SENHA_ERRADA -> throw new RegraNegocioException("Senha atual incorreta.");
            case BLOQUEOU -> {
                eventos.registrarIndependente(TipoEventoSeguranca.CONTA_BLOQUEADA, eu.usuarioId(), troca.tenantDoUsuario(),
                        "erros na senha atual (troca de senha)");
                throw new RegraNegocioException("Conta bloqueada temporariamente por excesso de tentativas.");
            }
            case BLOQUEADA -> throw new RegraNegocioException("Conta bloqueada temporariamente por excesso de tentativas.");
        }
    }

    // ---------------------------------------------------------------- superadmin

    /** Superadmin passa a atuar dentro de um contratante. Fica registrado na auditoria. */
    public AutenticacaoRespostaDto acessarTenant(UUID tenantId) {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        tx.executeWithoutResult(s -> {
            Tenant t = tenantService.buscarContratante(tenantId);
            sessaoService.definirTenantAtuacao(eu.sessaoId(), t.getId());
            eventos.registrar(TipoEventoSeguranca.SUPERADMIN_ACESSOU_TENANT, eu.usuarioId(), t.getId(), t.getNome());
        });
        return emitirParaSessao(eu.usuarioId(), eu.sessaoId(), tenantId);
    }

    public AutenticacaoRespostaDto sairDoTenant() {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        tx.executeWithoutResult(s -> {
            sessaoService.definirTenantAtuacao(eu.sessaoId(), null);
            eventos.registrar(TipoEventoSeguranca.SUPERADMIN_SAIU_TENANT, eu.usuarioId(), eu.tenantId(), null);
        });
        return emitirParaSessao(eu.usuarioId(), eu.sessaoId(), TenantContext.ROOT);
    }

    // ---------------------------------------------------------------- interno

    private Verificacao verificarSenha(String email, String senha, Instant agora) {
        Optional<Usuario> encontrado = usuarioService.buscarParaLoginComBloqueio(email);
        if (encontrado.isEmpty()) {
            senhaService.confere(senha, hashFalso);
            return new Verificacao.Falha(null, null, false);
        }
        Usuario u = encontrado.get();
        if (u.bloqueadoEm(agora)) {
            senhaService.confere(senha, hashFalso);
            return new Verificacao.Falha(u.getId(), u.getTenantId(), false);
        }
        if (!senhaService.confere(senha, u.getSenhaHash())) {
            return registrarErro(u, agora);
        }
        if (!u.isAtivo() || !contratanteAtivo(u)) {
            return new Verificacao.Falha(u.getId(), u.getTenantId(), false);
        }
        if (senhaService.precisaAtualizarHash(u.getSenhaHash())) {
            usuarioService.regravarHashSenha(u.getId(), senhaService.gerarHash(senha));
        }
        return new Verificacao.Ok(u.getId(), u.isTotpAtivo());
    }

    /** Conta o erro (linha já travada); ao chegar no limite, bloqueia a conta por um tempo. */
    private Verificacao.Falha registrarErro(Usuario u, Instant agora) {
        int tentativas = u.getTentativasFalhas() + 1;
        if (tentativas >= props.loginMaxTentativas()) {
            usuarioService.atualizarTentativas(u.getId(), 0, agora.plus(props.loginBloqueio()));
            return new Verificacao.Falha(u.getId(), u.getTenantId(), true);
        }
        usuarioService.atualizarTentativas(u.getId(), tentativas, null);
        return new Verificacao.Falha(u.getId(), u.getTenantId(), false);
    }

    private void registrarFalha(TipoEventoSeguranca tipo, Verificacao.Falha f, String detalhe) {
        eventos.registrarIndependente(tipo, f.usuarioId(), f.tenantId(), detalhe);
        if (f.bloqueou()) {
            eventos.registrarIndependente(TipoEventoSeguranca.CONTA_BLOQUEADA, f.usuarioId(), f.tenantId(),
                    "bloqueada por " + props.loginBloqueio().toMinutes() + " min");
        }
    }

    private boolean contratanteAtivo(Usuario u) {
        return u.getPapel() == Papel.SUPERADMIN || tenantService.buscarEntidade(u.getTenantId()).isAtivo();
    }

    private Resultado abrirSessao(UUID usuarioId) {
        Aberta aberta = root(() -> {
            Usuario u = usuarioService.buscarEntidade(usuarioId);
            usuarioService.registrarLogin(u.getId(), Instant.now());
            SessaoCriada s = sessaoService.criar(u.getId(), u.getTenantId());
            eventos.registrar(TipoEventoSeguranca.LOGIN_SUCESSO, u.getId(), u.getTenantId(), null);
            return new Aberta(s, u.getTenantId());
        });
        AutenticacaoRespostaDto resposta = emitirParaSessao(usuarioId, aberta.sessao().sessaoId(), aberta.tenantId());
        return new Resultado(resposta, aberta.sessao().refreshToken(), aberta.sessao().expiraEm());
    }

    private AutenticacaoRespostaDto emitirParaSessao(UUID usuarioId, UUID sessaoId, UUID tenantId) {
        UsuarioAutenticado u;
        try {
            u = autorizacaoService.carregar(usuarioId, sessaoId, tenantId);
        } catch (InvalidBearerTokenException e) {
            throw new AutenticacaoException(MSG_SESSAO);
        }
        TokenEmitido token = jwtService.emitirAcesso(usuarioId, tenantId, sessaoId);
        return AutenticacaoRespostaDto.sessao(token.token(), token.expiraEm(), usuarioLogado(u));
    }

    private UsuarioLogadoDto usuarioLogado(UsuarioAutenticado u) {
        return AuthMapper.toUsuarioLogadoDto(u, tenantService.buscarEntidade(u.tenantId()));
    }

    private <T> T root(Supplier<T> acao) {
        return TenantContext.comoRoot(() -> tx.execute(status -> acao.get()));
    }

    /** Qualquer erro técnico no caminho da senha conta como falha (401), nunca como 409/500 revelador. */
    private Verificacao rootContandoFalha(Supplier<Verificacao> acao) {
        try {
            return root(acao);
        } catch (OptimisticLockingFailureException e) {
            return new Verificacao.Falha(null, null, false);
        }
    }
}
