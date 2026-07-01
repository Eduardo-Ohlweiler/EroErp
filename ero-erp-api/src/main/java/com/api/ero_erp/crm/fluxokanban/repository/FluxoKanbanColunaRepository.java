package com.api.ero_erp.crm.fluxokanban.repository;

import com.api.ero_erp.crm.fluxokanban.entity.FluxoKanbanColuna;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FluxoKanbanColunaRepository extends JpaRepository<FluxoKanbanColuna, Long> {

    List<FluxoKanbanColuna> findByClienteIdOrderByOrdemAsc(Long clienteId);

    boolean existsByAndamentoId(Long andamentoId);

    void deleteByClienteId(Long clienteId);
}
