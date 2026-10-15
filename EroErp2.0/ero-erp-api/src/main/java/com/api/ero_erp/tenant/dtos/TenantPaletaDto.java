package com.api.ero_erp.tenant.dtos;

import com.api.ero_erp.tenant.enums.PaletaSistema;
import jakarta.validation.constraints.NotNull;

/** Define a paleta de cores dos usuários do tenant. */
public record TenantPaletaDto(

        @NotNull(message = "Informe a paleta")
        PaletaSistema paleta
) {}
