package com.api.ero_erp.consulta.dtos;

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
 * O corpo da prévia dos totais — o mesmo que se salvaria, sem gravar.
 *
 * @param consultaId a consulta em edição: uma lista nula vale a gravada nela
 *                   (quem não vê serviços ainda vê o total certo)
 * @param filialId   de onde vem o preço sugerido
 */
public record ConsultaCalculoRequestDto(
        UUID consultaId,

        @NotNull(message = "Informe a filial")
        UUID filialId,

        @Size(max = 100, message = "No máximo 100 serviços")
        List<@Valid @NotNull ConsultaServicoItemDto> servicos,

        @Size(max = 100, message = "No máximo 100 produtos")
        List<@Valid @NotNull ConsultaProdutoItemDto> produtos,

        TipoAjuste tipoAjusteGeral,

        TipoCalculo tipoCalculoGeral,

        @Digits(integer = 13, fraction = 2, message = "Ajuste com até 2 casas")
        BigDecimal valorAjusteGeral
) {}
