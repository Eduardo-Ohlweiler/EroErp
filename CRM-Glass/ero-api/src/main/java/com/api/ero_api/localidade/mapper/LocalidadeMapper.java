package com.api.ero_api.localidade.mapper;

import com.api.ero_api.localidade.dtos.CepResponseDto;
import com.api.ero_api.localidade.dtos.CidadeSelectDto;
import com.api.ero_api.localidade.dtos.EstadoSelectDto;
import com.api.ero_api.localidade.dtos.ViaCepRespostaDto;
import com.api.ero_api.localidade.entity.Cidade;
import com.api.ero_api.localidade.entity.Estado;

/** Conversão entidade ↔ DTO de estado, cidade e CEP, à mão e sem regra de negócio. */
public final class LocalidadeMapper {

    private LocalidadeMapper() {
    }

    /** O estado precisa ter vindo junto ({@code JOIN FETCH c.estado}). */
    public static CidadeSelectDto toSelectDto(Cidade c) {
        return new CidadeSelectDto(c.getId(), c.getNome(), c.getEstado().getSigla());
    }

    public static EstadoSelectDto toEstadoSelectDto(Estado e) {
        return new EstadoSelectDto(e.getId(), e.getSigla(), e.getNome());
    }

    /**
     * {@code cidade} nula quando o ViaCEP não mandou o código do IBGE ou ele não está na
     * base: a tela deixa o usuário escolher. Logradouro vazio = CEP único da cidade.
     */
    public static CepResponseDto toCepResponseDto(String cep, Cidade cidade, ViaCepRespostaDto via) {
        String rua = vazioParaNulo(via.logradouro());
        return new CepResponseDto(
                cep,
                cidade == null ? null : toSelectDto(cidade),
                rua,
                vazioParaNulo(via.bairro()),
                rua == null);
    }

    private static String vazioParaNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
