package com.api.ero_erp.compromisso.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * @param responsavelId quem vai atender; a tela já traz o usuário logado
 * @param convidadoIds  outros usuários do tenant; o responsável não entra
 * @param recorrencia   nula, compromisso único
 * @param ocorrencias   só numa série: as datas como ficaram na prévia, depois
 *                      de editadas ou tiradas. Nula, valem as que o tipo gera
 */
public record CompromissoCreateDto(
        @NotNull(message = "Filial é obrigatória")
        UUID filialId,

        @NotNull(message = "Responsável é obrigatório")
        UUID responsavelId,

        UUID pessoaId,

        @NotBlank(message = "Título é obrigatório")
        @Size(max = 255, message = "Título aceita até 255 caracteres")
        String titulo,

        @Size(max = 2000, message = "Descrição aceita até 2000 caracteres")
        String descricao,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String cor,

        @NotNull(message = "Início é obrigatório")
        Instant inicio,

        @NotNull(message = "Fim é obrigatório")
        Instant fim,

        @Size(max = 20, message = "No máximo 20 convidados")
        List<@NotNull UUID> convidadoIds,

        @Valid
        RecorrenciaDto recorrencia,

        @Size(min = 1, max = 52, message = "A série tem de 1 a 52 datas")
        List<@Valid @NotNull OcorrenciaDto> ocorrencias
) {}
