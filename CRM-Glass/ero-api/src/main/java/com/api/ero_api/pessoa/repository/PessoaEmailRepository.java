package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.PessoaEmail;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** E-mails da pessoa. O filtro de tenant é automático em todo JPQL. */
public interface PessoaEmailRepository extends JpaRepository<PessoaEmail, UUID> {

    @Query("""
            SELECT e FROM PessoaEmail e JOIN FETCH e.tipoEmail
            WHERE e.pessoa.id = :pessoaId
            ORDER BY e.ordem
            """)
    List<PessoaEmail> buscarPorPessoa(@Param("pessoaId") UUID pessoaId);

    /** O e-mail principal de cada pessoa de uma página da lista, numa consulta só. */
    @Query("""
            SELECT e FROM PessoaEmail e
            WHERE e.pessoa.id IN :pessoaIds AND e.principal = true
            """)
    List<PessoaEmail> buscarPrincipaisPorPessoas(@Param("pessoaIds") Collection<UUID> pessoaIds);

    /** A lista do salvar substitui a anterior: apaga tudo da pessoa antes de gravar a nova. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM PessoaEmail e
            WHERE e.pessoa.id = :pessoaId
            """)
    int removerPorPessoa(@Param("pessoaId") UUID pessoaId);
}
