package com.api.ero_erp.permissao.dtos;

import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import jakarta.validation.constraints.NotNull;

/** Uma tela e o nível dela. Tela sem acesso não vem na lista. */
public record PermissaoDto(

        @NotNull(message = "Informe a tela")
        Tela tela,

        @NotNull(message = "Informe o nível de acesso da tela")
        NivelAcesso nivel
) {}
