package com.api.ero_erp.clinica.mapper;

import com.api.ero_erp.clinica.dtos.ConsultaProdutoResponseDto;
import com.api.ero_erp.clinica.dtos.ConsultaResponseDto;
import com.api.ero_erp.clinica.dtos.ConsultaServicoResponseDto;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.ConsultaProduto;
import com.api.ero_erp.clinica.entity.ConsultaServico;
import com.api.ero_erp.clinica.entity.FichaAnamnese;
import com.api.ero_erp.clinica.entity.PacoteContratado;
import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.pessoa.entity.Pessoa;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.math.RoundingMode;
import java.util.List;

public class ConsultaMapper {

    private ConsultaMapper() {}

    private static String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    public static ConsultaResponseDto toDto(
            Consulta consulta,
            List<ConsultaServico>  servicos,
            List<ConsultaProduto>  produtos
    ) {
        PacoteContratado pacote = consulta.getPacote();
        Documento     pacoteDocumento = pacote != null ? pacote.getDocumento()     : null;
        FichaAnamnese pacoteFicha     = pacote != null ? pacote.getFichaAnamnese() : null;

        return new ConsultaResponseDto(
                consulta.getId(),
                consulta.getStatus(),
                consulta.getEmitente().getId(),
                consulta.getEmitente().getPessoa().getNome(),
                resolverDoc(consulta.getEmitente().getPessoa()),
                consulta.getPessoa().getId(),
                consulta.getPessoa().getNome(),
                resolverDoc(consulta.getPessoa()),
                consulta.getCompromisso() != null ? consulta.getCompromisso().getId() : null,
                consulta.getInicio(),
                consulta.getFim(),
                consulta.getObservacao(),
                consulta.getMotivoCancelamento(),
                consulta.getFaturado() != null && consulta.getFaturado(),
                consulta.getContaReceberId(),
                consulta.getConsultaPai() != null ? consulta.getConsultaPai().getId() : null,
                consulta.getPacote() != null ? consulta.getPacote().getId()                : null,
                consulta.getSessao(),
                consulta.getPacote() != null ? consulta.getPacote().getNome()              : null,
                consulta.getPacote() != null ? consulta.getPacote().getQuantidadeSessoes() : null,
                pacoteDocumento != null ? pacoteDocumento.getId() : null,
                buildDocumentoLabel(pacoteDocumento),
                pacoteFicha != null ? pacoteFicha.getId() : null,
                buildFichaDescricao(pacoteFicha),
                servicos.stream().map(ConsultaMapper::toServicoDto).toList(),
                produtos.stream().map(ConsultaMapper::toProdutoDto).toList(),
                consulta.getTipoAjusteGeral(),
                consulta.getTipoCalculoGeral(),
                consulta.getValorAjusteGeral(),
                consulta.getCreatedAt(),
                consulta.getCreatedBy() != null ? consulta.getCreatedBy().getNome() : null,
                consulta.getUpdatedAt(),
                consulta.getUpdatedBy() != null ? consulta.getUpdatedBy().getNome() : null,
                consulta.getFichaAnamnese() != null ? consulta.getFichaAnamnese().getId() : null,
                buildFichaDescricao(consulta.getFichaAnamnese())
        );
    }

    private static String buildFichaDescricao(FichaAnamnese f) {
        if (f == null) return null;
        String data = f.getDataPreenchimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        return f.getTemplate().getNome() + " — " + data;
    }

    private static String buildDocumentoLabel(Documento d) {
        if (d == null) return null;
        return "Contrato #" + d.getId() + " — " + d.getStatus().name();
    }

    public static ConsultaServicoResponseDto toServicoDto(ConsultaServico cs) {
        BigDecimal total = calcTotal(
                cs.getPrecoUnitario(), cs.getQuantidade(),
                cs.getTipoAjuste(), cs.getTipoCalculo(), cs.getValorAjuste()
        );
        return new ConsultaServicoResponseDto(
                cs.getId(),
                cs.getProduto().getId(),
                cs.getProduto().getNome(),
                cs.getQuantidade(),
                cs.getPrecoUnitario(),
                cs.getTipoAjuste(),
                cs.getTipoCalculo(),
                cs.getValorAjuste(),
                total,
                cs.getCreatedAt()
        );
    }

    public static ConsultaProdutoResponseDto toProdutoDto(ConsultaProduto cp) {
        BigDecimal total = calcTotal(
                cp.getPrecoUnitario(), cp.getQuantidade(),
                cp.getTipoAjuste(), cp.getTipoCalculo(), cp.getValorAjuste()
        );
        return new ConsultaProdutoResponseDto(
                cp.getId(),
                cp.getProduto().getId(),
                cp.getProduto().getNome(),
                cp.getEmitente().getId(),
                cp.getEmitente().getPessoa().getNome(),
                cp.getQuantidade(),
                cp.getPrecoUnitario(),
                cp.getTipoAjuste(),
                cp.getTipoCalculo(),
                cp.getValorAjuste(),
                total,
                cp.getCreatedAt()
        );
    }

    public static BigDecimal calcTotal(
            BigDecimal preco, BigDecimal qtd,
            String tipoAjuste, String tipoCalculo, BigDecimal valorAjuste
    ) {
        BigDecimal base = preco.multiply(qtd);
        if (tipoAjuste == null || valorAjuste == null || valorAjuste.compareTo(BigDecimal.ZERO) == 0)
            return base.setScale(2, RoundingMode.HALF_UP);
        BigDecimal ajuste = "PERCENTUAL".equalsIgnoreCase(tipoCalculo)
                ? base.multiply(valorAjuste).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : valorAjuste.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = "DESCONTO".equalsIgnoreCase(tipoAjuste)
                ? base.subtract(ajuste)
                : base.add(ajuste);
        return total.setScale(2, RoundingMode.HALF_UP);
    }
}
