package com.api.ero_erp.crm.atendimento.dtos;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload para iniciar (proativamente) um atendimento a partir do Kanban.
 * O número deve conter apenas dígitos com DDI (ex.: 5551999998888); o front normaliza
 * e o service normaliza novamente por segurança. A pessoa é opcional — quando informada,
 * o atendimento já nasce vinculado a ela.
 */
public record IniciarAtendimentoDto(
        @NotBlank(message = "numero é obrigatório")
        String numero,
        Long pessoaId
) {}
