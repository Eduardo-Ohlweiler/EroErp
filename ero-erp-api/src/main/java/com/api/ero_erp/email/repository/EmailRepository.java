package com.api.ero_erp.email.repository;

import com.api.ero_erp.email.entity.Email;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {

    boolean existsByPessoaIdAndClienteIdAndPrincipalTrue(Long pessoaId, Long clienteId);
    boolean existsByPessoaIdAndClienteIdAndPrincipalTrueAndIdNot(Long pessoaId, Long clienteId, Long id);

    List<Email> findByPessoaIdAndClienteId(Long pessoaId, Long clienteId);
    Optional<Email> findByIdAndClienteId(Long id, Long clienteId);
}
