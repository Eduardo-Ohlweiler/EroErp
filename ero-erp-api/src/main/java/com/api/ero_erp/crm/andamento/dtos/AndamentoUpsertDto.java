package com.api.ero_erp.crm.andamento.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AndamentoUpsertDto(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        Boolean ativo,

        Boolean concluiAtendimento,

        Boolean cancelaAtendimento,

        @Size(max = 20)
        String cor
) {}
