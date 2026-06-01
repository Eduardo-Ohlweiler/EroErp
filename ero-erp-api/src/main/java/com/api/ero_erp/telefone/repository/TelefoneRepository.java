package com.api.ero_erp.telefone.repository;

import com.api.ero_erp.telefone.entity.Telefone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TelefoneRepository extends JpaRepository<Telefone, Long> {

    List<Telefone> findByPessoaIdAndClienteId(Long pessoaId, Long clienteId);
    Optional<Telefone> findByIdAndClienteId(Long id, Long clienteId);
    Optional<Telefone> findFirstByPessoaIdAndClienteIdAndTipoTelefoneId(Long pessoaId, Long clienteId, Long tipoTelefoneId);
}
