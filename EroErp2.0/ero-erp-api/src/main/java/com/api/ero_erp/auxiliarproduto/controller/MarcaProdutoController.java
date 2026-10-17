package com.api.ero_erp.auxiliarproduto.controller;

import com.api.ero_erp.auxiliarproduto.service.MarcaProdutoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/marcas-produto")
@Tag(name = "Marcas de produto")
public class MarcaProdutoController extends AuxiliarSimplesController {

    public MarcaProdutoController(MarcaProdutoService service) {
        super(service);
    }
}
