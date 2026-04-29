package com.api.ero_erp.tipoendereco.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tipoendereco.dtos.TipoEnderecoCreateDto;
import com.api.ero_erp.tipoendereco.dtos.TipoEnderecoUpdateDto;
import com.api.ero_erp.tipoendereco.entity.TipoEndereco;
import com.api.ero_erp.tipoendereco.repository.TipoEnderecoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class TipoEnderecoService {

    private final TipoEnderecoRepository repository;

    public TipoEnderecoService(TipoEnderecoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public TipoEndereco findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tipo de endereço não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<TipoEndereco> getAll(Pageable pageable, String nome) {
        return repository.findAllWithFilters(pageable, nome);
    }

    @Transactional(readOnly = true)
    public List<TipoEndereco> select() {
        return repository.findForSelect();
    }

    @Transactional
    public TipoEndereco create(TipoEnderecoCreateDto dto) {
        if (repository.existsByNomeIgnoreCase(dto.nome()))
            throw new ConflictException("Já existe um tipo de endereço com esse nome");

        TipoEndereco tipo = new TipoEndereco();
        tipo.setNome(dto.nome());
        return repository.save(tipo);
    }

    @Transactional
    public TipoEndereco update(Long id, TipoEnderecoUpdateDto dto) {
        TipoEndereco tipo = findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            Optional<TipoEndereco> existente = repository.findByNomeIgnoreCase(dto.nome());
            if (existente.isPresent() && !existente.get().getId().equals(id))
                throw new ConflictException("Já existe outro tipo de endereço com esse nome");
            tipo.setNome(dto.nome());
        }

        if (dto.ativo() != null) tipo.setAtivo(dto.ativo());

        return repository.save(tipo);
    }
}
