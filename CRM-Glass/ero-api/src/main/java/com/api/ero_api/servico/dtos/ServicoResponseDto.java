package com.api.ero_api.servico.dtos;

import com.api.ero_api.auxiliar.dtos.CategoriaServicoSelectDto;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Serviço como a API devolve (lista, exportação, GET por id, criar, alterar): uma resposta
 * só para todos os usos. A categoria e as filiais vêm como DTOs próprios. Auditoria com
 * nome, como no {@code UsuarioResponseDto}.
 */
@Schema(description = "Serviço")
public record ServicoResponseDto(
        UUID id,
        @Schema(description = "Código por contratante (gerado)", example = "1") Long codServico,
        String nome,
        @Schema(description = "Categoria (nula = sem categoria; ativo = false: inativa, mantida porque já estava gravada)")
        CategoriaServicoSelectDto categoria,
        @Schema(description = "Duração em minutos (nula = não informada)", example = "90") Integer duracaoMinutos,
        String descricao,
        @Schema(description = "Filiais onde o serviço é prestado e o preço em cada uma, por código da filial")
        List<ServicoFilialResponseDto> valores,
        boolean ativo,
        Instant createdAt,
        Instant updatedAt,
        @Schema(description = "Quem cadastrou (vazio dentro do contratante quando foi o suporte da plataforma)") UUID createdBy,
        @Schema(description = "Quem fez a última alteração (vazio dentro do contratante quando foi o suporte da plataforma)") UUID updatedBy,
        @Schema(description = "Nome de quem cadastrou (vazio = sem autor visível daqui)") String criadoPorNome,
        @Schema(description = "Nome de quem fez a última alteração (vazio = sem autor visível daqui)") String alteradoPorNome,
        @Schema(description = "Versão, devolvida no PUT") Long version) {
}
