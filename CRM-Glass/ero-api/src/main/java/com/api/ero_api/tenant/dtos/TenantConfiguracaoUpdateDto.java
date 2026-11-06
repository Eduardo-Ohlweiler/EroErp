package com.api.ero_api.tenant.dtos;

import com.api.ero_api.tenant.enums.Fundo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Configuração do contratante (tela "Configuração", só superadmin): aparência e
 * cena exclusiva. Separada do cadastro para um formulário não sobrescrever o outro.
 */
@Schema(description = "Aparência e cena exclusiva do contratante")
public record TenantConfiguracaoUpdateDto(

        @Schema(description = "Aparência que vale para todos os usuários do contratante")
        @NotNull(message = "Aparência é obrigatória")
        @Valid
        AparenciaDto aparencia,

        @Schema(description = "Cena exclusiva vinculada a este contratante (vazio = nenhuma)", example = "null")
        Fundo fundoExclusivo,

        @Schema(description = "Versão do contratante que está sendo editado", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
