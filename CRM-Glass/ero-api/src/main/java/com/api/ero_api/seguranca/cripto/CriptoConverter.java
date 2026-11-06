package com.api.ero_api.seguranca.cripto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Uso na entidade: {@code @Convert(converter = CriptoConverter.class)} em campo
 * String que precisa ficar cifrado no banco (segredo 2FA, tokens de integração…).
 *
 * <p>O Hibernate cria esta classe pelo Spring (SpringBeanContainer), por isso a
 * injeção pelo construtor funciona. Campo cifrado não serve para busca/ordenação.
 */
@Converter
public class CriptoConverter implements AttributeConverter<String, String> {

    private final CriptoService cripto;

    public CriptoConverter(CriptoService cripto) {
        this.cripto = cripto;
    }

    @Override
    public String convertToDatabaseColumn(String valor) {
        return cripto.cifrar(valor);
    }

    @Override
    public String convertToEntityAttribute(String gravado) {
        return cripto.decifrar(gravado);
    }
}
