package com.api.ero_api.filial.dtos;

import com.api.ero_api.filial.enums.TipoFilial;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

/**
 * Filial como a API devolve (lista, exportação, GET por id, criar, alterar): é pequena e
 * não há dado que só um dos usos precise. A pessoa e a matriz vêm como DTOs próprios.
 * Auditoria com nome, como no {@code UsuarioResponseDto}.
 */
@Schema(description = "Filial")
public record FilialResponseDto(
        UUID id,
        @Schema(description = "Código por contratante (gerado)", example = "1") Long codFilial,
        TipoFilial tipo,
        FilialPessoaDto pessoa,
        @Schema(description = "A matriz desta filial (nula na matriz)") FilialSelectDto matriz,
        @Schema(description = "#RRGGBB", example = "#3B82F6") String cor,
        boolean ativo,
        Instant createdAt,
        Instant updatedAt,
        @Schema(description = "Quem cadastrou (vazio dentro do contratante quando foi o suporte da plataforma)") UUID createdBy,
        @Schema(description = "Quem fez a última alteração (vazio dentro do contratante quando foi o suporte da plataforma)") UUID updatedBy,
        @Schema(description = "Nome de quem cadastrou (vazio = sem autor visível daqui)") String criadoPorNome,
        @Schema(description = "Nome de quem fez a última alteração (vazio = sem autor visível daqui)") String alteradoPorNome,
        @Schema(description = "Versão, devolvida no PUT") Long version) {

    /** O documento da pessoa é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "FilialResponseDto[id=" + id + ", codFilial=" + codFilial + ", version=" + version + "]";
    }
}
