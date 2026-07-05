package com.api.ero_erp.telefone.repository;

import com.api.ero_erp.telefone.entity.Telefone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TelefoneRepository extends JpaRepository<Telefone, Long> {

    List<Telefone> findByPessoaIdAndClienteId(Long pessoaId, Long clienteId);
    Optional<Telefone> findByIdAndClienteId(Long id, Long clienteId);
    Optional<Telefone> findFirstByPessoaIdAndClienteIdAndTipoTelefoneId(Long pessoaId, Long clienteId, Long tipoTelefoneId);

    Optional<Telefone> findFirstByClienteIdAndNumero(Long clienteId, String numero);

    /**
     * Auto-vínculo CRM: o número recebido do webhook vem COMPLETO (DDI + DDD + número,
     * ex.: "5551992006747"). Compara contra a concatenação DDI + número cadastrado,
     * aceitando as variantes com/sem o nono dígito brasileiro (o remoteJid do WhatsApp
     * identifica contas antigas sem o 9; o cadastro costuma ter o número com o 9).
     * Pode haver mais de um telefone com o mesmo número (pessoas distintas ou duplicado),
     * então retorna lista com o principal primeiro — o caller usa o primeiro resultado.
     */
    @Query("""
            SELECT t FROM Telefone t
            WHERE t.cliente.id = :clienteId
              AND CONCAT(t.codigoPais, t.numero) IN :numeros
            ORDER BY t.principal DESC, t.id ASC
            """)
    List<Telefone> findByClienteIdAndNumeroCompleto(@Param("clienteId") Long clienteId,
                                                    @Param("numeros") List<String> numeros);

    /**
     * Fallback tolerante para números legados (sem DDI ou formatados de forma diferente):
     * casa quando o número cadastrado é sufixo do número recebido do webhook.
     * Ordena pelo mais específico (número cadastrado mais longo) primeiro.
     */
    @Query("""
            SELECT t FROM Telefone t
            WHERE t.cliente.id = :clienteId
              AND CAST(:numero AS string) LIKE CONCAT('%', t.numero)
            ORDER BY LENGTH(t.numero) DESC
            """)
    List<Telefone> findByClienteIdAndNumeroSufixo(@Param("clienteId") Long clienteId,
                                                  @Param("numero") String numero);
}
