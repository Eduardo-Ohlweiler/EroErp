package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dto.RefeicaoCreateDto;
import com.api.ero_erp.clinica.dto.RefeicaoResponseDto;
import com.api.ero_erp.clinica.dto.RefeicaoSummaryDto;
import com.api.ero_erp.clinica.entity.Refeicao;
import com.api.ero_erp.clinica.mapper.RefeicaoMapper;
import com.api.ero_erp.clinica.repository.RefeicaoRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RefeicaoService {

    private final RefeicaoRepository refeicaoRepository;
    private final SecurityUtils      securityUtils;

    public RefeicaoService(RefeicaoRepository refeicaoRepository, SecurityUtils securityUtils) {
        this.refeicaoRepository = refeicaoRepository;
        this.securityUtils      = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<RefeicaoSummaryDto> getAll(Pageable pageable, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return refeicaoRepository.findAllWithFilters(pageable, clienteId, nome)
                .map(RefeicaoMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public List<RefeicaoSummaryDto> findAtivas() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return refeicaoRepository.findAtivas(clienteId).stream()
                .map(RefeicaoMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RefeicaoResponseDto findByIdResponse(Long id) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Refeicao refeicao  = refeicaoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Refeição não encontrada, verifique!"));
        return RefeicaoMapper.toResponseDto(refeicao);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public RefeicaoResponseDto create(RefeicaoCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        Refeicao refeicao = new Refeicao();
        refeicao.setCliente(cliente);
        refeicao.setNome(dto.nome());
        refeicao.setDescricao(dto.descricao());

        Refeicao salva = refeicaoRepository.save(refeicao);
        if (dto.ativo() != null) salva.setAtivo(dto.ativo());

        return RefeicaoMapper.toResponseDto(refeicaoRepository.save(salva));
    }

    @Transactional
    public RefeicaoResponseDto update(Long id, RefeicaoCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Refeicao refeicao  = refeicaoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Refeição não encontrada, verifique!"));

        if (dto.nome() != null && !dto.nome().isBlank()) refeicao.setNome(dto.nome());
        if (dto.descricao() != null)                      refeicao.setDescricao(dto.descricao());
        if (dto.ativo() != null)                          refeicao.setAtivo(dto.ativo());

        return RefeicaoMapper.toResponseDto(refeicaoRepository.save(refeicao));
    }

    @Transactional
    public void delete(Long id) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Refeicao refeicao  = refeicaoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Refeição não encontrada, verifique!"));
        refeicaoRepository.delete(refeicao);
    }

    // ── Uso interno ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Refeicao findByIdInterno(Long id, Long clienteId) {
        return refeicaoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Refeição não encontrada, verifique!"));
    }
}
