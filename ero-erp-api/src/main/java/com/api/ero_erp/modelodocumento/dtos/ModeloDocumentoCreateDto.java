package com.api.ero_erp.modelodocumento.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ModeloDocumentoCreateDto(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
        String descricao,

        @NotBlank(message = "Conteúdo é obrigatório")
        String conteudo,

        Boolean ativo

) {}
