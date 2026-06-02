package com.api.ero_erp.origemproduto.service;

import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.origemproduto.dtos.OrigemProdutoResponseDto;
import com.api.ero_erp.origemproduto.entity.OrigemProduto;
import com.api.ero_erp.origemproduto.repository.OrigemProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrigemProdutoService {

    private final OrigemProdutoRepository origemProdutoRepository;

    public OrigemProdutoService(OrigemProdutoRepository origemProdutoRepository) {
        this.origemProdutoRepository = origemProdutoRepository;
    }

    @Transactional(readOnly = true)
    public OrigemProduto findById(Long id) {
        return origemProdutoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Origem de produto não encontrada"));
    }

    @Transactional(readOnly = true)
    public List<OrigemProdutoResponseDto> findAll() {
        return origemProdutoRepository.findAllByOrderByCodigo()
                .stream()
                .map(o -> new OrigemProdutoResponseDto(o.getId(), o.getCodigo(), o.getDescricao()))
                .toList();
    }
}
