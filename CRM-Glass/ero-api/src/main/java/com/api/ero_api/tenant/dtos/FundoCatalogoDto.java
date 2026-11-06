package com.api.ero_api.tenant.dtos;

import com.api.ero_api.tenant.enums.Fundo;
import com.api.ero_api.tenant.enums.TipoFundo;
import io.swagger.v3.oas.annotations.media.Schema;

/** Item do catálogo de fundos para a tela de Configuração do contratante. */
@Schema(description = "Fundo disponível")
public record FundoCatalogoDto(
        @Schema(description = "Código gravado no contratante", example = "MARINA") Fundo codigo,
        @Schema(description = "Nome para mostrar", example = "Marina") String rotulo,
        @Schema(description = "VIVO (desenhado) ou CENA (foto dia/noite)") TipoFundo tipo,
        @Schema(description = "Cena feita para um contratante só") boolean exclusiva) {
}
