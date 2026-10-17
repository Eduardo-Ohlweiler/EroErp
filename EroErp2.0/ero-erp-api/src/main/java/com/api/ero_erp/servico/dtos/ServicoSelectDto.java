package com.api.ero_erp.servico.dtos;

import java.util.UUID;

/**
 * Item de combo. Sem valores: o combo é aberto a qualquer autenticado, e o
 * valor de cada filial é dado do cadastro — o antigo devolvia tudo aqui.
 */
public record ServicoSelectDto(
        UUID id,
        Long codigo,
        String nome
) {}
