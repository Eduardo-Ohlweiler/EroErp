package com.api.ero_erp.crm.andamento.repository;

import com.api.ero_erp.crm.andamento.entity.Andamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AndamentoRepository extends JpaRepository<Andamento, Long> {

    Optional<Andamento> findByChave(String chave);

    @Query("""
            SELECT a FROM Andamento a
            WHERE (a.cliente.id = :clienteId OR a.cliente IS NULL)
              AND (a.chave IS NULL OR a.chave <> 'PENDENTE')
            ORDER BY a.sistema DESC, a.nome ASC
            """)
    List<Andamento> listarParaTela(@Param("clienteId") Long clienteId);

    @Query("""
            SELECT a FROM Andamento a
            WHERE (a.cliente.id = :clienteId OR a.cliente IS NULL)
              AND a.ativo = true
            ORDER BY a.nome ASC
            """)
    List<Andamento> listarAtivosParaKanban(@Param("clienteId") Long clienteId);

    Optional<Andamento> findByIdAndClienteId(Long id, Long clienteId);
}
