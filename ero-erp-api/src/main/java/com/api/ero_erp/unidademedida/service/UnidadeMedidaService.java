package com.api.ero_erp.unidademedida.service;

import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.unidademedida.dtos.UnidadeMedidaResponseDto;
import com.api.ero_erp.unidademedida.entity.UnidadeMedida;
import com.api.ero_erp.unidademedida.repository.UnidadeMedidaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UnidadeMedidaService {

    private final UnidadeMedidaRepository unidadeMedidaRepository;

    public UnidadeMedidaService(UnidadeMedidaRepository unidadeMedidaRepository) {
        this.unidadeMedidaRepository = unidadeMedidaRepository;
    }

    @Transactional(readOnly = true)
    public UnidadeMedida findById(Long id) {
        return unidadeMedidaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Unidade de medida não encontrada"));
    }

    @Transactional(readOnly = true)
    public List<UnidadeMedidaResponseDto> findAtivas(String busca) {
        return unidadeMedidaRepository.findAtivas(busca)
                .stream()
                .map(u -> new UnidadeMedidaResponseDto(u.getId(), u.getSigla(), u.getDescricao(), u.getAtivo()))
                .toList();
    }
}
