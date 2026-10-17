package com.api.ero_erp.auxiliarproduto.service;

import com.api.ero_erp.auxiliarproduto.entity.MarcaProduto;
import com.api.ero_erp.auxiliarproduto.repository.MarcaProdutoRepository;
import com.api.ero_erp.config.SecurityUtils;
import org.springframework.stereotype.Service;

@Service
public class MarcaProdutoService extends AuxiliarSimplesService<MarcaProduto> {

    public MarcaProdutoService(MarcaProdutoRepository repository, SecurityUtils securityUtils) {
        super(repository, securityUtils, new Rotulo("marca", true), MarcaProduto::new);
    }
}
