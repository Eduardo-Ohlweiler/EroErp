package com.api.ero_erp.emitente.mapper;

import com.api.ero_erp.emitente.dtos.EmitenteResponseDto;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import org.springframework.stereotype.Component;

@Component
public class EmitenteMapper {

    public EmitenteResponseDto toDTO(Emitente e) {

        Pessoa pessoaMatriz = e.getPessoaMatriz();

        String documento = resolverDocumento(e.getPessoa());

        return new EmitenteResponseDto(
                e.getId(),
                e.getCliente().getId(),

                e.getPessoa().getId(),
                e.getPessoa().getNome(),
                documento,

                e.getTipo(),

                pessoaMatriz != null ? pessoaMatriz.getId()   : null,
                pessoaMatriz != null ? pessoaMatriz.getNome() : null,

                e.getCor(),
                e.getBloqueado(),

                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private String resolverDocumento(Pessoa pessoa) {
        if (pessoa.getCpf() != null && !pessoa.getCpf().isBlank()) {
            return pessoa.getCpf();
        }
        return pessoa.getCnpj();
    }
}