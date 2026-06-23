package com.api.ero_erp.pedido.repository;

import com.api.ero_erp.pedido.entity.PedidoProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoProdutoRepository extends JpaRepository<PedidoProduto, Long> {

    @Query("""
            SELECT pp FROM PedidoProduto pp
            JOIN FETCH pp.produto p
            JOIN FETCH p.tipoProduto
            JOIN FETCH pp.emitente em JOIN FETCH em.pessoa
            WHERE pp.pedido.id = :pedidoId
            AND pp.cliente.id = :clienteId
            ORDER BY pp.createdAt ASC
            """)
    List<PedidoProduto> findByPedidoIdAndClienteId(
            @Param("pedidoId")  Long pedidoId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT pp FROM PedidoProduto pp
            WHERE pp.id = :id
            AND pp.pedido.id = :pedidoId
            AND pp.cliente.id = :clienteId
            """)
    Optional<PedidoProduto> findByIdAndPedidoIdAndClienteId(
            @Param("id")        Long id,
            @Param("pedidoId")  Long pedidoId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT pp FROM PedidoProduto pp
            JOIN FETCH pp.produto p
            JOIN FETCH pp.emitente em
            JOIN com.api.ero_erp.estoque.entity.Estoque est
              ON est.produto = p AND est.emitente = em AND est.cliente = pp.cliente
            WHERE pp.pedido.id = :pedidoId
            AND est.baixarEstoque = true
            """)
    List<PedidoProduto> findParaMovimentarEstoque(@Param("pedidoId") Long pedidoId);

    @Query("""
            SELECT pp FROM PedidoProduto pp
            JOIN FETCH pp.produto p
            JOIN FETCH pp.pedido pe
            WHERE pe.cliente.id = :clienteId
            AND pe.status = 'CONCLUIDO'
            AND pe.dataPedido >= :inicio
            AND pe.dataPedido <= :fim
            AND (:emitenteId IS NULL OR pe.emitente.id = :emitenteId)
            AND (:tipoPedidoId IS NULL OR pe.tipoPedido.id = :tipoPedidoId)
            AND (:pessoaId IS NULL OR pe.pessoa.id = :pessoaId)
            """)
    List<PedidoProduto> findForDashboard(
            @Param("clienteId")    Long          clienteId,
            @Param("inicio")       LocalDateTime inicio,
            @Param("fim")          LocalDateTime fim,
            @Param("emitenteId")   Long          emitenteId,
            @Param("tipoPedidoId") Long          tipoPedidoId,
            @Param("pessoaId")     Long          pessoaId
    );
}
