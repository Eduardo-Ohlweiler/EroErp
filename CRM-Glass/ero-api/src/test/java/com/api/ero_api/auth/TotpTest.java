package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.auth.util.Base32;
import com.api.ero_api.auth.util.Totp;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class TotpTest {

    /** Vetor oficial da RFC 6238 (SHA-1, T=59 s): 94287082 → últimos 6 dígitos. */
    @Test
    void confereComAVetorDaRfc() {
        String segredo = Base32.codificar("12345678901234567890".getBytes(StandardCharsets.US_ASCII));
        assertThat(segredo).isEqualTo("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        assertThat(Totp.codigoEm(segredo, Instant.ofEpochSecond(59))).isEqualTo("287082");
    }

    @Test
    void naoAceitaOMesmoCodigoDuasVezes() {
        String segredo = Totp.gerarSegredo();
        Instant agora = Instant.now();
        String codigo = Totp.codigoEm(segredo, agora);

        var primeiro = Totp.validar(segredo, codigo, agora, null);
        assertThat(primeiro).isPresent();
        assertThat(Totp.validar(segredo, codigo, agora, primeiro.getAsLong())).isEmpty();
    }

    @Test
    void recusaCodigoMalFormado() {
        String segredo = Totp.gerarSegredo();
        assertThat(Totp.validar(segredo, "12a456", Instant.now(), null)).isEmpty();
        assertThat(Totp.validar(segredo, null, Instant.now(), null)).isEmpty();
    }
}
