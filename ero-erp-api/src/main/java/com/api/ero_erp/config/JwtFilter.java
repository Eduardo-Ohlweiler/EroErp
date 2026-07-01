package com.api.ero_erp.config;

import com.api.ero_erp.exceptions.ErrorResponse;
import com.api.ero_erp.exceptions.UnauthorizedException;
import com.api.ero_erp.loginlog.entity.TipoLogout;
import com.api.ero_erp.loginlog.service.LoginLogService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil           jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final LoginLogService   loginLogService;
    private final ObjectMapper      mapper = new ObjectMapper();

    public JwtFilter(
            JwtUtil jwtUtil,
            UsuarioRepository usuarioRepository,
            LoginLogService loginLogService
    ) {
        this.jwtUtil            = jwtUtil;
        this.usuarioRepository  = usuarioRepository;
        this.loginLogService    = loginLogService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest  request,
            HttpServletResponse response,
            FilterChain         filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        String token = null;
        if (header != null && !header.isBlank() && header.startsWith("Bearer ")) {
            token = header.substring(7);
        } else if (isStreamPath(request)) {
            // EventSource não envia header Authorization: aceita o JWT via query param ?token=
            String paramToken = request.getParameter("token");
            if (paramToken != null && !paramToken.isBlank()) {
                token = paramToken;
            }
        }

        if (token != null) {
            try {
                Long id             = jwtUtil.getId(token);
                List<String> roles  = jwtUtil.getRoles(token);
                Long sessionId      = jwtUtil.getSessionId(token);

                Usuario usuario = usuarioRepository.findByIdWithDetails(id).orElse(null);
                if (usuario == null || !usuario.getAtivo()) {
                    escreverErro(response, "Usuário inativo ou não encontrado");
                    return;
                }
                if (usuario.getCliente() != null && !usuario.getCliente().getAtivo()) {
                    escreverErro(response, "Acesso bloqueado, contate o administrador");
                    return;
                }

                List<GrantedAuthority> authorities = roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            id, null, authorities
                    );
                    auth.setDetails(sessionId);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }

            } catch (ExpiredJwtException e) {
                // logout implícito: fecha a sessão correspondente ao token expirado
                Claims claims    = e.getClaims();
                Long sessionId   = jwtUtil.extrairSessionId(claims);
                LocalDateTime expiracao = claims.getExpiration().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDateTime();
                loginLogService.fecharSessao(sessionId, expiracao, TipoLogout.EXPIRACAO);

                SecurityContextHolder.clearContext();
                escreverErro(response, "Token expirado");
                return;
            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
                escreverErro(response, "Token inválido");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isStreamPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path != null && path.endsWith("/crm/atendimentos/stream");
    }

    private void escreverErro(HttpServletResponse response, String mensagem) throws IOException {
        ErrorResponse error = ErrorResponse.builder()
                .erro(mensagem)
                .codigo(401)
                .timestamp(new Date())
                .path("")
                .build();

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(mapper.writeValueAsString(error));
    }
}
