package com.api.ero_erp.clinica.mapper;

import com.api.ero_erp.clinica.dtos.ConsultaProdutoResponseDto;
import com.api.ero_erp.clinica.dtos.ConsultaResponseDto;
import com.api.ero_erp.clinica.dtos.ConsultaServicoResponseDto;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.ConsultaProduto;
import com.api.ero_erp.clinica.entity.ConsultaServico;

import java.math.BigDecimal;
import java.util.List;

public class ConsultaMapper {

    private ConsultaMapper() {}

    public static ConsultaResponseDto toDto(
            Consulta consulta,
            List<ConsultaServico>  servicos,
            List<ConsultaProduto>  produtos
    ) {
        return new ConsultaResponseDto(
                consulta.getId(),
                consulta.getStatus(),
                consulta.getEmitente().getId(),
                consulta.getEmitente().getPessoa().getNome(),
                consulta.getPessoa().getId(),
                consulta.getPessoa().getNome(),
                consulta.getCompromisso() != null ? consulta.getCompromisso().getId() : null,
                consulta.getInicio(),
                consulta.getFim(),
                consulta.getObservacao(),
                consulta.getMotivoCancelamento(),
                consulta.getConsultaPai() != null ? consulta.getConsultaPai().getId() : null,
                servicos.stream().map(ConsultaMapper::toServicoDto).toList(),
                produtos.stream().map(ConsultaMapper::toProdutoDto).toList(),
                consulta.getCreatedAt(),
                consulta.getCreatedBy() != null ? consulta.getCreatedBy().getNome() : null,
                consulta.getUpdatedAt(),
                consulta.getUpdatedBy() != null ? consulta.getUpdatedBy().getNome() : null
        );
    }

    public static ConsultaServicoResponseDto toServicoDto(ConsultaServico cs) {
        BigDecimal total = cs.getPrecoUnitario().multiply(cs.getQuantidade());
        return new ConsultaServicoResponseDto(
                cs.getId(),
                cs.getProduto().getId(),
                cs.getProduto().getNome(),
                cs.getQuantidade(),
                cs.getPrecoUnitario(),
                total,
                cs.getCreatedAt()
        );
    }

    public static ConsultaProdutoResponseDto toProdutoDto(ConsultaProduto cp) {
        BigDecimal total = cp.getPrecoUnitario().multiply(cp.getQuantidade());
        return new ConsultaProdutoResponseDto(
                cp.getId(),
                cp.getProduto().getId(),
                cp.getProduto().getNome(),
                cp.getEmitente().getId(),
                cp.getEmitente().getPessoa().getNome(),
                cp.getQuantidade(),
                cp.getPrecoUnitario(),
                total,
                cp.getCreatedAt()
        );
    }
}
