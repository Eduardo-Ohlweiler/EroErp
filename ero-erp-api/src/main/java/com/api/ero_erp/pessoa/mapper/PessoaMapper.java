package com.api.ero_erp.pessoa.mapper;

import com.api.ero_erp.email.mapper.EmailMapper;
import com.api.ero_erp.pessoa.dtos.PessoaResponseDto;
import com.api.ero_erp.pessoa.dtos.PessoaSelectDto;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.redesocial.mapper.RedeSocialMapper;
import com.api.ero_erp.telefone.mapper.TelefoneMapper;
import com.api.ero_erp.tipocadastro.mapper.TipoCadastroMapper;

import java.util.List;

public class PessoaMapper {

    private PessoaMapper() {}

    public static PessoaResponseDto toDto(Pessoa pessoa) {
        return new PessoaResponseDto(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getTipoPessoa(),
                pessoa.getDataNascimento(),
                pessoa.getCpf(),
                pessoa.getRg(),
                pessoa.getCnh(),
                pessoa.getCnhCategoria(),
                pessoa.getCnhValidade(),
                pessoa.getCnpj(),
                pessoa.getInscricaoEstadual(),
                pessoa.getInscricaoMunicipal(),
                pessoa.getNomeFantasia(),
                pessoa.getRazaoSocial(),
                pessoa.getAtivo(),
                TipoCadastroMapper.toDtoSet(pessoa.getTiposCadastro()),
                pessoa.getCreatedAt(),
                pessoa.getCreatedBy() != null ? pessoa.getCreatedBy().getId()   : null,
                pessoa.getCreatedBy() != null ? pessoa.getCreatedBy().getNome() : null,
                pessoa.getUpdatedAt(),
                pessoa.getUpdatedBy() != null ? pessoa.getUpdatedBy().getId()   : null,
                pessoa.getUpdatedBy() != null ? pessoa.getUpdatedBy().getNome() : null,
                pessoa.getEmails() != null
                        ? EmailMapper.toDtoList(pessoa.getEmails())
                        : List.of(),
                pessoa.getTelefones() != null
                        ? TelefoneMapper.toDtoList(pessoa.getTelefones())
                        : List.of(),
                pessoa.getRedesSociais() != null
                        ? RedeSocialMapper.toDtoList(pessoa.getRedesSociais())
                        : List.of()
        );
    }

    public static PessoaSelectDto toSelectDto(Pessoa p) {
        return new PessoaSelectDto(
                p.getId(),
                p.getNome(),
                p.getTipoPessoa(),
                p.getCpf(),
                p.getCnpj()
        );
    }
}