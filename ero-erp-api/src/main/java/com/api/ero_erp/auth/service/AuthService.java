package com.api.ero_erp.auth.service;

import com.api.ero_erp.auth.dtos.AuthLoginDto;
import com.api.ero_erp.auth.dtos.AuthResponseDto;
import com.api.ero_erp.config.JwtUtil;
import com.api.ero_erp.exceptions.UnauthorizedException;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder   passwordEncoder,
            JwtUtil           jwtUtil
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder   = passwordEncoder;
        this.jwtUtil           = jwtUtil;
    }

    @Transactional
    public AuthResponseDto login(AuthLoginDto dto) {

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(dto.email())
                .orElseThrow(() -> new UnauthorizedException("Email ou senha inválidos"));

        if (!usuario.getAtivo())
            throw new UnauthorizedException("Usuário inativo, contate o administrador");

        if (!passwordEncoder.matches(dto.senha(), usuario.getSenha()))
            throw new UnauthorizedException("Email ou senha inválidos");

        Set<String> roles = usuario.getRoles().stream()
                .map(r -> r.getNome())
                .collect(Collectors.toSet());

        // JwtUtil espera List<String>
        String token = jwtUtil.gerar(usuario.getId(), List.copyOf(roles));

        return new AuthResponseDto(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                roles
        );
    }
}