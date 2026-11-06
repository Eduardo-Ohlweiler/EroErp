package com.api.ero_api.auth.dtos;

import com.api.ero_api.seguranca.UsuarioAutenticado.Pendencia;
import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.UUID;

/** Quem está logado e o que pode ver — o front monta menu e botões com isto. */
@Schema(description = "Usuário logado")
public record UsuarioLogadoDto(
        UUID id,
        String nome,
        String email,
        Papel papel,
        UUID tenantId,
        String tenantNome,
        String corDestaque,
        @Schema(description = "Superadmin dentro de um contratante") boolean superadminAtuando,
        @Schema(description = "O que precisa resolver antes de usar o sistema") Pendencia pendencia,
        @Schema(description = "Authorities: USUARIOS_LER, USUARIOS_ESCREVER, ações...") List<String> permissoes,
        @Schema(description = "Telas liberadas (códigos do front)") List<String> telas) {
}
