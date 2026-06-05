package com.api.ero_erp.tipoproduto.service;

import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tipoproduto.dtos.TipoProdutoResponseDto;
import com.api.ero_erp.tipoproduto.dtos.TipoProdutoUpdateDto;
import com.api.ero_erp.tipoproduto.entity.TipoProduto;
import com.api.ero_erp.tipoproduto.repository.TipoProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TipoProdutoService {

    private final TipoProdutoRepository tipoProdutoRepository;

    public TipoProdutoService(TipoProdutoRepository tipoProdutoRepository) {
        this.tipoProdutoRepository = tipoProdutoRepository;
    }

    @Transactional(readOnly = true)
    public TipoProduto findById(Long id) {
        return tipoProdutoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tipo de produto não encontrado"));
    }

    @Transactional(readOnly = true)
    public List<TipoProdutoResponseDto> findAtivos(String nome) {
        return tipoProdutoRepository.findAtivos(nome)
                .stream()
                .map(t -> new TipoProdutoResponseDto(t.getId(), t.getNome(), t.getAtivo(), t.getClassificacao()))
                .toList();
    }

    @Transactional
    public TipoProdutoResponseDto updateClassificacao(Long id, TipoProdutoUpdateDto dto) {
        TipoProduto t = findById(id);
        t.setClassificacao(dto.classificacao());
        tipoProdutoRepository.save(t);
        return new TipoProdutoResponseDto(t.getId(), t.getNome(), t.getAtivo(), t.getClassificacao());
    }
}
