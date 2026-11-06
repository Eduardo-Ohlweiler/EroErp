package com.api.ero_api.usuario.dtos;

import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

/** Usuário como a API devolve. Nunca expõe hash de senha nem segredo 2FA. */
@Schema(description = "Usuário")
public record UsuarioResponseDto(
        UUID id,
        String nome,
        String email,
        Papel papel,
        boolean ativo,
        @Schema(description = "Precisa trocar a senha no próximo acesso") boolean exigirTrocaSenha,
        @Schema(description = "Verificação em duas etapas ligada") boolean doisFatoresAtivo,
        Instant ultimoLoginEm,
        Instant createdAt,
        Instant updatedAt,
        UUID createdBy,
        UUID updatedBy,
        @Schema(description = "Versão, devolvida no PUT") Long version) {
}
