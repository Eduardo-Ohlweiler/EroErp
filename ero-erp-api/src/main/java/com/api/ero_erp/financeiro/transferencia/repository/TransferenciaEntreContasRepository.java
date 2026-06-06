package com.api.ero_erp.financeiro.transferencia.repository;

import com.api.ero_erp.financeiro.transferencia.entity.TransferenciaEntreContas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransferenciaEntreContasRepository extends JpaRepository<TransferenciaEntreContas, Long> {

    List<TransferenciaEntreContas> findAllByClienteIdOrderByDataDescIdDesc(Long clienteId);

    Optional<TransferenciaEntreContas> findByIdAndClienteId(Long id, Long clienteId);
}
