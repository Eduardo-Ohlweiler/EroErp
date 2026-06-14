package com.api.ero_erp.modelodocumento.dtos;

import jakarta.validation.constraints.Size;

public record ModeloDocumentoUpdateDto(

        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
        String descricao,

        String conteudo,

        Boolean ativo

) {}
