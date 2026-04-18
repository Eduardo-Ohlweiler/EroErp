package com.api.ero_erp.config;

import com.api.ero_erp.exceptions.ErrorResponse;
import com.api.ero_erp.exceptions.UnauthorizedException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil      jwtUtil;
    private final ObjectMapper mapper = new ObjectMapper();

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest  request,
            HttpServletResponse response,
            FilterChain         filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        System.out.println("=== JwtFilter executando ===");
        System.out.println("Header: " + header);

        if (header != null && !header.isBlank() && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            System.out.println("Token recebido: " + token.substring(0, 20) + "...");

            try {
                Long id = jwtUtil.getId(token);

                System.out.println("ID extraído: " + id);


                List<String> roles = jwtUtil.getRoles(token);

                List<GrantedAuthority> authorities = roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    Authentication auth = new UsernamePasswordAuthenticationToken(
                            id, null, authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }

            } catch (ExpiredJwtException e) {
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
