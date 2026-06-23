package com.api.ero_erp.credito.repository;

import com.api.ero_erp.credito.entity.CreditoCliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface CreditoClienteRepository extends JpaRepository<CreditoCliente, Long> {

    @Query("""
        SELECT COALESCE(SUM(CASE WHEN c.tipo = com.api.ero_erp.credito.enums.TipoCredito.ENTRADA
                                 THEN c.valor ELSE -c.valor END), 0)
        FROM CreditoCliente c
        WHERE c.cliente.id = :clienteId AND c.pessoa.id = :pessoaId
    """)
    BigDecimal saldo(@Param("clienteId") Long clienteId, @Param("pessoaId") Long pessoaId);

    @Query("""
        SELECT c FROM CreditoCliente c
        JOIN FETCH c.pessoa
        WHERE c.cliente.id = :clienteId AND c.pessoa.id = :pessoaId
        ORDER BY c.data DESC
    """)
    Page<CreditoCliente> findByClienteIdAndPessoaId(
            @Param("clienteId") Long clienteId,
            @Param("pessoaId") Long pessoaId,
            Pageable pageable
    );
}
