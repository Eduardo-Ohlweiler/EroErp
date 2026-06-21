package com.api.ero_erp.otorrino.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.otorrino.dto.QuestionarioDetalheDto;
import com.api.ero_erp.otorrino.dto.QuestionarioSummaryDto;
import com.api.ero_erp.otorrino.entity.Questionario;
import com.api.ero_erp.otorrino.mapper.QuestionarioMapper;
import com.api.ero_erp.otorrino.repository.QuestionarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuestionarioService {

    private final QuestionarioRepository repository;
    private final SecurityUtils          securityUtils;

    public QuestionarioService(QuestionarioRepository repository, SecurityUtils securityUtils) {
        this.repository    = repository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public List<QuestionarioSummaryDto> getCatalogo() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findCatalogoAtivo(clienteId).stream()
                .map(QuestionarioMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionarioDetalheDto getDetalhe(Long id) {
        Long          clienteId    = securityUtils.getClienteIdLogado();
        Questionario  questionario = repository.findByIdVisivel(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Questionário não encontrado, verifique!"));
        // itens e opções carregados via @OrderBy nas coleções LAZY dentro da transação
        return QuestionarioMapper.toDetalheDto(questionario);
    }
}
