package com.api.ero_erp.permissao.dtos;

import com.api.ero_erp.permissao.enums.Modulo;
import com.api.ero_erp.permissao.enums.Tela;

import java.util.List;

/** Um módulo e as telas dele, com os rótulos que a tela de usuário mostra. */
public record CatalogoModuloDto(
        Modulo modulo,
        String rotulo,
        List<TelaDto> telas
) {
    public record TelaDto(Tela tela, String rotulo) {}
}
