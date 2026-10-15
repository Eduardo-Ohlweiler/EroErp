package com.api.ero_erp.tenant.dtos;

import com.api.ero_erp.tenant.enums.PaletaSistema;
import com.api.ero_erp.tenant.enums.PeriodoAcesso;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Abre um tenant pela tela de tenants, sem usuário — os usuários dele vêm
 * depois, em {@code POST /usuarios} com o {@code tenantId}.
 */
public record TenantCreateDto(

        @NotBlank(message = "Informe o nome")
        @Size(max = 255, message = "No máximo 255 caracteres")
        String nome,

        /** Sem valor, {@code INDETERMINADO}. */
        PeriodoAcesso periodoAcesso,

        /** Sem valor, {@code PADRAO}. */
        PaletaSistema paleta
) {}
