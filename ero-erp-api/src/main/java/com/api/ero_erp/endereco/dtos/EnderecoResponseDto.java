package com.api.ero_erp.endereco.dtos;

import java.time.LocalDateTime;

public record EnderecoResponseDto(
        Long   id,
        Long   pessoaId,
        Long   tipoEnderecoId,
        String tipoEnderecoNome,
        Long   cidadeId,
        String cidadeNome,
        Long   estadoId,
        String estadoNome,
        String estadoSigla,
        String cep,
        String rua,
        String numero,
        String bairro,
        String complemento,
        Boolean       principal,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}