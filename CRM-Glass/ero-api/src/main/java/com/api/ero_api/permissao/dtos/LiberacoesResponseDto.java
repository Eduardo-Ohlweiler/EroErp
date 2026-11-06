package com.api.ero_api.permissao.dtos;

import com.api.ero_api.permissao.enums.Acao;
import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Schema(description = "Liberações de um usuário")
public record LiberacoesResponseDto(
        UUID usuarioId,
        @Schema(description = "ADMIN/SUPERADMIN têm acesso a tudo, independente da lista") Papel papel,
        List<LiberacaoItemDto> liberacoes,
        Set<Acao> acoes,
        @Schema(description = "Versão do usuário; devolva no PUT") Long version) {
}
