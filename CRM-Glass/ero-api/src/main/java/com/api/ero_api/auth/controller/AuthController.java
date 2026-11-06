package com.api.ero_api.auth.controller;

import com.api.ero_api.auth.dtos.AutenticacaoRespostaDto;
import com.api.ero_api.auth.dtos.CodigosRecuperacaoDto;
import com.api.ero_api.auth.dtos.DoisFatoresAtivarDto;
import com.api.ero_api.auth.dtos.DoisFatoresConfiguracaoDto;
import com.api.ero_api.auth.dtos.DoisFatoresDesativarDto;
import com.api.ero_api.auth.dtos.DoisFatoresVerificarDto;
import com.api.ero_api.auth.dtos.LoginDto;
import com.api.ero_api.auth.dtos.TrocarSenhaDto;
import com.api.ero_api.auth.dtos.UsuarioLogadoDto;
import com.api.ero_api.auth.service.AuthService;
import com.api.ero_api.auth.service.AuthService.Resultado;
import com.api.ero_api.auth.service.DoisFatoresService;
import com.api.ero_api.auth.util.RefreshCookie;
import com.api.ero_api.compartilhado.exception.AcessoNegadoException;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Autenticação. As 4 rotas públicas ({@code @PermitAll}) têm limite de
 * requisições próprio (RateLimitFilter). O refresh token só trafega em cookie.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Login, sessão, senha e verificação em duas etapas")
public class AuthController {

    /** Header obrigatório no refresh/logout: formulário de outro site não consegue enviar (anti-CSRF). */
    public static final String HEADER_ANTI_CSRF = "X-Ero-Refresh";

    private final AuthService authService;
    private final DoisFatoresService doisFatoresService;
    private final boolean cookieSeguro;

    public AuthController(AuthService authService, DoisFatoresService doisFatoresService, SegurancaProperties props) {
        this.authService = authService;
        this.doisFatoresService = doisFatoresService;
        this.cookieSeguro = props.cookieSeguro();
    }

    @PostMapping("/login")
    @PermitAll
    @Operation(summary = "Entra com e-mail e senha (pode pedir o código 2FA em seguida)")
    public ResponseEntity<AutenticacaoRespostaDto> login(@Valid @RequestBody LoginDto dto) {
        return responder(authService.login(dto));
    }

    @PostMapping("/2fa/verificar")
    @PermitAll
    @Operation(summary = "Segunda etapa do login: código do app ou de recuperação")
    public ResponseEntity<AutenticacaoRespostaDto> verificarDoisFatores(@Valid @RequestBody DoisFatoresVerificarDto dto) {
        return responder(authService.verificarDoisFatores(dto));
    }

    @PostMapping("/refresh")
    @PermitAll
    @Operation(summary = "Novo token de acesso a partir do cookie de sessão (gira o cookie)")
    public ResponseEntity<AutenticacaoRespostaDto> refresh(
            @RequestHeader(name = HEADER_ANTI_CSRF, required = false) String antiCsrf,
            @CookieValue(name = RefreshCookie.NOME, required = false) String refreshToken) {
        exigirHeaderAntiCsrf(antiCsrf);
        return responder(authService.renovar(refreshToken));
    }

    @PostMapping("/logout")
    @PermitAll
    @Operation(summary = "Encerra a sessão deste navegador")
    public ResponseEntity<Void> logout(
            @RequestHeader(name = HEADER_ANTI_CSRF, required = false) String antiCsrf,
            @CookieValue(name = RefreshCookie.NOME, required = false) String refreshToken) {
        exigirHeaderAntiCsrf(antiCsrf);
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, RefreshCookie.limpar(cookieSeguro).toString())
                .build();
    }

    @GetMapping("/eu")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Quem sou eu: dados, contratante, permissões e telas liberadas")
    public UsuarioLogadoDto eu() {
        return authService.eu();
    }

    @PutMapping("/senha")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Troca a minha senha (encerra as outras sessões)")
    public ResponseEntity<Void> trocarSenha(@Valid @RequestBody TrocarSenhaDto dto) {
        authService.trocarSenha(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/2fa/configurar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Gera o QR code para o app autenticador")
    public DoisFatoresConfiguracaoDto configurarDoisFatores() {
        return doisFatoresService.configurar();
    }

    @PostMapping("/2fa/ativar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Confirma senha e primeiro código e liga a verificação em duas etapas")
    public CodigosRecuperacaoDto ativarDoisFatores(@Valid @RequestBody DoisFatoresAtivarDto dto) {
        return doisFatoresService.ativar(dto);
    }

    @PostMapping("/2fa/desativar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Desliga a verificação em duas etapas (pede senha e código)")
    public ResponseEntity<Void> desativarDoisFatores(@Valid @RequestBody DoisFatoresDesativarDto dto) {
        doisFatoresService.desativar(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/superadmin/acessar/{tenantId}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Superadmin passa a atuar dentro de um contratante (fica na auditoria)")
    public AutenticacaoRespostaDto acessarTenant(@PathVariable UUID tenantId) {
        return authService.acessarTenant(tenantId);
    }

    @PostMapping("/superadmin/sair")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Superadmin volta para a visão de plataforma")
    public AutenticacaoRespostaDto sairDoTenant() {
        return authService.sairDoTenant();
    }

    private ResponseEntity<AutenticacaoRespostaDto> responder(Resultado r) {
        ResponseEntity.BodyBuilder ok = ResponseEntity.ok();
        if (r.refreshToken() != null) {
            Duration validade = Duration.between(Instant.now(), r.refreshExpiraEm());
            ok.header(HttpHeaders.SET_COOKIE, RefreshCookie.criar(r.refreshToken(), validade, cookieSeguro).toString());
        }
        return ok.body(r.resposta());
    }

    private static void exigirHeaderAntiCsrf(String valor) {
        if (!"1".equals(valor)) {
            throw new AcessoNegadoException("Requisição recusada.");
        }
    }
}
