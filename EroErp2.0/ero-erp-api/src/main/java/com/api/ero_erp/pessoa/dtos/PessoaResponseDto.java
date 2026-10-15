package com.api.ero_erp.pessoa.dtos;

import com.api.ero_erp.catalogo.dtos.CatalogoSelectDto;
import com.api.ero_erp.contato.dtos.EmailResponseDto;
import com.api.ero_erp.contato.dtos.EnderecoResponseDto;
import com.api.ero_erp.contato.dtos.RedeSocialResponseDto;
import com.api.ero_erp.contato.dtos.TelefoneResponseDto;
import com.api.ero_erp.pessoa.enums.Sexo;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.vinculo.dtos.VinculoResponseDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record PessoaResponseDto(
        UUID id,
        String nome,
        TipoPessoa tipoPessoa,
        LocalDate dataNascimento,
        String cpf,
        String rg,
        Sexo sexo,
        String cnpj,
        String inscricaoEstadual,
        String inscricaoMunicipal,
        String nomeFantasia,
        String razaoSocial,
        String observacao,
        Boolean ativo,
        Set<CatalogoSelectDto> tiposCadastro,
        List<TelefoneResponseDto> telefones,
        List<EmailResponseDto> emails,
        List<RedeSocialResponseDto> redesSociais,
        List<EnderecoResponseDto> enderecos,
        List<VinculoResponseDto> vinculos,
        Instant createdAt,
        Instant updatedAt
) {}
