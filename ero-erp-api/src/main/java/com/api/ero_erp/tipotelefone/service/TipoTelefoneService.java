package com.api.ero_erp.tipotelefone.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tipotelefone.dtos.TipoTelefoneCreateDto;
import com.api.ero_erp.tipotelefone.dtos.TipoTelefoneUpdateDto;
import com.api.ero_erp.tipotelefone.entity.TipoTelefone;
import com.api.ero_erp.tipotelefone.repository.TipoTelefoneRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TipoTelefoneService {

    private final TipoTelefoneRepository repository;

    public TipoTelefoneService(TipoTelefoneRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public TipoTelefone findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tipo de telefone não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<TipoTelefone> getAll(Pageable pageable, String nome) {
        return repository.findAllWithFilters(pageable, nome);
    }

    @Transactional(readOnly = true)
    public List<TipoTelefone> select() {
        return repository.findForSelect();
    }

    @Transactional
    public TipoTelefone create(TipoTelefoneCreateDto dto) {
        if (repository.existsByNomeIgnoreCase(dto.nome()))
            throw new ConflictException("Já existe um tipo de telefone com esse nome");

        TipoTelefone tipo = new TipoTelefone();
        tipo.setNome(dto.nome());
        if(dto.ativo() != null)
            tipo.setAtivo(dto.ativo());
        return repository.save(tipo);
    }

    @Transactional
    public TipoTelefone update(Long id, TipoTelefoneUpdateDto dto) {
        TipoTelefone tipo = findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            Optional<TipoTelefone> existente = repository.findByNomeIgnoreCase(dto.nome());
            if (existente.isPresent() && !existente.get().getId().equals(id))
                throw new ConflictException("Já existe outro tipo de telefone com esse nome");
            tipo.setNome(dto.nome());
        }

        if (dto.ativo() != null) tipo.setAtivo(dto.ativo());

        return repository.save(tipo);
    }
}
