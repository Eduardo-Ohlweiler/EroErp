package com.api.ero_api.servico.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Serviço para combo ("código · nome"). O {@code /selecao} é aberto a quem está logado:
 * nunca leva preço (nem duração; nascem com o primeiro consumidor que precisar).
 */
@Schema(description = "Serviço para seleção")
public record ServicoSelectDto(
        UUID id,
        @Schema(example = "1") Long codServico,
        @Schema(example = "Instalação de ar-condicionado") String nome) {
}
