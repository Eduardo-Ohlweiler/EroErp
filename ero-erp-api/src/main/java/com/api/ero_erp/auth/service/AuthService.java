package com.api.ero_erp.auth.service;

import com.api.ero_erp.auth.dtos.AuthLoginDto;
import com.api.ero_erp.auth.dtos.AuthResponseDto;
import com.api.ero_erp.config.JwtUtil;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.UnauthorizedException;
import com.api.ero_erp.loginlog.entity.TipoLogout;
import com.api.ero_erp.loginlog.service.LoginLogService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;
    private final LoginLogService   loginLogService;
    private final SecurityUtils     securityUtils;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder   passwordEncoder,
            JwtUtil           jwtUtil,
            LoginLogService   loginLogService,
            SecurityUtils     securityUtils
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder   = passwordEncoder;
        this.jwtUtil           = jwtUtil;
        this.loginLogService   = loginLogService;
        this.securityUtils     = securityUtils;
    }

    @Transactional
    public AuthResponseDto login(AuthLoginDto dto, String enderecoIp) {

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(dto.email())
                .orElseThrow(() -> new UnauthorizedException("Email ou senha inválidos"));

        if (!usuario.getAtivo())
            throw new UnauthorizedException("Usuário inativo, contate o administrador");

        if (usuario.getCliente() != null && !usuario.getCliente().getAtivo())
            throw new UnauthorizedException("Acesso bloqueado, contate o administrador");


        if (!passwordEncoder.matches(dto.senha(), usuario.getSenha()))
            throw new UnauthorizedException("Email ou senha inválidos");

        // Roles efetivas: roles diretas do usuário + roles herdadas dos grupos de acesso
        Set<String> roles = usuario.getRoles().stream()
                .map(r -> r.getNome())
                .collect(Collectors.toCollection(HashSet::new));

        usuario.getGrupos().forEach(grupo ->
                grupo.getRoles().forEach(r -> roles.add(r.getNome())));

        Long sessionId = loginLogService.registrarLogin(usuario, enderecoIp);

        String token = jwtUtil.gerar(usuario.getId(), List.copyOf(roles), sessionId);

        return new AuthResponseDto(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                roles
        );
    }

    /** Fecha a sessão (logout manual). Tolerante: se não houver sessão no contexto, não faz nada. */
    @Transactional
    public void logout() {
        Long sessionId = securityUtils.getSessionIdLogado();
        loginLogService.fecharSessao(sessionId, LocalDateTime.now(), TipoLogout.MANUAL);
    }
}