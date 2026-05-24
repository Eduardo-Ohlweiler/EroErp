package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.TipoRecorrencia;

import java.time.LocalDateTime;

public record CompromissoResponseDto(
        Long            id,
        String          titulo,
        String          descricao,
        String          cor,
        LocalDateTime   inicio,
        LocalDateTime   fim,
        Boolean         cancelado,
        Boolean         concluido,
        String          motivoCancelamento,
        Boolean         recorrenciaSimNao,
        TipoRecorrencia tipoRecorrencia,
        Integer         quantidadeRecorrencia,
        Long            compromissoPaiId,

        // Emitente (empresa) — opcional
        Long            emitenteId,
        String          emitenteNome,

        // Usuário responsável
        Long            usuarioId,
        String          usuarioNome,

        // Pessoa vinculada — opcional
        Long            pessoaId,
        String          pessoaNome,

        // Auditoria
        LocalDateTime   createdAt,
        Long            createdById,
        String          createdByNome,
        LocalDateTime   updatedAt,
        Long            updatedById,
        String          updatedByNome
) {}
