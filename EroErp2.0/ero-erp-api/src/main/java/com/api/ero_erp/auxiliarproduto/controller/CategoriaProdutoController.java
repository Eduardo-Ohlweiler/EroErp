package com.api.ero_erp.auxiliarproduto.controller;

import com.api.ero_erp.auxiliarproduto.service.CategoriaProdutoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categorias-produto")
@Tag(name = "Categorias de produto")
public class CategoriaProdutoController extends AuxiliarSimplesController {

    public CategoriaProdutoController(CategoriaProdutoService service) {
        super(service);
    }
}
