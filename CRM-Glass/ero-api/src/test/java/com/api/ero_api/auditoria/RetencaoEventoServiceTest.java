package com.api.ero_api.auditoria;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.auditoria.service.RetencaoEventoService;
import java.time.Duration;
import org.junit.jupiter.api.Test;

/** Retenção curta demais apagaria a trilha inteira na madrugada seguinte: a aplicação não sobe. */
class RetencaoEventoServiceTest {

    @Test
    void recusaRetencaoMenorQueTrintaDias() {
        assertThatThrownBy(() -> new RetencaoEventoService(null, null, Duration.ofDays(29)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("P30D");
        assertThatThrownBy(() -> new RetencaoEventoService(null, null, Duration.ofMinutes(30)))
                .as("\"30m\" no lugar de \"30d\"")
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void aceitaTrintaDiasOuMais() {
        assertThatCode(() -> new RetencaoEventoService(null, null, Duration.ofDays(30))).doesNotThrowAnyException();
        assertThatCode(() -> new RetencaoEventoService(null, null, Duration.ofDays(365))).doesNotThrowAnyException();
    }
}
