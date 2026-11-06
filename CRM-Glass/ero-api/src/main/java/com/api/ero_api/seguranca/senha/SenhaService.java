package com.api.ero_api.seguranca.senha;

import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Política de senha (NIST 800-63B / OWASP A07) e hash (Argon2id).
 *
 * <ul>
 *   <li>Mínimo 12 e máximo 128 caracteres; qualquer caractere vale.</li>
 *   <li>Não pode estar na lista de senhas comuns nem conter o e-mail/nome.</li>
 *   <li>Sem regra de "tem que ter símbolo": comprimento protege mais.</li>
 * </ul>
 */
@Service
public class SenhaService {

    public static final int MINIMO = 12;
    public static final int MAXIMO = 128;

    private final PasswordEncoder encoder;
    private final Set<String> comuns;

    public SenhaService(PasswordEncoder encoder) {
        this.encoder = encoder;
        this.comuns = carregarComuns();
    }

    public String gerarHash(String senha) {
        return encoder.encode(senha);
    }

    public boolean confere(String senha, String hash) {
        return senha != null && hash != null && encoder.matches(senha, hash);
    }

    /** Hash com algoritmo antigo/parâmetro fraco deve ser regravado no próximo login. */
    public boolean precisaAtualizarHash(String hash) {
        return encoder.upgradeEncoding(hash);
    }

    /** Lança {@link RegraNegocioException} com o motivo se a senha não serve. */
    public void validarPolitica(String senha, String email, String nome) {
        if (senha == null || senha.length() < MINIMO) {
            throw new RegraNegocioException("A senha precisa ter pelo menos " + MINIMO + " caracteres.");
        }
        if (senha.length() > MAXIMO) {
            throw new RegraNegocioException("A senha pode ter no máximo " + MAXIMO + " caracteres.");
        }
        String minuscula = senha.toLowerCase(Locale.ROOT);
        if (comuns.contains(minuscula)) {
            throw new RegraNegocioException("Essa senha é muito comum. Escolha outra.");
        }
        if (senha.chars().distinct().count() < 4) {
            throw new RegraNegocioException("A senha repete caracteres demais. Escolha outra.");
        }
        if (email != null && email.contains("@")) {
            String usuarioEmail = email.substring(0, email.indexOf('@')).toLowerCase(Locale.ROOT);
            if (usuarioEmail.length() >= 4 && minuscula.contains(usuarioEmail)) {
                throw new RegraNegocioException("A senha não pode conter o seu e-mail.");
            }
        }
        if (nome != null) {
            for (String parte : nome.toLowerCase(Locale.ROOT).split("\\s+")) {
                if (parte.length() >= 4 && minuscula.contains(parte)) {
                    throw new RegraNegocioException("A senha não pode conter o seu nome.");
                }
            }
        }
    }

    private static Set<String> carregarComuns() {
        ClassPathResource arquivo = new ClassPathResource("seguranca/senhas-comuns.txt");
        try (BufferedReader r = new BufferedReader(new InputStreamReader(arquivo.getInputStream(), StandardCharsets.UTF_8))) {
            return r.lines()
                    .map(String::trim)
                    .filter(l -> !l.isEmpty() && !l.startsWith("#"))
                    .map(l -> l.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toUnmodifiableSet());
        } catch (IOException e) {
            throw new UncheckedIOException("Lista de senhas comuns não encontrada.", e);
        }
    }
}
