package com.api.ero_erp.dashboard.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.configuracaopendencias.repository.ConfiguracaoPendenciasRepository;
import com.api.ero_erp.dashboard.dtos.PendenciaItemDto;
import com.api.ero_erp.dashboard.dtos.PendenciasFinanceirasDto;
import com.api.ero_erp.financeiro.contapagar.entity.ParcelaContaPagar;
import com.api.ero_erp.financeiro.contapagar.repository.ParcelaContaPagarRepository;
import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import com.api.ero_erp.financeiro.contareceber.repository.ParcelaContaReceberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Slf4j
public class DashboardGeralService {

    private final ParcelaContaPagarRepository parcelaContaPagarRepo;
    private final ParcelaContaReceberRepository parcelaContaReceberRepo;
    private final ConfiguracaoPendenciasRepository configuracaoPendenciasRepo;
    private final SecurityUtils securityUtils;

    public DashboardGeralService(
            ParcelaContaPagarRepository parcelaContaPagarRepo,
            ParcelaContaReceberRepository parcelaContaReceberRepo,
            ConfiguracaoPendenciasRepository configuracaoPendenciasRepo,
            SecurityUtils securityUtils
    ) {
        this.parcelaContaPagarRepo      = parcelaContaPagarRepo;
        this.parcelaContaReceberRepo    = parcelaContaReceberRepo;
        this.configuracaoPendenciasRepo = configuracaoPendenciasRepo;
        this.securityUtils              = securityUtils;
    }

    @Transactional(readOnly = true)
    public PendenciasFinanceirasDto getPendenciasFinanceiras() {
        Long clienteId = securityUtils.getClienteIdLogado();

        int diasAntes = configuracaoPendenciasRepo
                .findByClienteId(clienteId)
                .map(c -> c.getDiasAntes() != null ? c.getDiasAntes() : 0)
                .orElse(0);

        LocalDate hoje        = LocalDate.now();
        LocalDate dataVencAte = hoje.plusDays(diasAntes);
        LocalDate dataInicio  = LocalDate.of(1900, 1, 1);

        List<ParcelaContaPagar> parcelasPagar = parcelaContaPagarRepo
                .findForDashboard(clienteId, "ABERTO", dataInicio, dataVencAte);

        List<ParcelaContaReceber> parcelasReceber = parcelaContaReceberRepo
                .findForDashboard(clienteId, "ABERTO", dataInicio, dataVencAte);

        List<PendenciaItemDto> contasPagar = parcelasPagar.stream()
                .map(p -> {
                    boolean vencida   = p.getDataVencimento().isBefore(hoje);
                    long diasAtraso   = vencida ? ChronoUnit.DAYS.between(p.getDataVencimento(), hoje) : 0L;
                    var emitentePagar = p.getContaPagar().getEmitente();
                    Long emitenteIdPagar = emitentePagar != null ? emitentePagar.getId() : null;
                    String emitenteNomePagar = emitentePagar != null && emitentePagar.getPessoa() != null
                            ? emitentePagar.getPessoa().getNome() : null;
                    return new PendenciaItemDto(
                            p.getId(),
                            p.getContaPagar().getId(),
                            p.getContaPagar().getPessoa().getId(),
                            p.getContaPagar().getPessoa().getNome(),
                            emitenteIdPagar,
                            emitenteNomePagar,
                            p.getContaPagar().getDescricao(),
                            p.getNumeroParcela(),
                            p.getDataVencimento(),
                            p.getValor(),
                            vencida,
                            diasAtraso
                    );
                })
                .toList();

        List<PendenciaItemDto> contasReceber = parcelasReceber.stream()
                .map(p -> {
                    boolean vencida   = p.getDataVencimento().isBefore(hoje);
                    long diasAtraso   = vencida ? ChronoUnit.DAYS.between(p.getDataVencimento(), hoje) : 0L;
                    var emitenteReceber = p.getContaReceber().getEmitente();
                    Long emitenteIdReceber = emitenteReceber != null ? emitenteReceber.getId() : null;
                    String emitenteNomeReceber = emitenteReceber != null && emitenteReceber.getPessoa() != null
                            ? emitenteReceber.getPessoa().getNome() : null;
                    return new PendenciaItemDto(
                            p.getId(),
                            p.getContaReceber().getId(),
                            p.getContaReceber().getPessoa().getId(),
                            p.getContaReceber().getPessoa().getNome(),
                            emitenteIdReceber,
                            emitenteNomeReceber,
                            p.getContaReceber().getDescricao(),
                            p.getNumeroParcela(),
                            p.getDataVencimento(),
                            p.getValor(),
                            vencida,
                            diasAtraso
                    );
                })
                .toList();

        return new PendenciasFinanceirasDto(contasPagar, contasReceber);
    }
}
