package com.api.ero_erp.consulta.mapper;

import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.mapper.CompromissoMapper;
import com.api.ero_erp.consulta.dtos.ConsultaListaDto;
import com.api.ero_erp.consulta.dtos.ConsultaProdutoResponseDto;
import com.api.ero_erp.consulta.dtos.ConsultaResponseDto;
import com.api.ero_erp.consulta.dtos.ConsultaServicoResponseDto;
import com.api.ero_erp.consulta.entity.Consulta;
import com.api.ero_erp.consulta.entity.ConsultaProduto;
import com.api.ero_erp.consulta.entity.ConsultaServico;
import com.api.ero_erp.consulta.service.CalculoConsulta.Resultado;
import com.api.ero_erp.consulta.service.CalculoConsulta.Valores;
import com.api.ero_erp.estoque.entity.Estoque;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ConsultaMapper {

    private ConsultaMapper() {}

    /**
     * @param resultado  a conta dos itens, na ordem de {@code getServicos()} e {@code getProdutos()}
     * @param veServicos sem ela a lista de serviços sai ausente — os totais saem
     * @param linhas     o estoque de cada produto na filial do compromisso, para o saldo
     */
    public static ConsultaResponseDto toResponse(Consulta c, Resultado resultado, boolean veServicos,
                                                 boolean veProdutos, Map<UUID, Estoque> linhas) {
        return new ConsultaResponseDto(
                c.getId(),
                CompromissoMapper.toResponse(c.getCompromisso()),
                c.getObservacao(),
                c.getTipoAjusteGeral(),
                c.getTipoCalculoGeral(),
                c.getValorAjusteGeral(),
                c.getConsultaOrigem() != null ? c.getConsultaOrigem().getId() : null,
                veServicos ? servicos(c.getServicos(), resultado.servicos()) : null,
                veProdutos ? produtos(c.getProdutos(), resultado.produtos(), linhas) : null,
                resultado.subtotalServicos(),
                resultado.subtotalProdutos(),
                resultado.subtotal(),
                resultado.ajusteGeral(),
                resultado.total(),
                c.getCreatedBy() != null ? c.getCreatedBy().getNome() : null,
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    public static ConsultaListaDto toLista(Consulta c, BigDecimal total) {
        Compromisso comp = c.getCompromisso();
        return new ConsultaListaDto(
                c.getId(),
                comp.getId(),
                comp.getTitulo(),
                comp.getInicio(),
                comp.getFim(),
                comp.getStatus(),
                comp.getFilial().getId(),
                comp.getFilial().getPessoa().getNome(),
                comp.corExibicao(),
                comp.getResponsavel().getNome(),
                comp.getPessoa() != null ? comp.getPessoa().getNome() : null,
                total);
    }

    private static List<ConsultaServicoResponseDto> servicos(List<ConsultaServico> itens, List<Valores> valores) {
        List<ConsultaServicoResponseDto> lista = new ArrayList<>();
        for (int i = 0; i < itens.size(); i++) {
            ConsultaServico s = itens.get(i);
            Valores v = valores.get(i);
            lista.add(new ConsultaServicoResponseDto(
                    s.getId(),
                    s.getServico().getId(),
                    s.getServico().getCodigo(),
                    s.getDescricao(),
                    s.getQuantidade(),
                    s.getPrecoUnitario(),
                    s.getTipoAjuste(),
                    s.getTipoCalculo(),
                    s.getValorAjuste(),
                    v.subtotal(),
                    v.ajuste(),
                    v.total()));
        }
        return lista;
    }

    private static List<ConsultaProdutoResponseDto> produtos(List<ConsultaProduto> itens, List<Valores> valores,
                                                            Map<UUID, Estoque> linhas) {
        List<ConsultaProdutoResponseDto> lista = new ArrayList<>();
        for (int i = 0; i < itens.size(); i++) {
            ConsultaProduto p = itens.get(i);
            Valores v = valores.get(i);
            Estoque linha = linhas.get(p.getProduto().getId());
            boolean controla = linha != null && Boolean.TRUE.equals(linha.getControlaEstoque());
            lista.add(new ConsultaProdutoResponseDto(
                    p.getId(),
                    p.getProduto().getId(),
                    p.getProduto().getCodigo(),
                    p.getDescricao(),
                    p.getProduto().getUnidadeMedida().getSigla(),
                    p.getQuantidade(),
                    p.getPrecoUnitario(),
                    p.getTipoAjuste(),
                    p.getTipoCalculo(),
                    p.getValorAjuste(),
                    v.subtotal(),
                    v.ajuste(),
                    v.total(),
                    controla,
                    controla ? linha.getQuantidade() : null));
        }
        return lista;
    }
}
