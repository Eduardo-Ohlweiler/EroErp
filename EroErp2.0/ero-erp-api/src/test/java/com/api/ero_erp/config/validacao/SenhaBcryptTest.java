package com.api.ero_erp.config.validacao;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** A regra é de bytes, não de caracteres — piso e teto no mesmo lugar. */
@DisplayName("SenhaBcrypt — cabe em 72 bytes")
class SenhaBcryptTest {

    @Test
    @DisplayName("72 bytes cabem, 73 não — em ASCII e em acentuado")
    void limiteEmBytes() {
        assertThat(SenhaBcryptValidator.cabe("a".repeat(72))).isTrue();
        assertThat(SenhaBcryptValidator.cabe("a".repeat(73))).isFalse();

        assertThat(SenhaBcryptValidator.cabe("é".repeat(36))).isTrue();    // 72 bytes
        assertThat(SenhaBcryptValidator.cabe("é".repeat(37))).isFalse();   // 74 bytes
        assertThat(SenhaBcryptValidator.cabe("a" + "é".repeat(36))).isFalse(); // 73 bytes
    }

    @Test
    @DisplayName("40 caracteres acentuados não cabem, mesmo abaixo de 72 caracteres")
    void caracteresNaoSaoBytes() {
        String senha = "é".repeat(40);
        assertThat(senha).hasSizeLessThan(72);
        assertThat(SenhaBcryptValidator.cabe(senha)).isFalse();
        assertThat(SenhaBcryptValidator.cabe("€".repeat(24))).isTrue();    // 3 bytes cada: 72
        assertThat(SenhaBcryptValidator.cabe("€".repeat(25))).isFalse();
    }

    @Test
    @DisplayName("nulo cabe: ausência é do @NotBlank")
    void nuloCabe() {
        assertThat(SenhaBcryptValidator.cabe(null)).isTrue();
    }
}
