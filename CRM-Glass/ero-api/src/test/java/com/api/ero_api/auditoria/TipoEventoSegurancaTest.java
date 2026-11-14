package com.api.ero_api.auditoria;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

/** Tipo novo na trilha nasce com rótulo e categoria: a tela Logs mostra o rótulo e filtra pela categoria. */
class TipoEventoSegurancaTest {

    @Test
    void todoTipoTemRotuloECategoria() {
        for (TipoEventoSeguranca t : TipoEventoSeguranca.values()) {
            assertThat(t.rotulo()).as(t.name()).isNotBlank();
            assertThat(t.categoria()).as(t.name()).isNotNull();
            assertThat(t.categoria().rotulo()).as(t.name()).isNotBlank();
        }
    }

    @Test
    void rotulosNaoSeRepetem() {
        assertThat(Arrays.stream(TipoEventoSeguranca.values()).map(TipoEventoSeguranca::rotulo)).doesNotHaveDuplicates();
    }
}
