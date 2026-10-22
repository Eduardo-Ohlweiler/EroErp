package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Uma consulta nasce de um dos dois jeitos, nunca dos dois:
 * {@code compromissoId} converte um compromisso aberto da agenda;
 * {@code compromisso} cria o compromisso junto (os campos do PUT da agenda,
 * sem recorrência).
 *
 * @param servicos nula não mexe; enviada sem acesso a Serviços é 403
 * @param produtos nula não mexe; enviada sem acesso a Produtos é 403
 */
public record ConsultaCreateDto(
        UUID compromissoId,

        @Valid
        CompromissoUpdateDto compromisso,

        @Size(max = 2000, message = "Observação aceita até 2000 caracteres")
        String observacao,

        @Size(max = 100, message = "No máximo 100 serviços")
        List<@Valid @NotNull ConsultaServicoItemDto> servicos,

        @Size(max = 100, message = "No máximo 100 produtos")
        List<@Valid @NotNull ConsultaProdutoItemDto> produtos,

        TipoAjuste tipoAjusteGeral,

        TipoCalculo tipoCalculoGeral,

        @Digits(integer = 13, fraction = 2, message = "Ajuste com até 2 casas")
        BigDecimal valorAjusteGeral
) {}
