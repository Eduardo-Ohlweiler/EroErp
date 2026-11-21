package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.PessoaTelefone;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Telefones da pessoa. O filtro de tenant é automático em todo JPQL. */
public interface PessoaTelefoneRepository extends JpaRepository<PessoaTelefone, UUID> {

    @Query("""
            SELECT t FROM PessoaTelefone t JOIN FETCH t.tipoTelefone
            WHERE t.pessoa.id = :pessoaId
            ORDER BY t.ordem
            """)
    List<PessoaTelefone> buscarPorPessoa(@Param("pessoaId") UUID pessoaId);

    /** O telefone principal de cada pessoa de uma página da lista, numa consulta só. */
    @Query("""
            SELECT t FROM PessoaTelefone t
            WHERE t.pessoa.id IN :pessoaIds AND t.principal = true
            """)
    List<PessoaTelefone> buscarPrincipaisPorPessoas(@Param("pessoaIds") Collection<UUID> pessoaIds);

    /** A lista do salvar substitui a anterior: apaga tudo da pessoa antes de gravar a nova. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM PessoaTelefone t
            WHERE t.pessoa.id = :pessoaId
            """)
    int removerPorPessoa(@Param("pessoaId") UUID pessoaId);
}
