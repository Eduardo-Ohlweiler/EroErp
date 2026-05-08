package com.api.ero_erp.pessoa.repository;

import com.api.ero_erp.pessoa.entity.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    Optional<Pessoa> findByIdAndClienteId(Long id, Long clienteId);

    boolean existsByCpfAndClienteId(String cpf, Long clienteId);
    boolean existsByRgAndClienteId(String rg, Long clienteId);
    boolean existsByCnpjAndClienteId(String cnpj, Long clienteId);

    boolean existsByCpfAndClienteIdAndIdNot(String cpf, Long clienteId, Long id);
    boolean existsByRgAndClienteIdAndIdNot(String rg, Long clienteId, Long id);
    boolean existsByCnpjAndClienteIdAndIdNot(String cnpj, Long clienteId, Long id);
}