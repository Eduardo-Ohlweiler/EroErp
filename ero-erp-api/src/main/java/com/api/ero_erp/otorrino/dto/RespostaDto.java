package com.api.ero_erp.otorrino.dto;

import jakarta.validation.constraints.NotNull;

public record RespostaDto(

        @NotNull(message = "Item é obrigatório")
        Long itemId,

        @NotNull(message = "Valor é obrigatório")
        Integer valor

) {}
