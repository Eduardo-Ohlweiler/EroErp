package com.api.ero_api.servico.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Edição completa (PUT). {@code version} é a versão que o usuário viu; se alguém salvou
 * antes (inclusive só as filiais), dá 409. A situação não muda aqui: é pelo inativar/ativar.
 * {@code valores} é obrigatório: um PUT sem a lista não apaga as filiais em silêncio.
 */
@Schema(description = "Dados para alterar um serviço")
public record ServicoUpdateDto(

        @Schema(description = "Nome (único no contratante, sem diferenciar maiúsculas nem acento)", example = "Instalação de ar-condicionado")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "Categoria (/api/categorias-servico/selecao); opcional. Inativa só se já era a deste serviço")
        UUID categoriaId,

        @Schema(description = "Duração em minutos, de 1 a 1440; opcional", example = "90")
        @Min(value = 1, message = "Duração deve ser de 1 a 1440 minutos")
        @Max(value = 1440, message = "Duração deve ser de 1 a 1440 minutos")
        Integer duracaoMinutos,

        @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
        String descricao,

        @Schema(description = "Filiais onde o serviço é prestado, cada uma com o seu preço (opcional). Estado completo: substitui a lista anterior")
        @NotEmpty(message = "Informe pelo menos uma filial onde o serviço é prestado.")
        @Size(max = 100, message = "No máximo 100 filiais")
        List<@NotNull(message = "Filial vazia") @Valid ServicoFilialItemDto> valores,

        @Schema(description = "Versão do registro que está sendo editado", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
