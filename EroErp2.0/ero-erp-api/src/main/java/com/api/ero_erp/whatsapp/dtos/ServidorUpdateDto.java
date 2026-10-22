package com.api.ero_erp.whatsapp.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * @param apiKey vazia mantém a gravada; obrigatória no primeiro cadastro
 */
public record ServidorUpdateDto(
        @NotBlank(message = "URL do servidor é obrigatória")
        @Size(max = 255, message = "URL aceita até 255 caracteres")
        @Pattern(regexp = "(?i)^https?://\\S+$", message = "URL deve começar com http:// ou https://")
        String url,

        @Size(max = 500, message = "Apikey aceita até 500 caracteres")
        String apiKey,

        @NotNull(message = "Informe se o servidor está ativo")
        Boolean ativo
) {}
