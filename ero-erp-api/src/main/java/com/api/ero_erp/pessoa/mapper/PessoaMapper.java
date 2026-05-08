package com.api.ero_erp.pessoa.mapper;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pessoa.dtos.PessoaCreateDto;
import com.api.ero_erp.pessoa.dtos.PessoaResponseDto;
import com.api.ero_erp.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.tipocadastro.entity.TipoCadastro;
import com.api.ero_erp.tipocadastro.mapper.TipoCadastroMapper;

import java.util.Set;

public class PessoaMapper {

    private PessoaMapper() {}

    public static Pessoa toEntity(PessoaCreateDto dto, Cliente cliente, Set<TipoCadastro> tiposCadastro) {
        Pessoa pessoa = new Pessoa();

        pessoa.setCliente(cliente);
        pessoa.setNome(dto.nome());
        pessoa.setTipoPessoa(dto.tipoPessoa());
        pessoa.setDataNascimento(dto.dataNascimento());
        pessoa.setCpf(sanitizar(dto.cpf()));
        pessoa.setRg(sanitizar(dto.rg()));
        pessoa.setCnpj(sanitizar(dto.cnpj()));
        pessoa.setInscricaoEstadual(sanitizar(dto.inscricaoEstadual()));
        pessoa.setInscricaoMunicipal(sanitizar(dto.inscricaoMunicipal()));
        pessoa.setNomeFantasia(dto.nomeFantasia());
        pessoa.setRazaoSocial(dto.razaoSocial());

        if (tiposCadastro != null) {
            pessoa.getTiposCadastro().addAll(tiposCadastro);
        }

        return pessoa;
    }

    public static void updateEntity(Pessoa pessoa, PessoaUpdateDto dto, Set<TipoCadastro> tiposCadastro) {
        pessoa.setNome(dto.nome());
        pessoa.setDataNascimento(dto.dataNascimento());
        pessoa.setCpf(sanitizar(dto.cpf()));
        pessoa.setRg(sanitizar(dto.rg()));
        pessoa.setCnpj(sanitizar(dto.cnpj()));
        pessoa.setInscricaoEstadual(sanitizar(dto.inscricaoEstadual()));
        pessoa.setInscricaoMunicipal(sanitizar(dto.inscricaoMunicipal()));
        pessoa.setNomeFantasia(dto.nomeFantasia());
        pessoa.setRazaoSocial(dto.razaoSocial());

        pessoa.getTiposCadastro().clear();
        if (tiposCadastro != null) {
            pessoa.getTiposCadastro().addAll(tiposCadastro);
        }
    }

    public static PessoaResponseDto toDto(Pessoa pessoa) {
        return new PessoaResponseDto(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getTipoPessoa(),
                pessoa.getDataNascimento(),
                pessoa.getCpf(),
                pessoa.getRg(),
                pessoa.getCnpj(),
                pessoa.getInscricaoEstadual(),
                pessoa.getInscricaoMunicipal(),
                pessoa.getNomeFantasia(),
                pessoa.getRazaoSocial(),
                pessoa.getAtivo(),
                TipoCadastroMapper.toDtoSet(pessoa.getTiposCadastro()),
                pessoa.getCreatedAt(),
                pessoa.getUpdatedAt()
        );
    }

    // Remove caracteres não numéricos de documentos antes de persistir
    private static String sanitizar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.replaceAll("\\D", "");
    }
}
