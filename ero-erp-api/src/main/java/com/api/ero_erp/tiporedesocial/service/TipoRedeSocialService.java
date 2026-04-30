package com.api.ero_erp.tiporedesocial.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tiporedesocial.dtos.TipoRedeSocialCreateDto;
import com.api.ero_erp.tiporedesocial.dtos.TipoRedeSocialUpdateDto;
import com.api.ero_erp.tiporedesocial.entity.TipoRedeSocial;
import com.api.ero_erp.tiporedesocial.repository.TipoRedeSocialRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TipoRedeSocialService {

    private final TipoRedeSocialRepository repository;

    public TipoRedeSocialService(TipoRedeSocialRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public TipoRedeSocial findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tipo de rede social não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<TipoRedeSocial> getAll(Pageable pageable, String nome) {
        return repository.findAllWithFilters(pageable, nome);
    }

    @Transactional(readOnly = true)
    public List<TipoRedeSocial> select(){
        return repository.findForSelect();
    }

    @Transactional
    public TipoRedeSocial create(TipoRedeSocialCreateDto dto) {
        if(repository.existsByNomeIgnoreCase(dto.nome()))
            throw new ConflictException("Já existe um tipo de rede social com esse nome");

        TipoRedeSocial tipo = new TipoRedeSocial();
        tipo.setNome(dto.nome());
        if(dto.ativo() != null)
            tipo.setAtivo(dto.ativo());

        return repository.save(tipo);
    }

    @Transactional
    public TipoRedeSocial update(Long id, TipoRedeSocialUpdateDto dto){
        TipoRedeSocial tipo = this.findById(id);

        if(dto.nome() != null && !dto.nome().isBlank()){
            Optional<TipoRedeSocial> existente = repository.findByNomeIgnoreCase(dto.nome());
            if(existente.isPresent() && !existente.get().getId().equals(id))
                throw new ConflictException("Já existe outro tipo de telefone com esse nome");
            tipo.setNome(dto.nome());
        }
        if(dto.ativo() != null)
            tipo.setAtivo(dto.ativo());

        return repository.save(tipo);
    }
}
