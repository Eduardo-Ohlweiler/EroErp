package com.api.ero_api.sessao.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.util.HashUtils;
import com.api.ero_api.compartilhado.web.ClienteRequisicao;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoCache;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import com.api.ero_api.sessao.dtos.SessaoResponseDto;
import com.api.ero_api.sessao.entity.RefreshToken;
import com.api.ero_api.sessao.entity.SessaoUsuario;
import com.api.ero_api.sessao.enums.MotivoRevogacao;
import com.api.ero_api.sessao.mapper.SessaoMapper;
import com.api.ero_api.sessao.repository.RefreshTokenRepository;
import com.api.ero_api.sessao.repository.SessaoUsuarioRepository;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sessões e refresh tokens (OWASP A07).
 *
 * <ul>
 *   <li>Refresh token: 32 bytes aleatórios; no banco só o SHA-256.</li>
 *   <li>Cada refresh gira o token. Token já usado que volta = roubo: a sessão cai.</li>
 *   <li>Exceção: reuso dentro de {@code app.seguranca.refresh-tolerancia} (10 s) é tratado como
 *       corrida entre abas do mesmo navegador (só recusa, sem derrubar).</li>
 * </ul>
 *
 * <p>Os métodos devolvem resultado em vez de lançar exceção, para quem chama
 * decidir a resposta sem desfazer a revogação gravada.
 */
@Service
public class SessaoService {

    private final SessaoUsuarioRepository sessaoRepository;
    private final RefreshTokenRepository refreshRepository;
    private final AutorizacaoCache cache;
    private final EventoSegurancaService eventos;
    private final Duration duracaoSessao;
    private final Duration tolerancia;
    private final SecureRandom random = new SecureRandom();

    public SessaoService(SessaoUsuarioRepository sessaoRepository, RefreshTokenRepository refreshRepository,
                         AutorizacaoCache cache, EventoSegurancaService eventos, SegurancaProperties props) {
        this.sessaoRepository = sessaoRepository;
        this.refreshRepository = refreshRepository;
        this.cache = cache;
        this.eventos = eventos;
        this.duracaoSessao = props.sessao();
        this.tolerancia = props.refreshTolerancia();
    }

    public record SessaoCriada(UUID sessaoId, String refreshToken, Instant expiraEm) {
    }

    public sealed interface ResultadoRenovacao {
        record Renovada(SessaoUsuario sessao, String refreshToken, Instant expiraEm) implements ResultadoRenovacao {
        }

        record Invalida() implements ResultadoRenovacao {
        }

        record Reutilizada(UUID usuarioId, UUID tenantId) implements ResultadoRenovacao {
        }
    }

    @Transactional
    public SessaoCriada criar(UUID usuarioId, UUID tenantId) {
        Instant agora = Instant.now();
        SessaoUsuario s = new SessaoUsuario();
        s.setUsuarioId(usuarioId);
        s.setTenantId(tenantId);
        s.setIp(ClienteRequisicao.ip());
        s.setUserAgent(ClienteRequisicao.userAgent());
        s.setExpiraEm(agora.plus(duracaoSessao));
        s.setUltimoUsoEm(agora);
        sessaoRepository.save(s);
        String bruto = novoRefresh(s);
        return new SessaoCriada(s.getId(), bruto, s.getExpiraEm());
    }

