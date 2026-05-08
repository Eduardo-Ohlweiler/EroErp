package com.api.ero_erp.tipocadastro.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tipocadastro.dtos.TipoCadastroCreateDto;
import com.api.ero_erp.tipocadastro.dtos.TipoCadastroResponseDto;
import com.api.ero_erp.tipocadastro.dtos.TipoCadastroUpdateDto;
import com.api.ero_erp.tipocadastro.entity.TipoCadastro;
import com.api.ero_erp.tipocadastro.mapper.TipoCadastroMapper;
import com.api.ero_erp.tipocadastro.repository.TipoCadastroRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class TipoCadastroService {

    private final TipoCadastroRepository repository;

    public TipoCadastroService(TipoCadastroRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public TipoCadastro findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tipo de cadastro não encontrado"));
    }

    public Set<TipoCadastro> findAllByIds(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        return new HashSet<>(repository.findAllById(ids));
    }

    @Transactional(readOnly = true)
    public Page<TipoCadastroResponseDto> getAll(Pageable pageable, String nome) {
        return repository.findAllWithFilters(pageable, nome)
                .map(TipoCadastroMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<TipoCadastroResponseDto> select() {
        return TipoCadastroMapper.toDtoList(repository.findForSelect());
    }

    @Transactional
    public TipoCadastroResponseDto create(TipoCadastroCreateDto dto) {
        if (repository.existsByNomeIgnoreCase(dto.nome()))
            throw new ConflictException("Já existe um tipo de cadastro com esse nome");

        TipoCadastro tipo = new TipoCadastro();
        tipo.setNome(dto.nome());
        if (dto.ativo() != null)
            tipo.setAtivo(dto.ativo());

        return TipoCadastroMapper.toDto(repository.save(tipo));
    }

    @Transactional
    public TipoCadastroResponseDto update(Long id, TipoCadastroUpdateDto dto) {
        TipoCadastro tipo = findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            Optional<TipoCadastro> existente = repository.findByNomeIgnoreCase(dto.nome());
            if (existente.isPresent() && !existente.get().getId().equals(id))
                throw new ConflictException("Já existe outro tipo de cadastro com esse nome");
            tipo.setNome(dto.nome());
        }

        if (dto.ativo() != null)
            tipo.setAtivo(dto.ativo());

        return TipoCadastroMapper.toDto(repository.save(tipo));
    }
}