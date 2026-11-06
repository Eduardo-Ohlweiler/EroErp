package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

/** O front mostra o QR code da {@code uri} (ou o segredo para digitar). */
@Schema(description = "Dados para cadastrar no app autenticador")
public record DoisFatoresConfiguracaoDto(
        @Schema(description = "Segredo em Base32") String segredo,
        @Schema(description = "otpauth://totp/... para gerar o QR code") String uri) {

    @Override
    public String toString() {
        return "DoisFatoresConfiguracaoDto[***]";
    }
}