    @Transactional
    public ResultadoRenovacao renovar(String refreshBruto) {
        if (refreshBruto == null || refreshBruto.isBlank()) {
            return new ResultadoRenovacao.Invalida();
        }
        Optional<RefreshToken> encontrado = refreshRepository.buscarPorHash(hash(refreshBruto));
        if (encontrado.isEmpty()) {
            return new ResultadoRenovacao.Invalida();
        }
        RefreshToken token = encontrado.get();
        SessaoUsuario sessao = sessaoRepository.buscarPorId(token.getSessaoId()).orElse(null);
        Instant agora = Instant.now();
        if (sessao == null || !sessao.ativaEm(agora)) {
            return new ResultadoRenovacao.Invalida();
        }
        if (token.getUsadoEm() != null) {
            if (token.getUsadoEm().isAfter(agora.minus(tolerancia))) {
                return new ResultadoRenovacao.Invalida();
            }
            sessao.revogar(MotivoRevogacao.REUTILIZACAO_REFRESH, agora);
            cache.invalidarSessao(sessao.getId());
            return new ResultadoRenovacao.Reutilizada(sessao.getUsuarioId(), sessao.getTenantId());
        }
        if (token.getExpiraEm().isBefore(agora)) {
            return new ResultadoRenovacao.Invalida();
        }
        token.setUsadoEm(agora);
        sessao.setUltimoUsoEm(agora);
        String novo = novoRefresh(sessao);
        return new ResultadoRenovacao.Renovada(sessao, novo, sessao.getExpiraEm());
    }

    /** Logout pelo cookie. Devolve a sessão encerrada, se o token era válido. */
    @Transactional
    public Optional<SessaoUsuario> revogarPorRefresh(String refreshBruto, MotivoRevogacao motivo) {
        if (refreshBruto == null || refreshBruto.isBlank()) {
            return Optional.empty();
        }
        return refreshRepository.buscarPorHash(hash(refreshBruto))
                .flatMap(t -> sessaoRepository.buscarPorId(t.getSessaoId()))
                .map(s -> {
                    s.revogar(motivo, Instant.now());
                    cache.invalidarSessao(s.getId());
                    return s;
                });
    }

    /** Derruba todas as sessões do usuário, menos a indicada (pode ser null). */
    @Transactional
    public void revogarTodasDoUsuario(UUID usuarioId, MotivoRevogacao motivo, UUID excetoSessaoId) {
        Instant agora = Instant.now();
        for (SessaoUsuario s : sessaoRepository.buscarAtivasDoUsuario(usuarioId, agora)) {
            if (!s.getId().equals(excetoSessaoId)) {
                s.revogar(motivo, agora);
            }
        }
        cache.invalidarUsuario(usuarioId);
    }

    @Transactional
    public void definirTenantAtuacao(UUID sessaoId, UUID tenantAtuacaoId) {
        SessaoUsuario s = sessaoRepository.buscarPorId(sessaoId)
                .orElseThrow(() -> new NaoEncontradoException("Sessão não encontrada."));
        s.setTenantAtuacaoId(tenantAtuacaoId);
        cache.invalidarSessao(sessaoId);
    }

    @Transactional(readOnly = true)
    public Optional<SessaoUsuario> buscarAtiva(UUID sessaoId) {
        return sessaoRepository.buscarPorId(sessaoId).filter(s -> s.ativaEm(Instant.now()));
    }

    @Transactional(readOnly = true)
    public List<SessaoResponseDto> listarMinhas() {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        return sessaoRepository.buscarAtivasDoUsuario(eu.usuarioId(), Instant.now()).stream()
                .map(s -> SessaoMapper.toResponseDto(s, eu.sessaoId()))
                .toList();
    }

    /** O próprio usuário encerra uma das suas sessões (ex.: celular perdido). */
    @Transactional
    public void encerrarMinha(UUID sessaoId) {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        SessaoUsuario s = sessaoRepository.buscarPorId(sessaoId)
                .filter(x -> x.getUsuarioId().equals(eu.usuarioId()))
                .orElseThrow(() -> new NaoEncontradoException("Sessão não encontrada."));
        s.revogar(MotivoRevogacao.ENCERRADA_PELO_USUARIO, Instant.now());
        cache.invalidarSessao(sessaoId);
        eventos.registrar(TipoEventoSeguranca.SESSAO_ENCERRADA, eu.usuarioId(), s.getTenantId(), null);
    }

    private String novoRefresh(SessaoUsuario sessao) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String bruto = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken t = new RefreshToken();
        t.setSessaoId(sessao.getId());
        t.setTokenHash(hash(bruto));
        t.setExpiraEm(sessao.getExpiraEm());
        refreshRepository.save(t);
        return bruto;
    }

    private static String hash(String valor) {
        return HashUtils.sha256Hex(valor);
    }
}
