package com.api.ero_erp.ncm.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.ncm.dtos.NcmCreateDto;
import com.api.ero_erp.ncm.dtos.NcmResponseDto;
import com.api.ero_erp.ncm.dtos.NcmUpdateDto;
import com.api.ero_erp.ncm.entity.Ncm;
import com.api.ero_erp.ncm.repository.NcmRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NcmService {

    private final NcmRepository ncmRepository;

    public NcmService(NcmRepository ncmRepository) {
        this.ncmRepository = ncmRepository;
    }

    @Transactional(readOnly = true)
    public Ncm findById(Long id) {
        return ncmRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("NCM não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<NcmResponseDto> getAll(Pageable pageable, String busca) {
        return ncmRepository.findAllWithFilters(pageable, busca)
                .map(n -> new NcmResponseDto(n.getId(), n.getCodigo(), n.getDescricao(), n.getAtivo()));
    }

    @Transactional
    public NcmResponseDto create(NcmCreateDto dto) {
        if (ncmRepository.existsByCodigo(dto.codigo().trim(), null))
            throw new ConflictException("Já existe um NCM com o código \"" + dto.codigo() + "\"");

        Ncm ncm = new Ncm();
        ncm.setCodigo(dto.codigo().trim());
        ncm.setDescricao(dto.descricao());

        Ncm saved = ncmRepository.save(ncm);
        return new NcmResponseDto(saved.getId(), saved.getCodigo(), saved.getDescricao(), saved.getAtivo());
    }

    @Transactional
    public NcmResponseDto update(Long id, NcmUpdateDto dto) {
        Ncm ncm = findById(id);

        if (ncmRepository.existsByCodigo(dto.codigo().trim(), id))
            throw new ConflictException("Já existe um NCM com o código \"" + dto.codigo() + "\"");

        ncm.setCodigo(dto.codigo().trim());
        ncm.setDescricao(dto.descricao());
        ncm.setAtivo(dto.ativo());

        Ncm saved = ncmRepository.save(ncm);
        return new NcmResponseDto(saved.getId(), saved.getCodigo(), saved.getDescricao(), saved.getAtivo());
    }

    @Transactional
    public void delete(Long id) {
        ncmRepository.delete(findById(id));
    }
}
