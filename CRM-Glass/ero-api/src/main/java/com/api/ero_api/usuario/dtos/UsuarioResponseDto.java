package com.api.ero_api.usuario.dtos;

import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

/**
 * Usuário como a API devolve. Nunca expõe hash de senha nem código de verificação.
 * Dentro de um contratante, quando quem cadastrou ou alterou foi o superadmin, o id e o
 * nome dele não saem ({@code createdBy}/{@code updatedBy} e os nomes vazios), como na
 * trilha de logs.
 */
@Schema(description = "Usuário")
public record UsuarioResponseDto(
        UUID id,
        String nome,
        String email,
        @Schema(description = "Telefone com DDD, só dígitos (nulo = não informado)") String telefone,
        Papel papel,
        boolean ativo,
        @Schema(description = "Precisa trocar a senha no próximo acesso") boolean exigirTrocaSenha,
        Instant ultimoLoginEm,
        @Schema(description = "Conta bloqueada por excesso de tentativas até este instante (no passado = já liberou)") Instant bloqueadoAte,
        Instant createdAt,
        Instant updatedAt,
        @Schema(description = "Quem cadastrou (vazio dentro do contratante quando foi o suporte da plataforma)") UUID createdBy,
        @Schema(description = "Quem fez a última alteração (vazio dentro do contratante quando foi o suporte da plataforma)") UUID updatedBy,
        @Schema(description = "Nome de quem cadastrou (vazio = sem autor visível daqui)") String criadoPorNome,
        @Schema(description = "Nome de quem fez a última alteração (vazio = sem autor visível daqui)") String alteradoPorNome,
        @Schema(description = "Versão, devolvida no PUT") Long version) {
}
