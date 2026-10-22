package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.compromisso.enums.TipoRecorrencia;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * @param cor          a gravada — vazia quando segue a filial
 * @param corExibicao  a que a tela pinta: a gravada ou, sem ela, a da filial
 * @param consultaId   a consulta feita sobre ele; nulo quando não é consulta
 * @param criadoPorNome quem digitou, que não é necessariamente o responsável
 */
public record CompromissoResponseDto(
        UUID id,
        UUID filialId,
        String filialNome,
        UUID responsavelId,
        String responsavelNome,
        UUID pessoaId,
        String pessoaNome,
        String titulo,
        String descricao,
        String cor,
        String corExibicao,
        Instant inicio,
        Instant fim,
        StatusCompromisso status,
        String motivoCancelamento,
        UUID serieId,
        TipoRecorrencia tipoRecorrencia,
        UUID consultaId,
        List<ConvidadoDto> convidados,
        String criadoPorNome,
        Instant createdAt,
        Instant updatedAt
) {}
