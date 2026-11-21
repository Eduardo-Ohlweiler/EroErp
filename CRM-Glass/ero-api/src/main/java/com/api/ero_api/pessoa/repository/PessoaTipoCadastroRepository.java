package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.PessoaTipoCadastro;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Tipos de cadastro marcados na pessoa. O filtro de tenant é automático em todo JPQL. */
public interface PessoaTipoCadastroRepository extends JpaRepository<PessoaTipoCadastro, UUID> {

    @Query("""
            SELECT x FROM PessoaTipoCadastro x JOIN FETCH x.tipoCadastro
            WHERE x.pessoa.id = :pessoaId
            """)
    List<PessoaTipoCadastro> buscarPorPessoa(@Param("pessoaId") UUID pessoaId);

    /** Os tipos de uma página inteira da lista, numa consulta só. */
    @Query("""
            SELECT x FROM PessoaTipoCadastro x JOIN FETCH x.tipoCadastro
            WHERE x.pessoa.id IN :pessoaIds
            """)
    List<PessoaTipoCadastro> buscarPorPessoas(@Param("pessoaIds") Collection<UUID> pessoaIds);

    /** A lista do salvar substitui a anterior: apaga tudo da pessoa antes de gravar a nova. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM PessoaTipoCadastro x
            WHERE x.pessoa.id = :pessoaId
            """)
    int removerPorPessoa(@Param("pessoaId") UUID pessoaId);
}
