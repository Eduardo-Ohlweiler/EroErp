package com.api.ero_erp.pedido.repository;

import com.api.ero_erp.pedido.entity.Pedido;
import com.api.ero_erp.pedido.enums.StatusPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("""
            SELECT p FROM Pedido p
            JOIN FETCH p.emitente e JOIN FETCH e.pessoa
            JOIN FETCH p.pessoa
            JOIN FETCH p.tipoPedido
            LEFT JOIN FETCH p.vendedor
            WHERE p.id = :id
            AND p.cliente.id = :clienteId
            """)
    Optional<Pedido> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT p FROM Pedido p
            JOIN FETCH p.emitente e JOIN FETCH e.pessoa
            JOIN FETCH p.pessoa pe
            JOIN FETCH p.tipoPedido
            LEFT JOIN FETCH p.vendedor
            WHERE p.cliente.id = :clienteId
            AND (:status IS NULL OR p.status = :status)
            AND (:emitenteId IS NULL OR p.emitente.id = :emitenteId)
            AND (:pessoaId IS NULL OR p.pessoa.id = :pessoaId)
            AND (:tipoPedidoId IS NULL OR p.tipoPedido.id = :tipoPedidoId)
            AND p.dataPedido >= :inicio
            AND p.dataPedido <= :fim
            AND (:nomePessoa IS NULL OR LOWER(pe.nome) LIKE LOWER(CONCAT('%', CAST(:nomePessoa AS string), '%')))
            AND (:faturado IS NULL OR p.faturado = :faturado)
            ORDER BY p.createdAt DESC
            """)
    Page<Pedido> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")    Long          clienteId,
            @Param("status")       StatusPedido  status,
            @Param("emitenteId")   Long          emitenteId,
            @Param("pessoaId")     Long          pessoaId,
            @Param("tipoPedidoId") Long          tipoPedidoId,
            @Param("inicio")       LocalDateTime inicio,
            @Param("fim")          LocalDateTime fim,
            @Param("nomePessoa")   String        nomePessoa,
            @Param("faturado")     Boolean       faturado
    );
}
