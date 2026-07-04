package com.api.ero_erp.crm.atendimento.repository;

import com.api.ero_erp.crm.atendimento.entity.Mensagem;
import com.api.ero_erp.crm.atendimento.enums.DirecaoMensagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    @Query("""
            SELECT m FROM Mensagem m
            WHERE m.atendimento.id = :atendimentoId
              AND m.cliente.id = :clienteId
            """)
    Page<Mensagem> findByAtendimento(
            Pageable pageable,
            @Param("atendimentoId") Long atendimentoId,
            @Param("clienteId")     Long clienteId
    );

    boolean existsByEvolutionMessageId(String evolutionMessageId);

    // Mensagem ENVIADA correspondente a um id da Evolution (para atualizar status entregue/lido).
    Optional<Mensagem> findFirstByEvolutionMessageIdAndDirecao(String evolutionMessageId, DirecaoMensagem direcao);

    // Última mensagem em uma direção dentro do atendimento (para marcar visto/leitura no WhatsApp).
    Optional<Mensagem> findTopByAtendimento_IdAndDirecaoOrderByDataMensagemDesc(Long atendimentoId, DirecaoMensagem direcao);

    @Query("""
            SELECT m FROM Mensagem m
            WHERE m.id = :id AND m.cliente.id = :clienteId
            """)
    Optional<Mensagem> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );
}
