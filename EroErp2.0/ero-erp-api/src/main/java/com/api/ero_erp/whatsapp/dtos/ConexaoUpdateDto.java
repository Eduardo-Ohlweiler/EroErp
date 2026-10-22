package com.api.ero_erp.whatsapp.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * A sobrescrita do servidor numa conexão — do superadmin.
 *
 * @param url           vazia volta ao servidor global
 * @param apiKey        vazia mantém a gravada
 * @param removerApiKey volta à apikey do servidor global
 * @param ativo         desativada, a conexão não conecta nem envia
 */
public record ConexaoUpdateDto(
        @Size(max = 255, message = "URL aceita até 255 caracteres")
        @Pattern(regexp = "(?i)^$|^https?://\\S+$", message = "URL deve começar com http:// ou https://")
        String url,

        @Size(max = 500, message = "Apikey aceita até 500 caracteres")
        String apiKey,

        boolean removerApiKey,

        @NotNull(message = "Informe se a conexão está ativa")
        Boolean ativo
) {}
