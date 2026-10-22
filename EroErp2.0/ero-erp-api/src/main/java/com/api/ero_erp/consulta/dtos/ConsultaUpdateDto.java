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

/**
 * Tudo num PUT só, como a pessoa e os contatos: o compromisso, a observação,
 * o ajuste geral e as listas de itens — cada lista é o <b>estado completo</b>.
 *
 * @param servicos nula não mexe: quem não vê serviços não apaga os que existem
 * @param produtos nula não mexe
 */
public record ConsultaUpdateDto(
        @NotNull(message = "Informe os dados do compromisso")
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
