package com.api.ero_api.auth.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.auth.dtos.CodigosRecuperacaoDto;
import com.api.ero_api.auth.dtos.DoisFatoresAtivarDto;
import com.api.ero_api.auth.dtos.DoisFatoresConfiguracaoDto;
import com.api.ero_api.auth.dtos.DoisFatoresDesativarDto;
import com.api.ero_api.auth.entity.CodigoRecuperacao;
import com.api.ero_api.auth.repository.CodigoRecuperacaoRepository;
import com.api.ero_api.auth.util.Totp;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.util.HashUtils;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import com.api.ero_api.seguranca.senha.SenhaService;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.sessao.enums.MotivoRevogacao;
import com.api.ero_api.sessao.service.SessaoService;
import com.api.ero_api.tenant.service.TenantService;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
import com.api.ero_api.usuario.service.UsuarioService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.OptionalLong;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Verificação em duas etapas (TOTP): configurar, ativar e desativar a própria,
 * validar o código no login. (Admin redefinindo a de outra pessoa: UsuarioService.redefinirDoisFatores.)
 *
 * <p>As operações sobre a própria conta rodam em contexto ROOT, sempre sobre o
 * usuário do token: assim funcionam também para o superadmin atuando dentro de
 * um contratante. Ativar e desativar pedem a senha e respeitam o bloqueio de conta.
 */
@Service
public class DoisFatoresService {

    private static final int QTD_CODIGOS = 10;
    private static final String ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final String MSG_BLOQUEADA = "Conta bloqueada temporariamente por excesso de tentativas.";

    private final UsuarioService usuarioService;
    private final TenantService tenantService;
    private final CodigoRecuperacaoRepository codigoRepository;
    private final SenhaService senhaService;
    private final SessaoService sessaoService;
    private final DoisFatoresLimpezaService limpeza;
    private final EventoSegurancaService eventos;
    private final SegurancaProperties props;
    private final TransactionTemplate tx;
    private final String emissor;
    private final SecureRandom random = new SecureRandom();

    public DoisFatoresService(UsuarioService usuarioService, TenantService tenantService,
                              CodigoRecuperacaoRepository codigoRepository, SenhaService senhaService,
                              SessaoService sessaoService, DoisFatoresLimpezaService limpeza, EventoSegurancaService eventos,
                              SegurancaProperties props, PlatformTransactionManager transactionManager,
                              @Value("${app.nome:CRM}") String emissor) {
        this.usuarioService = usuarioService;
        this.tenantService = tenantService;
        this.codigoRepository = codigoRepository;
        this.senhaService = senhaService;
        this.sessaoService = sessaoService;
        this.limpeza = limpeza;
        this.eventos = eventos;
        this.props = props;
        this.tx = new TransactionTemplate(transactionManager);
        this.emissor = emissor;
    }

    /** Passo 1: gera o segredo (ainda desligado) e devolve o QR code. */
    public DoisFatoresConfiguracaoDto configurar() {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        return root(() -> {
            Usuario u = usuarioService.buscarEntidade(eu.usuarioId());
            if (u.isTotpAtivo()) {
                throw new RegraNegocioException("A verificação em duas etapas já está ativa.");
            }
            String segredo = Totp.gerarSegredo();
            u.setTotpSegredo(segredo);
            u.setTotpUltimoPasso(null);
            return new DoisFatoresConfiguracaoDto(segredo, uri(u.getEmail(), segredo));
        });
    }

    private sealed interface Resultado<T> {
        record Ok<T>(T valor) implements Resultado<T> {
        }

        record Erro<T>(boolean bloqueou, UUID tenantDoUsuario) implements Resultado<T> {
        }
    }

    /** Passo 2: senha + primeiro código; devolve os códigos de recuperação (uma única vez). */
    public CodigosRecuperacaoDto ativar(DoisFatoresAtivarDto dto) {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        Instant agora = Instant.now();
        Resultado<CodigosRecuperacaoDto> r = root(() -> {
            Usuario u = buscarComBloqueio(eu.usuarioId(), agora);
            if (u.isTotpAtivo()) {
                throw new RegraNegocioException("A verificação em duas etapas já está ativa.");
            }
            if (u.getTotpSegredo() == null) {
                throw new RegraNegocioException("Comece pela configuração do aplicativo autenticador.");
            }
            if (!senhaService.confere(dto.senha(), u.getSenhaHash())) {
                return new Resultado.Erro<>(contarErro(u, agora), u.getTenantId());
            }
            OptionalLong passo = Totp.validar(u.getTotpSegredo(), dto.codigo().trim(), agora, null);
            if (passo.isEmpty()) {
                throw new RegraNegocioException("Código inválido. Confira se a hora do celular está certa.");
            }
            u.setTotpAtivo(true);
            u.setTotpUltimoPasso(passo.getAsLong());
            List<String> codigos = gerarCodigos(u);
            sessaoService.revogarTodasDoUsuario(u.getId(), MotivoRevogacao.DOIS_FATORES_ALTERADO, eu.sessaoId());
            eventos.registrar(TipoEventoSeguranca.DOIS_FATORES_ATIVADO, u.getId(), u.getTenantId(), null);
            return new Resultado.Ok<>(new CodigosRecuperacaoDto(codigos));
        });
        return tratar(r, eu, "Senha incorreta.");
    }

