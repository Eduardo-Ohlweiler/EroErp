package com.api.ero_erp.whatsapp.repository;

import com.api.ero_erp.whatsapp.entity.WhatsappConexao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * As consultas já trazem filial e pessoa: o service fala com a Evolution
 * fora de transação (uma resposta lenta não pode prender conexão do banco),
 * e a entidade sai daqui desligada da sessão.
 */
@Repository
public interface WhatsappConexaoRepository extends JpaRepository<WhatsappConexao, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT c FROM WhatsappConexao c
            LEFT JOIN FETCH c.filial f
            LEFT JOIN FETCH f.pessoa
            WHERE c.id = :id AND c.tenant.id = :tenantId
            """)
    Optional<WhatsappConexao> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("""
            SELECT c FROM WhatsappConexao c
            LEFT JOIN FETCH c.filial f
            LEFT JOIN FETCH f.pessoa
            WHERE c.tenant.id = :tenantId
            """)
    List<WhatsappConexao> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("""
            SELECT c FROM WhatsappConexao c
            WHERE c.tenant.id = :tenantId AND c.filial IS NULL
            """)
    Optional<WhatsappConexao> findDoTenant(@Param("tenantId") UUID tenantId);

    @Query("""
            SELECT c FROM WhatsappConexao c
            JOIN FETCH c.filial f
            JOIN FETCH f.pessoa
            WHERE c.tenant.id = :tenantId AND f.id = :filialId
            """)
    Optional<WhatsappConexao> findDaFilial(@Param("tenantId") UUID tenantId, @Param("filialId") UUID filialId);

    /**
     * O webhook: o segredo é a única credencial de quem chama, e é ele que
     * diz a conexão — e, por ela, o tenant. Sem token, não há tenant logado.
     */
    Optional<WhatsappConexao> findByWebhookSegredo(String webhookSegredo);
}
