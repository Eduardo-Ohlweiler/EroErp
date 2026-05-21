package com.api.ero_erp.emitente.dtos;


import com.api.ero_erp.emitente.enums.TipoEmitente;

import java.time.LocalDateTime;

public record EmitenteResponseDto(

        Long            id,
        Long            clienteId,

        Long            pessoaId,
        String          pessoaNome,
        String          pessoaDocumento,   // CPF ou CNPJ dependendo do tipo_pessoa

        TipoEmitente tipo,

        Long            pessoaMatrizId,
        String          pessoaMatrizNome,

        String          cor,
        Boolean         bloqueado,

        LocalDateTime   createdAt,
        LocalDateTime   updatedAt
) {}
