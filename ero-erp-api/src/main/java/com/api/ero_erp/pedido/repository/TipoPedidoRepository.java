package com.api.ero_erp.pedido.repository;

import com.api.ero_erp.pedido.entity.TipoPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoPedidoRepository extends JpaRepository<TipoPedido, Long> {

    @Query("""
        SELECT t FROM TipoPedido t
        WHERE t.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        """)
    Page<TipoPedido> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );

    @Query("""
        SELECT t FROM TipoPedido t
        WHERE t.cliente.id = :clienteId
          AND t.ativo = true
        ORDER BY t.nome
        """)
    List<TipoPedido> findAtivos(@Param("clienteId") Long clienteId);

    Optional<TipoPedido> findByIdAndClienteId(Long id, Long clienteId);
}
