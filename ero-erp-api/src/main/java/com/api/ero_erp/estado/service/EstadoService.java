package com.api.ero_erp.estado.service;

import com.api.ero_erp.estado.dtos.EstadoCreateDto;
import com.api.ero_erp.estado.dtos.EstadoUpdateDto;
import com.api.ero_erp.estado.entity.Estado;
import com.api.ero_erp.estado.repository.EstadoRepository;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EstadoService {

    private final EstadoRepository estadoRepository;

    public EstadoService(EstadoRepository estadoRepository) {
        this.estadoRepository = estadoRepository;
    }

    @Transactional(readOnly = true)
    public Estado findById(Long id) {
        return estadoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Estado não encontrado"));
    }

    @Transactional(readOnly = true)
    public List<Estado> findForSelect() {
        return estadoRepository.findForSelect();
    }

    @Transactional(readOnly = true)
    public Page<Estado> getAll(
            Pageable pageable,
            String nome,
            String sigla,
            Integer codigoIbge,
            Boolean ativo
    ) {
        String nomeFiltro = (nome != null && !nome.isBlank())
                ? nome.trim()
                : null;

        String siglaFiltro = (sigla != null && !sigla.isBlank())
                ? sigla.trim().toUpperCase()
                : null;

        return estadoRepository.findAllWithFilters(
                pageable,
                nomeFiltro,
                siglaFiltro,
                codigoIbge,
                ativo
        );
    }

    @Transactional
    public Estado create(EstadoCreateDto dto) {
        if (estadoRepository.existsBySiglaIgnoreCase(dto.sigla()))
            throw new ConflictException("Já existe um estado com essa sigla");

        Estado estado = new Estado();
        estado.setNome(dto.nome());
        estado.setSigla(dto.sigla().toUpperCase());
        estado.setCodigoIbge(dto.codigoIbge());
        if(dto.ativo() != null)
            estado.setAtivo(dto.ativo());

        return estadoRepository.save(estado);
    }

    @Transactional
    public Estado update(Long id, EstadoUpdateDto dto) {
        Estado estado = findById(id);

        if (dto.sigla() != null && !dto.sigla().isBlank()) {
            estadoRepository.findBySiglaIgnoreCase(dto.sigla())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id))
                            throw new ConflictException("Já existe outro estado com essa sigla");
                    });
            estado.setSigla(dto.sigla().toUpperCase());
        }

        if (dto.nome() != null && !dto.nome().isBlank())
            estado.setNome(dto.nome());

        if (dto.codigoIbge() != null)
            estado.setCodigoIbge(dto.codigoIbge());

        if (dto.ativo() != null)
            estado.setAtivo(dto.ativo());

        return estadoRepository.save(estado);
    }
}