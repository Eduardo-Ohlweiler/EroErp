package com.api.ero_erp.terapianutricional.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.terapianutricional.dto.SuplementoCreateDto;
import com.api.ero_erp.terapianutricional.dto.SuplementoResponseDto;
import com.api.ero_erp.terapianutricional.dto.SuplementoUpdateDto;
import com.api.ero_erp.terapianutricional.entity.Suplemento;
import com.api.ero_erp.terapianutricional.repository.SuplementoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SuplementoService {

    private final SuplementoRepository repository;
    private final SecurityUtils        securityUtils;

    public SuplementoService(SuplementoRepository repository, SecurityUtils securityUtils) {
        this.repository    = repository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public Page<SuplementoResponseDto> getAll(Pageable pageable, String nome, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, nome, ativo)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<SuplementoResponseDto> findForSelect() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findForSelect(clienteId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public SuplementoResponseDto findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteIdOrGlobal(id, clienteId)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Suplemento não encontrado, verifique!"));
    }

    @Transactional
    public SuplementoResponseDto create(SuplementoCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        Suplemento suplemento = new Suplemento();
        suplemento.setCliente(cliente);
        suplemento.setNome(dto.nome().trim());
        suplemento.setQtdG(dto.qtdG());
        suplemento.setKcal(dto.kcal());
        suplemento.setPtn(dto.ptn());
        suplemento.setCho(dto.cho());
        suplemento.setAcucar(dto.acucar());
        suplemento.setLip(dto.lip());
        suplemento.setSodio(dto.sodio());
        suplemento.setPotassio(dto.potassio());
        suplemento.setFosforo(dto.fosforo());
        suplemento.setFerro(dto.ferro());
        suplemento.setFibras(dto.fibras());
        suplemento.setOsmolaridade(dto.osmolaridade());
        suplemento.setAtivo(dto.ativo() == null || dto.ativo());

        return toDto(repository.save(suplemento));
    }

    @Transactional
    public SuplementoResponseDto update(Long id, SuplementoUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        Suplemento suplemento = repository.findByIdAndClienteIdOrGlobal(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Suplemento não encontrado, verifique!"));

        if (suplemento.getCliente() == null) {
            throw new BadRequestException("Não é possível editar um suplemento global do sistema, verifique!");
        }

        if (dto.nome() != null && !dto.nome().isBlank()) suplemento.setNome(dto.nome().trim());
        if (dto.qtdG() != null)     suplemento.setQtdG(dto.qtdG());
        if (dto.kcal() != null)     suplemento.setKcal(dto.kcal());
        if (dto.ptn() != null)      suplemento.setPtn(dto.ptn());
        if (dto.cho() != null)      suplemento.setCho(dto.cho());
        if (dto.acucar() != null)   suplemento.setAcucar(dto.acucar());
        if (dto.lip() != null)      suplemento.setLip(dto.lip());
        if (dto.sodio() != null)    suplemento.setSodio(dto.sodio());
        if (dto.potassio() != null) suplemento.setPotassio(dto.potassio());
        if (dto.fosforo() != null)  suplemento.setFosforo(dto.fosforo());
        if (dto.ferro() != null)    suplemento.setFerro(dto.ferro());
        if (dto.fibras() != null)   suplemento.setFibras(dto.fibras());
        if (dto.osmolaridade() != null) suplemento.setOsmolaridade(dto.osmolaridade());
        if (dto.ativo() != null)    suplemento.setAtivo(dto.ativo());

        return toDto(repository.save(suplemento));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();

        Suplemento suplemento = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Suplemento não encontrado, verifique!"));

        repository.delete(suplemento);
    }

    private SuplementoResponseDto toDto(Suplemento s) {
        return new SuplementoResponseDto(
                s.getId(),
                s.getNome(),
                s.getQtdG(),
                s.getKcal(),
                s.getPtn(),
                s.getCho(),
                s.getAcucar(),
                s.getLip(),
                s.getSodio(),
                s.getPotassio(),
                s.getFosforo(),
                s.getFerro(),
                s.getFibras(),
                s.getOsmolaridade(),
                s.isAtivo(),
                s.getCliente() == null
        );
    }
}
