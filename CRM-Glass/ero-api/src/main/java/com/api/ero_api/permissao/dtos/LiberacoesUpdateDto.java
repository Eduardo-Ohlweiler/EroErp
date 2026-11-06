package com.api.ero_api.permissao.dtos;

import com.api.ero_api.permissao.enums.Acao;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;

/** Substitui TODAS as liberações do usuário pelas enviadas (o que não vier, sai). */
@Schema(description = "Liberações completas de um usuário")
public record LiberacoesUpdateDto(
        @Schema(description = "Grupos liberados com o nível")
        @NotNull(message = "Liberações são obrigatórias")
        @Size(max = 100, message = "Liberações demais")
        List<@Valid @NotNull LiberacaoItemDto> liberacoes,

        @Schema(description = "Ações extras concedidas (o grupo de cada uma precisa estar liberado)")
        @NotNull(message = "Ações são obrigatórias")
        @Size(max = 100, message = "Ações demais")
        Set<@NotNull Acao> acoes,

        @Schema(description = "Versão que veio no GET de liberações", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
