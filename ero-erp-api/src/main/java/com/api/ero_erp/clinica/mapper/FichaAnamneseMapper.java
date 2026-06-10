package com.api.ero_erp.clinica.mapper;

import com.api.ero_erp.clinica.dto.FichaAnamneseResponseDto;
import com.api.ero_erp.clinica.dto.FichaAnamnesesSummaryDto;
import com.api.ero_erp.clinica.dto.RespostaAnamneseResponseDto;
import com.api.ero_erp.clinica.entity.FichaAnamnese;
import com.api.ero_erp.pessoa.entity.Pessoa;

import java.util.List;

public class FichaAnamneseMapper {

    private FichaAnamneseMapper() {}

    private static String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    public static FichaAnamneseResponseDto toResponseDto(
            FichaAnamnese f,
            List<RespostaAnamneseResponseDto> respostas
    ) {
        return new FichaAnamneseResponseDto(
                f.getId(),
                f.getTemplate().getId(),
                f.getTemplate().getNome(),
                f.getTemplate().getFinalidade().name(),
                f.getPessoa().getId(),
                f.getPessoa().getNome(),
                resolverDoc(f.getPessoa()),
                f.getEmitente() != null ? f.getEmitente().getId()                   : null,
                f.getEmitente() != null ? f.getEmitente().getPessoa().getNome()     : null,
                f.getDataPreenchimento(),
                f.getObservacoes(),
                respostas,
                f.getCreatedAt(),
                null   // createdByNome resolvido no service se necessário
        );
    }

    public static FichaAnamnesesSummaryDto toSummaryDto(FichaAnamnese f) {
        return new FichaAnamnesesSummaryDto(
                f.getId(),
                f.getPessoa().getId(),
                f.getPessoa().getNome(),
                f.getTemplate().getFinalidade().name(),
                f.getTemplate().getNome(),
                f.getDataPreenchimento(),
                f.getEmitente() != null ? f.getEmitente().getPessoa().getNome() : null
        );
    }
}
