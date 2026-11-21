package com.api.ero_api.compartilhado;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.compartilhado.util.DocumentoValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Dígito verificador da CNH (algoritmo do DETRAN, o mesmo da {@code validate-docbr}), sem
 * banco. Os números válidos foram conferidos à mão pelo cálculo; os de "desconto" são os
 * casos em que o DV1 dá 10 ou mais e o DV2 desconta 2.
 */
class DocumentoValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {"02650306461", "12345678900", "76543210970", "13579246882"})
    void cnhValidaSemDesconto(String cnh) {
        assertThat(DocumentoValidator.cnhValida(cnh)).as(cnh).isTrue();
    }

    /**
     * DV1 = 10 vira 0 e o DV2 desconta 2: resto 4 → 2; resto 10 → 8 (a variante que zera o
     * resto 10 antes do desconto recusaria esta CNH); resto 0 → −2 + 11 = 9.
     */
    @ParameterizedTest
    @ValueSource(strings = {"76269908502", "60192922408", "86083994909"})
    void cnhValidaComDesconto(String cnh) {
        assertThat(DocumentoValidator.cnhValida(cnh)).as(cnh).isTrue();
    }

    @Test
    void cnhComDigitoErradoRecusada() {
        assertThat(DocumentoValidator.cnhValida("02650306462")).as("DV2 errado").isFalse();
        assertThat(DocumentoValidator.cnhValida("02650306451")).as("DV1 errado").isFalse();
        assertThat(DocumentoValidator.cnhValida("76269908500")).as("sem o desconto").isFalse();
        assertThat(DocumentoValidator.cnhValida("60192922400")).as("resto 10 zerado antes do desconto").isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"00000000000", "11111111111", "99999999999"})
    void sequenciaRepetidaRecusada(String cnh) {
        assertThat(DocumentoValidator.cnhValida(cnh)).as(cnh).isFalse();
    }

    @Test
    void foraDoFormatoRecusada() {
        assertThat(DocumentoValidator.cnhValida(null)).isFalse();
        assertThat(DocumentoValidator.cnhValida("")).isFalse();
        assertThat(DocumentoValidator.cnhValida("0265030646")).as("10 dígitos").isFalse();
        assertThat(DocumentoValidator.cnhValida("026503064610")).as("12 dígitos").isFalse();
        assertThat(DocumentoValidator.cnhValida("0265030646A")).as("letra").isFalse();
        assertThat(DocumentoValidator.cnhValida("026.503.064-61")).as("com máscara: quem chama normaliza").isFalse();
    }
}
