package com.api.ero_erp.endereco.repository;

import com.api.ero_erp.endereco.entity.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    @Query("""
        SELECT e FROM Endereco e
            JOIN FETCH e.cidade c
            JOIN FETCH c.estado
        WHERE e.pessoa.id = :pessoaId
            AND e.cliente.id = :clienteId
    """)
    List<Endereco> findByPessoaIdAndClienteId(
            @Param("pessoaId")  Long pessoaId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT e FROM Endereco e
            JOIN FETCH e.cidade c
            JOIN FETCH c.estado
        WHERE e.id = :id
            AND e.cliente.id = :clienteId
    """)
    Optional<Endereco> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT e.pessoa.id, c.id, c.nome, est.sigla, e.principal
        FROM Endereco e JOIN e.cidade c JOIN c.estado est
        WHERE e.cliente.id = :clienteId
        ORDER BY e.principal DESC
    """)
    List<Object[]> findCidadesPorPessoa(@Param("clienteId") Long clienteId);
}