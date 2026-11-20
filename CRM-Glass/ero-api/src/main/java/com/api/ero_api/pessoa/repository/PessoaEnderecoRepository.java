package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.PessoaEndereco;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Endereços da pessoa. O filtro de tenant é automático em todo JPQL. Sempre com a cidade e a UF junto. */
public interface PessoaEnderecoRepository extends JpaRepository<PessoaEndereco, UUID> {

    @Query("""
            SELECT e FROM PessoaEndereco e
            JOIN FETCH e.tipoEndereco
            JOIN FETCH e.cidade c
            JOIN FETCH c.estado
            WHERE e.pessoa.id = :pessoaId
            ORDER BY e.ordem
            """)
    List<PessoaEndereco> buscarPorPessoa(@Param("pessoaId") UUID pessoaId);

    /** O endereço principal de cada pessoa de uma página da lista (cidade e UF), numa consulta só. */
    @Query("""
            SELECT e FROM PessoaEndereco e
            JOIN FETCH e.cidade c
            JOIN FETCH c.estado
            WHERE e.pessoa.id IN :pessoaIds AND e.principal = true
            """)
    List<PessoaEndereco> buscarPrincipaisPorPessoas(@Param("pessoaIds") Collection<UUID> pessoaIds);

    /** A lista do salvar substitui a anterior: apaga tudo da pessoa antes de gravar a nova. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM PessoaEndereco e
            WHERE e.pessoa.id = :pessoaId
            """)
    int removerPorPessoa(@Param("pessoaId") UUID pessoaId);
}
