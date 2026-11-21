package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

/**
 * Categoria de serviço como a API devolve (linha da grade da FormList, que já traz a
 * {@code version} para editar). {@code sistema} é sempre {@code false} (a categoria não
 * tem itens do sistema): fica só pela forma comum dos auxiliares no front. Dentro de um
 * contratante, quando quem cadastrou ou alterou foi o superadmin, o id e o nome dele não
 * saem, como no usuário.
 */
@Schema(description = "Categoria de serviço")
public record CategoriaServicoResponseDto(
        UUID id,
        @Schema(description = "Código no contratante", example = "1") Long codCategoriaServico,
        String nome,
        @Schema(description = "Sempre false: a categoria de serviço não tem itens do sistema") boolean sistema,
        boolean ativo,
        Instant createdAt,
        Instant updatedAt,
        @Schema(description = "Quem cadastrou (vazio dentro do contratante quando foi o suporte da plataforma)") UUID createdBy,
        @Schema(description = "Quem fez a última alteração (vazio dentro do contratante quando foi o suporte da plataforma)") UUID updatedBy,
        @Schema(description = "Nome de quem cadastrou (vazio = sem autor visível daqui)") String criadoPorNome,
        @Schema(description = "Nome de quem fez a última alteração (vazio = sem autor visível daqui)") String alteradoPorNome,
        @Schema(description = "Versão, devolvida no PUT") Long version) {
}
