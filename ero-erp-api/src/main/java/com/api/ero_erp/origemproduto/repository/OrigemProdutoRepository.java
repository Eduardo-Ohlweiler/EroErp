package com.api.ero_erp.origemproduto.repository;

import com.api.ero_erp.origemproduto.entity.OrigemProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrigemProdutoRepository extends JpaRepository<OrigemProduto, Long> {

    List<OrigemProduto> findAllByOrderByCodigo();
}
