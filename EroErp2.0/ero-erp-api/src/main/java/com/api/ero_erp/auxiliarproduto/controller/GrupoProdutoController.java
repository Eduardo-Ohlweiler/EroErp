package com.api.ero_erp.auxiliarproduto.controller;

import com.api.ero_erp.auxiliarproduto.service.GrupoProdutoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/grupos-produto")
@Tag(name = "Grupos de produto")
public class GrupoProdutoController extends AuxiliarSimplesController {

    public GrupoProdutoController(GrupoProdutoService service) {
        super(service);
    }
}
