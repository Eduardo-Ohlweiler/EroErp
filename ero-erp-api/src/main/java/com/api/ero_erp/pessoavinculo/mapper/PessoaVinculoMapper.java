package com.api.ero_erp.pessoavinculo.mapper;

import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoavinculo.dtos.PessoaVinculoResponseDto;
import com.api.ero_erp.pessoavinculo.entity.PessoaVinculo;
import com.api.ero_erp.pessoavinculo.enums.TipoVinculo;

import java.util.ArrayList;
import java.util.List;

public class PessoaVinculoMapper {

    private PessoaVinculoMapper() {}

    /**
     * Monta a lista de vínculos na perspectiva da pessoa informada, juntando as
     * duas coleções inversas. Quando a pessoa é a origem da aresta, o rótulo é o
     * próprio tipo; quando é o destino, o rótulo é o inverso.
     */
    public static List<PessoaVinculoResponseDto> toResponseList(Pessoa pessoa) {
        if (pessoa == null) return List.of();

        List<PessoaVinculoResponseDto> result = new ArrayList<>();

        if (pessoa.getVinculosComoOrigem() != null) {
            for (PessoaVinculo v : pessoa.getVinculosComoOrigem()) {
                result.add(toDto(v, v.getPessoaDestino(), v.getTipo()));
            }
        }

        if (pessoa.getVinculosComoDestino() != null) {
            for (PessoaVinculo v : pessoa.getVinculosComoDestino()) {
                result.add(toDto(v, v.getPessoaOrigem(), v.getTipo().inverso()));
            }
        }

        return result;
    }

    private static PessoaVinculoResponseDto toDto(PessoaVinculo v, Pessoa outra, TipoVinculo tipo) {
        return new PessoaVinculoResponseDto(
                v.getId(),
                outra != null ? outra.getId()   : null,
                outra != null ? outra.getNome() : null,
                outra != null ? outra.getCpf()  : null,
                outra != null ? outra.getCnpj() : null,
                tipo,
                tipo != null ? tipo.getDescricao() : null,
                v.getObservacao(),
                v.getCreatedAt(),
                v.getUpdatedAt()
        );
    }
}
