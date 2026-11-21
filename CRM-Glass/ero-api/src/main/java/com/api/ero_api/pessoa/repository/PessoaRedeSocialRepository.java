package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.PessoaRedeSocial;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Redes sociais da pessoa. O filtro de tenant é automático em todo JPQL. */
public interface PessoaRedeSocialRepository extends JpaRepository<PessoaRedeSocial, UUID> {

    @Query("""
            SELECT r FROM PessoaRedeSocial r JOIN FETCH r.tipoRedeSocial
            WHERE r.pessoa.id = :pessoaId
            ORDER BY r.ordem
            """)
    List<PessoaRedeSocial> buscarPorPessoa(@Param("pessoaId") UUID pessoaId);

    /** A lista do salvar substitui a anterior: apaga tudo da pessoa antes de gravar a nova. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM PessoaRedeSocial r
            WHERE r.pessoa.id = :pessoaId
            """)
    int removerPorPessoa(@Param("pessoaId") UUID pessoaId);
}
