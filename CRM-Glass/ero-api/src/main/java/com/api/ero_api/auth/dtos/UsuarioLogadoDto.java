package com.api.ero_api.auth.dtos;

import com.api.ero_api.seguranca.UsuarioAutenticado.Pendencia;
import com.api.ero_api.tenant.dtos.AparenciaDto;
import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.UUID;

/** Quem está logado e o que pode ver — o front monta menu, botões e aparência com isto. */
@Schema(description = "Usuário logado")
public record UsuarioLogadoDto(
        UUID id,
        String nome,
        String email,
        Papel papel,
        UUID tenantId,
        String tenantNome,
        @Schema(description = "Aparência do contratante em que está atuando") AparenciaDto aparencia,
        @Schema(description = "Superadmin dentro de um contratante") boolean superadminAtuando,
        @Schema(description = "O que precisa resolver antes de usar o sistema") Pendencia pendencia,
        @Schema(description = "Verificação em duas etapas ligada") boolean doisFatoresAtivo,
        @Schema(description = "2FA exigido: não pode ser desligado") boolean doisFatoresObrigatorio,
        @Schema(description = "Authorities: USUARIOS_LER, USUARIOS_ESCREVER, ações...") List<String> permissoes,
        @Schema(description = "Telas liberadas (códigos do front)") List<String> telas) {
}
