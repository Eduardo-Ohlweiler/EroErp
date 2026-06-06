package com.api.ero_erp.financeiro.pagarcontas.controller;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.financeiro.contapagar.entity.ParcelaContaPagar;
import com.api.ero_erp.financeiro.contapagar.repository.ParcelaContaPagarRepository;
import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import com.api.ero_erp.financeiro.contareceber.repository.ParcelaContaReceberRepository;
import com.api.ero_erp.financeiro.pagarcontas.dtos.EnviarPdfFinanceiroDto;
import com.api.ero_erp.financeiro.pagarcontas.dtos.PagarContasItemDto;
import com.api.ero_erp.whatsapp.service.WhatsappNotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

@RestController
@RequestMapping("/financeiro/pagar-contas")
@Tag(name = "Pagar Contas", description = "Listagem unificada de contas a pagar e receber para quitação")
public class PagarContasController {

    private final ParcelaContaPagarRepository   contaPagarRepo;
    private final ParcelaContaReceberRepository contaReceberRepo;
    private final SecurityUtils                 securityUtils;
    private final WhatsappNotificationService   notificationService;

    public PagarContasController(
            ParcelaContaPagarRepository   contaPagarRepo,
            ParcelaContaReceberRepository contaReceberRepo,
            SecurityUtils                 securityUtils,
            WhatsappNotificationService   notificationService
    ) {
        this.contaPagarRepo    = contaPagarRepo;
        this.contaReceberRepo  = contaReceberRepo;
        this.securityUtils     = securityUtils;
        this.notificationService = notificationService;
    }

    private static String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public List<PagarContasItemDto> listar(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) Long emitenteId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dataVencDe,
            @RequestParam(required = false) String dataVencAte
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        LocalDate de  = (dataVencDe  != null && !dataVencDe.isBlank())  ? LocalDate.parse(dataVencDe)  : null;
        LocalDate ate = (dataVencAte != null && !dataVencAte.isBlank()) ? LocalDate.parse(dataVencAte) : null;
        String statusFiltro = (status != null && !status.isBlank()) ? status : null;

        boolean incluirPagar   = tipo == null || "PAGAR".equalsIgnoreCase(tipo);
        boolean incluirReceber = tipo == null || "RECEBER".equalsIgnoreCase(tipo);

        Stream<PagarContasItemDto> streamPagar = Stream.empty();
        Stream<PagarContasItemDto> streamReceber = Stream.empty();

        if (incluirPagar) {
            List<ParcelaContaPagar> parcelas = contaPagarRepo.findForPagarContas(
                    clienteId, emitenteId, pessoaId, statusFiltro, de, ate);
            streamPagar = parcelas.stream().map(p -> new PagarContasItemDto(
                    "PAGAR",
                    p.getId(),
                    p.getNumeroParcela(),
                    p.getContaPagar().getId(),
                    p.getContaPagar().getDescricao(),
                    p.getContaPagar().getEmitente() != null ? p.getContaPagar().getEmitente().getId()               : null,
                    p.getContaPagar().getEmitente() != null ? p.getContaPagar().getEmitente().getPessoa().getNome() : null,
                    p.getContaPagar().getEmitente() != null ? resolverDoc(p.getContaPagar().getEmitente().getPessoa()) : null,
                    p.getContaPagar().getPessoa().getId(),
                    p.getContaPagar().getPessoa().getNome(),
                    resolverDoc(p.getContaPagar().getPessoa()),
                    p.getDataVencimento() != null ? p.getDataVencimento().toString() : null,
                    p.getValor(),
                    p.getFormaPagamento() != null ? p.getFormaPagamento().getId()   : null,
                    p.getFormaPagamento() != null ? p.getFormaPagamento().getNome() : null,
                    p.getContaFinanceira() != null ? p.getContaFinanceira().getId()   : null,
                    p.getContaFinanceira() != null ? p.getContaFinanceira().getNome() : null,
                    p.getStatus() != null ? p.getStatus().name() : null,
                    p.getDataPagamento() != null ? p.getDataPagamento().toString() : null,
                    p.getValorPago()
            ));
        }

        if (incluirReceber) {
            List<ParcelaContaReceber> parcelas = contaReceberRepo.findForPagarContas(
                    clienteId, emitenteId, pessoaId, statusFiltro, de, ate);
            streamReceber = parcelas.stream().map(p -> new PagarContasItemDto(
                    "RECEBER",
                    p.getId(),
                    p.getNumeroParcela(),
                    p.getContaReceber().getId(),
                    p.getContaReceber().getDescricao(),
                    p.getContaReceber().getEmitente() != null ? p.getContaReceber().getEmitente().getId()               : null,
                    p.getContaReceber().getEmitente() != null ? p.getContaReceber().getEmitente().getPessoa().getNome() : null,
                    p.getContaReceber().getEmitente() != null ? resolverDoc(p.getContaReceber().getEmitente().getPessoa()) : null,
                    p.getContaReceber().getPessoa().getId(),
                    p.getContaReceber().getPessoa().getNome(),
                    resolverDoc(p.getContaReceber().getPessoa()),
                    p.getDataVencimento() != null ? p.getDataVencimento().toString() : null,
                    p.getValor(),
                    p.getFormaPagamento() != null ? p.getFormaPagamento().getId()   : null,
                    p.getFormaPagamento() != null ? p.getFormaPagamento().getNome() : null,
                    p.getContaFinanceira() != null ? p.getContaFinanceira().getId()   : null,
                    p.getContaFinanceira() != null ? p.getContaFinanceira().getNome() : null,
                    p.getStatus() != null ? p.getStatus().name() : null,
                    p.getDataPagamento() != null ? p.getDataPagamento().toString() : null,
                    p.getValorPago()
            ));
        }

        return Stream.concat(streamPagar, streamReceber)
                .sorted((a, b) -> {
                    if (a.dataVencimento() == null) return 1;
                    if (b.dataVencimento() == null) return -1;
                    return a.dataVencimento().compareTo(b.dataVencimento());
                })
                .toList();
    }

    @PostMapping("/enviar-pdf")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<Void> enviarPdf(@RequestBody EnviarPdfFinanceiroDto dto) {
        notificationService.enviarPdfParaCliente(
                dto.pessoaId(),
                securityUtils.getClienteIdLogado(),
                securityUtils.getUsuarioIdLogado(),
                dto.base64(),
                dto.fileName(),
                dto.caption()
        );
        return ResponseEntity.noContent().build();
    }
}
