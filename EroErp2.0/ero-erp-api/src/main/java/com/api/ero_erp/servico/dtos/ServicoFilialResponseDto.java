package com.api.ero_erp.servico.dtos;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * @param filialAtiva a filial pode ter sido inativada depois; a linha fica
 *                    e a tela a sinaliza
 * @param valor       {@code null} quando não informado
 */
public record ServicoFilialResponseDto(
        UUID filialId,
        String filialNome,
        String filialCor,
        Boolean filialAtiva,
        BigDecimal valor
) {}
