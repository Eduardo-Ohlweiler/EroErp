package com.api.ero_erp.crm.atendimento.repository;

import com.api.ero_erp.crm.atendimento.entity.AtendimentoAssuncao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AtendimentoAssuncaoRepository extends JpaRepository<AtendimentoAssuncao, Long> {

    List<AtendimentoAssuncao> findByAtendimentoIdOrderByDataDesc(Long atendimentoId);

    /**
     * Carrega as assunções de uma lista de atendimentos em uma única query (evita N+1),
     * ordenadas por data DESC — a primeira de cada atendimento é a mais recente.
     */
    @Query("""
            SELECT aa FROM AtendimentoAssuncao aa
            JOIN FETCH aa.usuario
            WHERE aa.atendimento.id IN :atendimentoIds
            ORDER BY aa.data DESC
            """)
    List<AtendimentoAssuncao> findByAtendimentoIdIn(@Param("atendimentoIds") Collection<Long> atendimentoIds);
}
