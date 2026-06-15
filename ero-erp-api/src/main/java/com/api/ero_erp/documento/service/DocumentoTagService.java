package com.api.ero_erp.documento.service;

import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.produto.entity.Produto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;

@Service
public class DocumentoTagService {

    private static final DateTimeFormatter FMT_DATA  = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_HORA  = DateTimeFormatter.ofPattern("HH:mm");

    public String processarTags(String htmlConteudo, Documento doc) {
        if (htmlConteudo == null) return "";

        String dataAtual      = LocalDate.now().format(FMT_DATA);
        String horaAtual      = LocalTime.now().format(FMT_HORA);
        String dataHoraAtual  = dataAtual + " " + horaAtual;

        Pessoa clientePessoa = doc.getClientePessoa();
        Pessoa emitentePessoa = doc.getEmitente().getPessoa();
        Estoque estoque = doc.getEstoque();
        Produto produto = estoque != null ? estoque.getProduto() : null;

        String result = htmlConteudo

                // ── Sistema ──────────────────────────────────────────────────
                .replace("[data_atual]",      dataAtual)
                .replace("[hora_atual]",      horaAtual)
                .replace("[data_hora_atual]", dataHoraAtual)

                // ── Contrato ─────────────────────────────────────────────────
                .replace("[contrato_numero]",          String.valueOf(doc.getId()))
                .replace("[contrato_data_emissao]",    doc.getDataEmissao().format(FMT_DATA))
                .replace("[contrato_valor]",           formatarMoeda(doc.getValor()))
                .replace("[contrato_desconto]",        formatarMoeda(doc.getDesconto()))
                .replace("[contrato_acrescimo]",       formatarMoeda(doc.getAcrescimo()))
                .replace("[contrato_valor_final]",     formatarMoeda(doc.getValorFinal()))
                .replace("[contrato_numero_parcelas]", String.valueOf(doc.getNumeroParcelas()))

                // ── Cliente (Pessoa) ──────────────────────────────────────────
                .replace("[cliente_pessoa_nome]",               Objects.toString(clientePessoa.getNome(), ""))
                .replace("[cliente_pessoa_cpf]",                Objects.toString(clientePessoa.getCpf(), ""))
                .replace("[cliente_pessoa_cnpj]",               Objects.toString(clientePessoa.getCnpj(), ""))
                .replace("[cliente_pessoa_cpf_cnpj]",           cpfCnpj(clientePessoa))
                .replace("[cliente_pessoa_rg]",                 Objects.toString(clientePessoa.getRg(), ""))
                .replace("[cliente_pessoa_razao_social]",       Objects.toString(clientePessoa.getRazaoSocial(), ""))
                .replace("[cliente_pessoa_nome_fantasia]",      Objects.toString(clientePessoa.getNomeFantasia(), ""))
                .replace("[cliente_pessoa_inscricao_estadual]", Objects.toString(clientePessoa.getInscricaoEstadual(), ""))
                .replace("[cliente_pessoa_inscricao_municipal]",Objects.toString(clientePessoa.getInscricaoMunicipal(), ""))

                // ── Emitente ──────────────────────────────────────────────────
                .replace("[emitente_pessoa_nome]",               Objects.toString(emitentePessoa.getNome(), ""))
                .replace("[emitente_pessoa_cpf_cnpj]",           cpfCnpj(emitentePessoa))
                .replace("[emitente_pessoa_cnpj]",               Objects.toString(emitentePessoa.getCnpj(), ""))
                .replace("[emitente_pessoa_cpf]",                Objects.toString(emitentePessoa.getCpf(), ""))
                .replace("[emitente_pessoa_razao_social]",       Objects.toString(emitentePessoa.getRazaoSocial(), ""))
                .replace("[emitente_pessoa_nome_fantasia]",      Objects.toString(emitentePessoa.getNomeFantasia(), ""))
                .replace("[emitente_pessoa_inscricao_estadual]", Objects.toString(emitentePessoa.getInscricaoEstadual(), ""))

                // ── Produto ───────────────────────────────────────────────────
                .replace("[produto_nome]",           produto != null ? Objects.toString(produto.getNome(), "") : "")
                .replace("[produto_descricao]",      produto != null ? Objects.toString(produto.getDescricao(), "") : "")
                .replace("[produto_codigo]",         produto != null && produto.getCodigo() != null ? String.valueOf(produto.getCodigo()) : "")
                .replace("[produto_unidade_medida]", produto != null && produto.getUnidadeMedida() != null ? Objects.toString(produto.getUnidadeMedida().getSigla(), "") : "")
                .replace("[produto_categoria]",      produto != null && produto.getCategoria() != null ? Objects.toString(produto.getCategoria().getNome(), "") : "")
                .replace("[produto_marca]",          produto != null && produto.getMarca() != null ? Objects.toString(produto.getMarca().getNome(), "") : "")

                // ── Estoque ───────────────────────────────────────────────────
                .replace("[estoque_preco_venda]", estoque != null ? formatarMoeda(estoque.getPrecoVenda()) : "")
                .replace("[estoque_quantidade]",  estoque != null ? estoque.getQuantidade().stripTrailingZeros().toPlainString() : "");

        result = result.replace("[contrato_forma_pagamento]",
                doc.getFormaPagamento() != null ? doc.getFormaPagamento().getNome() : "");

        return result;
    }

    private String formatarMoeda(BigDecimal valor) {
        if (valor == null) return "";
        NumberFormat fmt = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
        return fmt.format(valor);
    }

    private String cpfCnpj(Pessoa pessoa) {
        if (pessoa.getCpf() != null)  return pessoa.getCpf();
        if (pessoa.getCnpj() != null) return pessoa.getCnpj();
        return "";
    }
}
