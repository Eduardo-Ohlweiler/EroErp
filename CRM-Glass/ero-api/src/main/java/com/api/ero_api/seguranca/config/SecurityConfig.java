package com.api.ero_api.seguranca.config;

import com.api.ero_api.seguranca.jwt.JwtAutenticacaoConverter;
import com.api.ero_api.seguranca.jwt.JwtService;
import com.api.ero_api.seguranca.ratelimit.RateLimitFilter;
import com.api.ero_api.seguranca.ratelimit.RateLimitProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * Configuração central do Spring Security.
 *
 * <ul>
 *   <li>API sem sessão no servidor: cada requisição traz o JWT (Authorization: Bearer).</li>
 *   <li>Rotas públicas: só login, 2FA, refresh, logout e health. Todo o resto exige
 *       login E {@code @PreAuthorize} no controller (o ArquiteturaTest garante).</li>
 *   <li>CSRF desligado porque o token vai em header, não em cookie. A única rota que
 *       usa cookie (refresh/logout) exige SameSite=Strict + header X-Ero-Refresh.</li>
 *   <li>401/403 viram ProblemDetail pelo GlobalExceptionHandler.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(jsr250Enabled = true)
public class SecurityConfig {

    /** Rotas que não leem o Authorization (um token vencido não pode impedir login/logout). */
    private static final Set<String> ROTAS_PUBLICAS = Set.of(
            "/api/auth/login", "/api/auth/2fa/verificar", "/api/auth/refresh", "/api/auth/logout");

    @Bean
    SecurityFilterChain api(HttpSecurity http,
                            JwtService jwtService,
                            JwtAutenticacaoConverter converter,
                            SegurancaProperties props,
                            RateLimitProperties rateLimit,
                            @Qualifier("corsConfigurationSource") CorsConfigurationSource cors,
                            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) throws Exception {

        AuthenticationEntryPoint naoAutenticado = (req, res, ex) -> resolver.resolveException(req, res, null, ex);
        AccessDeniedHandler semPermissao = (req, res, ex) -> resolver.resolveException(req, res, null, ex);

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(cors))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .headers(h -> h
                        .contentSecurityPolicy(csp -> csp.policyDirectives(props.csp()))
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .frameOptions(f -> f.deny())
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000))
                        .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy",
                                "camera=(), microphone=(), geolocation=(), payment=()"))
                        .addHeaderWriter(new StaticHeadersWriter("Cross-Origin-Opener-Policy", "same-origin")))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(ROTAS_PUBLICAS.toArray(String[]::new)).permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o
                        .bearerTokenResolver(resolverDeToken())
                        .jwt(j -> j.decoder(jwtService.decoderAcesso()).jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint(naoAutenticado)
                        .accessDeniedHandler(semPermissao))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(naoAutenticado)
                        .accessDeniedHandler(semPermissao))
                .addFilterBefore(new RateLimitFilter(rateLimit, resolver), BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    /** Argon2id para senhas novas; BCrypt aceito só para migrar hash antigo. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new DelegatingPasswordEncoder("argon2", Map.of(
                "argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8(),
                "bcrypt", new BCryptPasswordEncoder(12)));
    }

    private static BearerTokenResolver resolverDeToken() {
        DefaultBearerTokenResolver padrao = new DefaultBearerTokenResolver();
        return (HttpServletRequest req) -> ROTAS_PUBLICAS.contains(req.getRequestURI()) ? null : padrao.resolve(req);
    }
}
