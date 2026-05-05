package com.api.ero_erp.endereco.repository;

import com.api.ero_erp.endereco.entity.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    boolean existsByPessoaIdAndClienteIdAndPrincipalTrue(Long pessoaId, Long clienteId);
    boolean existsByPessoaIdAndClienteIdAndPrincipalTrueAndIdNot(Long pessoaId, Long clienteId, Long id);

    List<Endereco> findByPessoaIdAndClienteId(Long pessoaId, Long clienteId);
    Optional<Endereco> findByIdAndClienteId(Long id, Long clienteId);
}
