package com.api.ero_erp.auxiliarproduto.service;

import com.api.ero_erp.auxiliarproduto.entity.CategoriaProduto;
import com.api.ero_erp.auxiliarproduto.repository.CategoriaProdutoRepository;
import com.api.ero_erp.config.SecurityUtils;
import org.springframework.stereotype.Service;

@Service
public class CategoriaProdutoService extends AuxiliarSimplesService<CategoriaProduto> {

    public CategoriaProdutoService(CategoriaProdutoRepository repository, SecurityUtils securityUtils) {
        super(repository, securityUtils, new Rotulo("categoria", true), CategoriaProduto::new);
    }
}
