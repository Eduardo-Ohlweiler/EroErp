package com.api.ero_erp.whatsapp.whatsappconfigglobal.service;

import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalCreateDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalResponseDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalUpdateDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.entity.WhatsappConfigGlobal;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.mapper.WhatsappConfigGlobalMapper;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.repository.WhatsappConfigGlobalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsappConfigGlobalService {

    private final WhatsappConfigGlobalRepository whatsappConfigGlobalRepository;

    public WhatsappConfigGlobalService(WhatsappConfigGlobalRepository whatsappConfigGlobalRepository) {
        this.whatsappConfigGlobalRepository = whatsappConfigGlobalRepository;
    }

    @Transactional
    public WhatsappConfigGlobalResponseDto create(WhatsappConfigGlobalCreateDto dto) {
        WhatsappConfigGlobal config = new WhatsappConfigGlobal();
        config.setApiUrl(dto.apiUrl());
        config.setApiKey(dto.apiKey());
        if (dto.ativo() != null) config.setAtivo(dto.ativo());

        return WhatsappConfigGlobalMapper.toDto(whatsappConfigGlobalRepository.save(config));
    }

    @Transactional(readOnly = true)
    public WhatsappConfigGlobal findById(Long id) {
        return whatsappConfigGlobalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Configuração global do WhatsApp não encontrada, verifique!"));
    }

    @Transactional(readOnly = true)
    public WhatsappConfigGlobalResponseDto findByIdResponse(Long id) {
        return WhatsappConfigGlobalMapper.toDto(this.findById(id));
    }

    @Transactional(readOnly = true)
    public WhatsappConfigGlobalResponseDto findActive() {
        return WhatsappConfigGlobalMapper.toDto(
                whatsappConfigGlobalRepository.findFirstByAtivoTrue()
                        .orElseThrow(() -> new NotFoundException("Nenhuma configuração global ativa encontrada, verifique!"))
        );
    }

    @Transactional
    public WhatsappConfigGlobalResponseDto update(Long id, WhatsappConfigGlobalUpdateDto dto) {
        WhatsappConfigGlobal config = this.findById(id);

        if (dto.apiUrl() != null && !dto.apiUrl().isBlank())
            config.setApiUrl(dto.apiUrl());
        if (dto.apiKey() != null && !dto.apiKey().isBlank())
            config.setApiKey(dto.apiKey());
        if (dto.ativo() != null)
            config.setAtivo(dto.ativo());

        return WhatsappConfigGlobalMapper.toDto(whatsappConfigGlobalRepository.save(config));
    }

    @Transactional
    public void delete(Long id) {
        whatsappConfigGlobalRepository.delete(this.findById(id));
    }
}