    /** Desliga a própria 2FA: pede senha e código, e derruba as outras sessões. */
    public void desativar(DoisFatoresDesativarDto dto) {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        Instant agora = Instant.now();
        Resultado<Boolean> r = root(() -> {
            Usuario u = buscarComBloqueio(eu.usuarioId(), agora);
            if (!u.isTotpAtivo()) {
                throw new RegraNegocioException("A verificação em duas etapas não está ativa.");
            }
            if (exige2fa(u)) {
                throw new RegraNegocioException("A verificação em duas etapas é obrigatória para a sua conta.");
            }
            if (!senhaService.confere(dto.senha(), u.getSenhaHash()) || !validarCodigoLogin(u, dto.codigo(), agora)) {
                return new Resultado.Erro<>(contarErro(u, agora), u.getTenantId());
            }
            limpeza.desligar(u);
            sessaoService.revogarTodasDoUsuario(u.getId(), MotivoRevogacao.DOIS_FATORES_ALTERADO, eu.sessaoId());
            eventos.registrar(TipoEventoSeguranca.DOIS_FATORES_DESATIVADO, u.getId(), u.getTenantId(), null);
            return new Resultado.Ok<>(true);
        });
        tratar(r, eu, "Senha ou código incorretos.");
    }

    /**
     * Código do app (6 dígitos, sem reuso) ou código de recuperação (uso único).
     * Participa da transação de quem chama (login, desativar), com a linha do usuário travada.
     */
    @Transactional
    public boolean validarCodigoLogin(Usuario u, String codigo, Instant agora) {
        String c = codigo == null ? "" : codigo.trim();
        if (c.matches("\\d{" + Totp.DIGITOS + "}")) {
            OptionalLong passo = Totp.validar(u.getTotpSegredo(), c, agora, u.getTotpUltimoPasso());
            passo.ifPresent(p -> usuarioService.registrarPassoTotp(u.getId(), p));
            return passo.isPresent();
        }
        Optional<CodigoRecuperacao> recuperacao =
                codigoRepository.buscarNaoUsado(u.getId(), HashUtils.sha256Hex(normalizar(c)));
        if (recuperacao.isEmpty()) {
            return false;
        }
        recuperacao.get().setUsadoEm(agora);
        eventos.registrar(TipoEventoSeguranca.CODIGO_RECUPERACAO_USADO, u.getId(), u.getTenantId(), null);
        return true;
    }

    // ---------------------------------------------------------------- interno

    private Usuario buscarComBloqueio(UUID usuarioId, Instant agora) {
        Usuario u = usuarioService.buscarComBloqueio(usuarioId)
                .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
        if (u.bloqueadoEm(agora)) {
            throw new RegraNegocioException(MSG_BLOQUEADA);
        }
        return u;
    }

    /** Conta um erro de senha/código; devolve true se a conta acabou de ser bloqueada. */
    private boolean contarErro(Usuario u, Instant agora) {
        int tentativas = u.getTentativasFalhas() + 1;
        if (tentativas >= props.loginMaxTentativas()) {
            usuarioService.atualizarTentativas(u.getId(), 0, agora.plus(props.loginBloqueio()));
            return true;
        }
        usuarioService.atualizarTentativas(u.getId(), tentativas, null);
        return false;
    }

    private <T> T tratar(Resultado<T> r, UsuarioAutenticado eu, String mensagemErro) {
        if (r instanceof Resultado.Ok<T> ok) {
            return ok.valor();
        }
        Resultado.Erro<T> erro = (Resultado.Erro<T>) r;
        if (erro.bloqueou()) {
            eventos.registrarIndependente(TipoEventoSeguranca.CONTA_BLOQUEADA, eu.usuarioId(), erro.tenantDoUsuario(),
                    "erros de senha/código na verificação em duas etapas");
            throw new RegraNegocioException(MSG_BLOQUEADA);
        }
        throw new RegraNegocioException(mensagemErro);
    }

    private boolean exige2fa(Usuario u) {
        if (u.getPapel() == Papel.SUPERADMIN) {
            return props.superadminExige2fa();
        }
        return tenantService.buscarEntidade(u.getTenantId()).isExige2fa();
    }

    private List<String> gerarCodigos(Usuario u) {
        codigoRepository.deleteAll(codigoRepository.buscarDoUsuario(u.getId()));
        codigoRepository.flush();
        List<String> codigos = new ArrayList<>();
        for (int i = 0; i < QTD_CODIGOS; i++) {
            String codigo = sortear(4) + "-" + sortear(4);
            CodigoRecuperacao c = new CodigoRecuperacao();
            c.atribuirTenant(u.getTenantId());
            c.setUsuarioId(u.getId());
            c.setCodigoHash(HashUtils.sha256Hex(normalizar(codigo)));
            codigoRepository.save(c);
            codigos.add(codigo);
        }
        return codigos;
    }

    private String sortear(int tamanho) {
        StringBuilder sb = new StringBuilder(tamanho);
        for (int i = 0; i < tamanho; i++) {
            sb.append(ALFABETO_CODIGO.charAt(random.nextInt(ALFABETO_CODIGO.length())));
        }
        return sb.toString();
    }

    private static String normalizar(String codigo) {
        return codigo.replace("-", "").replace(" ", "").toUpperCase(Locale.ROOT);
    }

    private String uri(String email, String segredo) {
        String rotulo = codificar(emissor + ":" + email);
        return "otpauth://totp/" + rotulo + "?secret=" + segredo + "&issuer=" + codificar(emissor)
                + "&algorithm=SHA1&digits=" + Totp.DIGITOS + "&period=" + Totp.PERIODO_SEGUNDOS;
    }

    private static String codificar(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private <T> T root(Supplier<T> acao) {
        return TenantContext.comoRoot(() -> tx.execute(status -> acao.get()));
    }
}
