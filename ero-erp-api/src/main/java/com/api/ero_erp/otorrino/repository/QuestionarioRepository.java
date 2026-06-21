package com.api.ero_erp.otorrino.repository;

import com.api.ero_erp.otorrino.entity.Questionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionarioRepository extends JpaRepository<Questionario, Long> {

    /** Catálogo ativo: questionários globais (cliente nulo) + os do próprio cliente. */
    @Query("""
        SELECT q FROM Questionario q
        WHERE q.ativo = true
          AND (q.cliente IS NULL OR q.cliente.id = :clienteId)
        ORDER BY q.nome
        """)
    List<Questionario> findCatalogoAtivo(@Param("clienteId") Long clienteId);

    /** Detalhe (itens + opções) garantindo acesso global ou do próprio cliente. */
    @Query("""
        SELECT q FROM Questionario q
        WHERE q.id = :id
          AND (q.cliente IS NULL OR q.cliente.id = :clienteId)
        """)
    Optional<Questionario> findByIdVisivel(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );
}
