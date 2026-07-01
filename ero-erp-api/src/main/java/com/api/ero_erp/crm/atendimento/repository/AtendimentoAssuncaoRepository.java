package com.api.ero_erp.crm.atendimento.repository;

import com.api.ero_erp.crm.atendimento.entity.AtendimentoAssuncao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AtendimentoAssuncaoRepository extends JpaRepository<AtendimentoAssuncao, Long> {

    List<AtendimentoAssuncao> findByAtendimentoIdOrderByDataDesc(Long atendimentoId);
}
