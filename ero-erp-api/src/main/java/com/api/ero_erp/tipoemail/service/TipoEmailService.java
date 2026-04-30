package com.api.ero_erp.tipoemail.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tipoemail.dtos.TipoEmailCreateDto;
import com.api.ero_erp.tipoemail.dtos.TipoEmailUpdateDto;
import com.api.ero_erp.tipoemail.entity.TipoEmail;
import com.api.ero_erp.tipoemail.repository.TipoEmailRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TipoEmailService {

    private final TipoEmailRepository tipoEmailRepository;

    public TipoEmailService(TipoEmailRepository tipoEmailRepository) {
        this.tipoEmailRepository = tipoEmailRepository;
    }

    @Transactional(readOnly = true)
    public TipoEmail findById(Long id) {
        return tipoEmailRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tipo de email não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<TipoEmail> getAll(Pageable pageable, String nome) {
        return tipoEmailRepository.findAllWithFilters(pageable, nome);
    }

    @Transactional(readOnly = true)
    public List<TipoEmail> select() {
        return tipoEmailRepository.findForSelect();
    }

    @Transactional
    public TipoEmail create(TipoEmailCreateDto dto){
        if(tipoEmailRepository.existsByNomeIgnoreCase(dto.nome()))
            throw new ConflictException("Já existe um tipo de email com esse nome");

        TipoEmail tipo = new TipoEmail();
        tipo.setNome(dto.nome());
        if(dto.ativo() != null)
            tipo.setAtivo(dto.ativo());
        return tipoEmailRepository.save(tipo);
    }

    @Transactional
    public TipoEmail update(Long id, TipoEmailUpdateDto dto){
        TipoEmail tipoEmail = findById(id);
        if(dto.nome() != null && !dto.nome().isBlank()){
            Optional<TipoEmail> existente = tipoEmailRepository.findByNomeIgnoreCase(dto.nome());
            if(existente.isPresent() && !existente.get().getId().equals(id))
                throw new ConflictException("Já existe outro tipo de email com esse nome");

            tipoEmail.setNome(dto.nome());
        }

        if(dto.ativo() != null)
            tipoEmail.setAtivo(dto.ativo());

        return tipoEmailRepository.save(tipoEmail);
    }
}
