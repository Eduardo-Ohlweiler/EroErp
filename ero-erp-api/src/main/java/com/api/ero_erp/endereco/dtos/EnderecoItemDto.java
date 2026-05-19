package com.api.ero_erp.endereco.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EnderecoItemDto(
        @Schema(description = "ID do endereço (null para novos)")
        Long id,

        @Schema(description = "ID do tipo de endereço")
        @NotNull(message = "Tipo de endereço é obrigatório")
        Long tipoEnderecoId,

        @Schema(description = "ID da cidade")
        @NotNull(message = "Cidade é obrigatória")
        Long cidadeId,

        @Schema(description = "CEP sem formatação", example = "90010000")
        @Size(max = 8)
        String cep,

        @Schema(description = "Rua/Logradouro")
        @Size(max = 255)
        String rua,

        @Schema(description = "Número")
        @Size(max = 20)
        String numero,

        @Schema(description = "Bairro")
        @Size(max = 100)
        String bairro,

        @Schema(description = "Complemento")
        @Size(max = 100)
        String complemento,

        @Schema(description = "É o endereço principal?")
        Boolean principal
) {}