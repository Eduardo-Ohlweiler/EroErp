package com.api.ero_erp.cest.service;

import com.api.ero_erp.cest.dtos.CestCreateDto;
import com.api.ero_erp.cest.dtos.CestResponseDto;
import com.api.ero_erp.cest.dtos.CestUpdateDto;
import com.api.ero_erp.cest.entity.Cest;
import com.api.ero_erp.cest.repository.CestRepository;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.ncm.entity.Ncm;
import com.api.ero_erp.ncm.service.NcmService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CestService {

    private final CestRepository cestRepository;
    private final NcmService     ncmService;

    public CestService(CestRepository cestRepository, NcmService ncmService) {
        this.cestRepository = cestRepository;
        this.ncmService     = ncmService;
    }

    @Transactional(readOnly = true)
    public Cest findById(Long id) {
        return cestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CEST não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<CestResponseDto> getAll(Pageable pageable, Long ncmId, String busca) {
        return cestRepository.findAllWithFilters(pageable, ncmId, busca)
                .map(this::toDto);
    }

    @Transactional
    public CestResponseDto create(CestCreateDto dto) {
        if (cestRepository.existsByCodigo(dto.codigo().trim(), null))
            throw new ConflictException("Já existe um CEST com o código \"" + dto.codigo() + "\"");

        Ncm  ncm  = ncmService.findById(dto.ncmId());
        Cest cest = new Cest();
        cest.setCodigo(dto.codigo().trim());
        cest.setDescricao(dto.descricao());
        cest.setNcm(ncm);

        return toDto(cestRepository.save(cest));
    }

    @Transactional
    public CestResponseDto update(Long id, CestUpdateDto dto) {
        Cest cest = findById(id);

        if (cestRepository.existsByCodigo(dto.codigo().trim(), id))
            throw new ConflictException("Já existe um CEST com o código \"" + dto.codigo() + "\"");

        Ncm ncm = ncmService.findById(dto.ncmId());
        cest.setCodigo(dto.codigo().trim());
        cest.setDescricao(dto.descricao());
        cest.setNcm(ncm);
        cest.setAtivo(dto.ativo());

        return toDto(cestRepository.save(cest));
    }

    @Transactional
    public void delete(Long id) {
        cestRepository.delete(findById(id));
    }

    private CestResponseDto toDto(Cest c) {
        return new CestResponseDto(
                c.getId(),
                c.getCodigo(),
                c.getDescricao(),
                c.getNcm().getId(),
                c.getNcm().getCodigo(),
                c.getNcm().getDescricao(),
                c.getAtivo()
        );
    }
}
