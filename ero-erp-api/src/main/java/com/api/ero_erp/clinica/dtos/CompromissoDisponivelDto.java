package com.api.ero_erp.clinica.dtos;

import java.time.LocalDateTime;

/**
 * Compromisso da agenda disponível para ser vinculado a uma consulta
 * (não cancelado, não concluído, futuro e ainda sem consulta atrelada).
 */
public record CompromissoDisponivelDto(
        Long          id,
        String        titulo,
        LocalDateTime inicio,
        LocalDateTime fim,
        String        pessoaNome,
        String        pessoaDocumento
) {}
