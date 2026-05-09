package com.api.ero_erp.pessoa.dtos;

import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.tipocadastro.dtos.TipoCadastroResponseDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record PessoaResponseDto(
        Long                            id,
        String                          nome,
        TipoPessoa                      tipoPessoa,
        LocalDate                       dataNascimento,
        String                          cpf,
        String                          rg,
        String                          cnh,
        String                          cnhCategoria,
        LocalDate                       cnhValidade,
        String                          cnpj,
        String                          inscricaoEstadual,
        String                          inscricaoMunicipal,
        String                          nomeFantasia,
        String                          razaoSocial,
        Boolean                         ativo,
        Set<TipoCadastroResponseDto>    tiposCadastro,
        LocalDateTime                   createdAt,
        Long                            createdById,
        String                          createdByNome,
        LocalDateTime                   updatedAt,
        Long                            updatedById,
        String                          updatedByNome
) {}