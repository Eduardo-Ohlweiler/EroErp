package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

/**
 * Tipo de cadastro como a API devolve (linha da grade da FormList, que já traz a
 * {@code version} para editar). Dentro de um contratante, quando quem cadastrou ou
 * alterou foi o superadmin, o id e o nome dele não saem, como no usuário.
 */
@Schema(description = "Tipo de cadastro")
public record TipoCadastroResponseDto(
        UUID id,
        @Schema(description = "Código no contratante (os do sistema são 1..N)", example = "6") Long codTipoCadastro,
        String nome,
        @Schema(description = "Item do sistema: pré-cadastrado, não se edita nem se inativa") boolean sistema,
        boolean ativo,
        Instant createdAt,
        Instant updatedAt,
        @Schema(description = "Quem cadastrou (vazio dentro do contratante quando foi o suporte da plataforma ou a semente)") UUID createdBy,
        @Schema(description = "Quem fez a última alteração (vazio dentro do contratante quando foi o suporte da plataforma)") UUID updatedBy,
        @Schema(description = "Nome de quem cadastrou (vazio = sem autor visível daqui)") String criadoPorNome,
        @Schema(description = "Nome de quem fez a última alteração (vazio = sem autor visível daqui)") String alteradoPorNome,
        @Schema(description = "Versão, devolvida no PUT") Long version) {
}
