package com.api.ero_erp.whatsapp.dtos;

import com.api.ero_erp.whatsapp.enums.ModoWhatsapp;
import jakarta.validation.constraints.NotNull;

public record ModoUpdateDto(
        @NotNull(message = "Modo é obrigatório")
        ModoWhatsapp modo
) {}
