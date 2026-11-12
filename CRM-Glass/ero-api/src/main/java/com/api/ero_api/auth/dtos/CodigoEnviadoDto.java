package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/** Código de verificação enviado (ou reenviado) por e-mail. O código em si nunca volta na resposta. */
@Schema(description = "Situação do código enviado por e-mail")
public record CodigoEnviadoDto(
        @Schema(description = "Para onde o código foi enviado, mascarado", example = "m*****@e*****.com.br") String emailMascarado,
        @Schema(description = "Quando o código deixa de valer (não muda no reenvio)") Instant codigoExpiraEm,
        @Schema(description = "A partir de quando dá para pedir outro reenvio") Instant reenvioDisponivelEm) {
}
