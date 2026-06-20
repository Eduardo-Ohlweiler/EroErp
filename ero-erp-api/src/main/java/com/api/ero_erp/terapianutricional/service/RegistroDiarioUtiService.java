package com.api.ero_erp.terapianutricional.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiCreateDto;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiResponseDto;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiSummaryDto;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiUpdateDto;
import com.api.ero_erp.terapianutricional.entity.RegistroDiarioUti;
import com.api.ero_erp.terapianutricional.repository.RegistroDiarioUtiRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class RegistroDiarioUtiService {

    private final RegistroDiarioUtiRepository repository;
    private final PessoaService               pessoaService;
    private final SecurityUtils               securityUtils;

    public RegistroDiarioUtiService(
            RegistroDiarioUtiRepository repository,
            PessoaService               pessoaService,
            SecurityUtils               securityUtils
    ) {
        this.repository    = repository;
        this.pessoaService = pessoaService;
        this.securityUtils = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<RegistroDiarioUtiSummaryDto> getAll(
            Pageable  pageable,
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, dataInicio, dataFim)
                .map(this::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public List<RegistroDiarioUtiResponseDto> export(
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository
                .findAllWithFilters(Pageable.unpaged(), clienteId, pessoaId, dataInicio, dataFim)
                .stream()
                .sorted((a, b) -> b.getData().compareTo(a.getData()))
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RegistroDiarioUtiResponseDto findByIdResponse(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        RegistroDiarioUti registro = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Registro diário não encontrado, verifique!"));
        return toResponseDto(registro);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public RegistroDiarioUtiResponseDto create(RegistroDiarioUtiCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());

        RegistroDiarioUti r = new RegistroDiarioUti();
        r.setCliente(cliente);
        r.setPessoa(pessoa);
        r.setData(dto.data());

        // Ficha clínica
        r.setDieta(dto.dieta());
        r.setHgt(dto.hgt());
        r.setVmO2(dto.vmO2());
        r.setPa(dto.pa());

        // Laboratório
        r.setMg(dto.mg());
        r.setK(dto.k());
        r.setNa(dto.na());
        r.setLact(dto.lact());
        r.setPcr(dto.pcr());
        r.setPh(dto.ph());
        r.setPco2(dto.pco2());
        r.setHco3(dto.hco3());

        // Balanço / eliminações
        r.setBh(dto.bh());
        r.setDiurese(dto.diurese());
        r.setEvacuacao(dto.evacuacao());

        // TNE prescrito x infundido
        r.setPercRecebidoNe(dto.percRecebidoNe());
        r.setVolPrescrito24h(dto.volPrescrito24h());
        r.setVolRecebido24h(dto.volRecebido24h());

        // Controle de ingestão oral
        r.setCafeManha(dto.cafeManha());
        r.setLancheManha(dto.lancheManha());
        r.setAlmoco(dto.almoco());
        r.setLancheTarde(dto.lancheTarde());
        r.setJantar(dto.jantar());
        r.setCeia(dto.ceia());

        r.setObservacao(dto.observacao());

        return toResponseDto(repository.save(r));
    }

    @Transactional
    public RegistroDiarioUtiResponseDto update(Long id, RegistroDiarioUtiUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        RegistroDiarioUti r = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Registro diário não encontrado, verifique!"));

        if (dto.pessoaId() != null) r.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.data() != null)     r.setData(dto.data());

        // Ficha clínica
        if (dto.dieta() != null)     r.setDieta(dto.dieta());
        if (dto.hgt() != null)       r.setHgt(dto.hgt());
        if (dto.vmO2() != null)      r.setVmO2(dto.vmO2());
        if (dto.pa() != null)        r.setPa(dto.pa());

        // Laboratório
        if (dto.mg() != null)        r.setMg(dto.mg());
        if (dto.k() != null)         r.setK(dto.k());
        if (dto.na() != null)        r.setNa(dto.na());
        if (dto.lact() != null)      r.setLact(dto.lact());
        if (dto.pcr() != null)       r.setPcr(dto.pcr());
        if (dto.ph() != null)        r.setPh(dto.ph());
        if (dto.pco2() != null)      r.setPco2(dto.pco2());
        if (dto.hco3() != null)      r.setHco3(dto.hco3());

        // Balanço / eliminações
        if (dto.bh() != null)        r.setBh(dto.bh());
        if (dto.diurese() != null)   r.setDiurese(dto.diurese());
        if (dto.evacuacao() != null) r.setEvacuacao(dto.evacuacao());

        // TNE prescrito x infundido
        if (dto.percRecebidoNe() != null)  r.setPercRecebidoNe(dto.percRecebidoNe());
        if (dto.volPrescrito24h() != null) r.setVolPrescrito24h(dto.volPrescrito24h());
        if (dto.volRecebido24h() != null)  r.setVolRecebido24h(dto.volRecebido24h());

        // Controle de ingestão oral
        if (dto.cafeManha() != null)   r.setCafeManha(dto.cafeManha());
        if (dto.lancheManha() != null) r.setLancheManha(dto.lancheManha());
        if (dto.almoco() != null)      r.setAlmoco(dto.almoco());
        if (dto.lancheTarde() != null) r.setLancheTarde(dto.lancheTarde());
        if (dto.jantar() != null)      r.setJantar(dto.jantar());
        if (dto.ceia() != null)        r.setCeia(dto.ceia());

        if (dto.observacao() != null)  r.setObservacao(dto.observacao());

        return toResponseDto(repository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        RegistroDiarioUti r = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Registro diário não encontrado, verifique!"));
        repository.delete(r);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /** percRecebido = volRecebido24h * 100 / volPrescrito24h quando volPrescrito24h > 0; senão null. */
    private BigDecimal calcPercRecebido(RegistroDiarioUti r) {
        BigDecimal prescrito = r.getVolPrescrito24h();
        BigDecimal recebido  = r.getVolRecebido24h();
        if (prescrito == null || recebido == null || prescrito.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return recebido.multiply(BigDecimal.valueOf(100))
                .divide(prescrito, 2, RoundingMode.HALF_UP);
    }

    private RegistroDiarioUtiResponseDto toResponseDto(RegistroDiarioUti r) {
        return new RegistroDiarioUtiResponseDto(
                r.getId(),
                r.getPessoa().getId(),
                r.getPessoa().getNome(),
                r.getData(),
                r.getDieta(),
                r.getHgt(),
                r.getVmO2(),
                r.getPa(),
                r.getMg(),
                r.getK(),
                r.getNa(),
                r.getLact(),
                r.getPcr(),
                r.getPh(),
                r.getPco2(),
                r.getHco3(),
                r.getBh(),
                r.getDiurese(),
                r.getEvacuacao(),
                r.getPercRecebidoNe(),
                r.getVolPrescrito24h(),
                r.getVolRecebido24h(),
                calcPercRecebido(r),
                r.getCafeManha(),
                r.getLancheManha(),
                r.getAlmoco(),
                r.getLancheTarde(),
                r.getJantar(),
                r.getCeia(),
                r.getObservacao(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }

    private RegistroDiarioUtiSummaryDto toSummaryDto(RegistroDiarioUti r) {
        return new RegistroDiarioUtiSummaryDto(
                r.getId(),
                r.getPessoa().getId(),
                r.getPessoa().getNome(),
                r.getData(),
                r.getDieta(),
                r.getPercRecebidoNe(),
                r.getVolPrescrito24h(),
                r.getVolRecebido24h(),
                calcPercRecebido(r)
        );
    }
}
