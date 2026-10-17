package com.api.ero_erp.auxiliarproduto.service;

import com.api.ero_erp.auxiliarproduto.entity.GrupoProduto;
import com.api.ero_erp.auxiliarproduto.repository.GrupoProdutoRepository;
import com.api.ero_erp.config.SecurityUtils;
import org.springframework.stereotype.Service;

@Service
public class GrupoProdutoService extends AuxiliarSimplesService<GrupoProduto> {

    public GrupoProdutoService(GrupoProdutoRepository repository, SecurityUtils securityUtils) {
        super(repository, securityUtils, new Rotulo("grupo", false), GrupoProduto::new);
    }
}
