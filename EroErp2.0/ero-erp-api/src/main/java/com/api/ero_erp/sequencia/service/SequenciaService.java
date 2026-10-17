package com.api.ero_erp.sequencia.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * O código curto por tenant — serviço 1, 2, 3… —, o número que gente lê.
 * O id continua UUID. Ver a migration 019.
 *
 * <p>Um comando só, atômico: o {@code ON CONFLICT … DO UPDATE} trava a linha
 * do contador até o commit, então duas gravações simultâneas não repetem
 * número. {@code MANDATORY} porque o número só pode ser pedido de dentro da
 * gravação que o consome: se ela falhar, o rollback o devolve, sem buraco.
 */
@Service
@RequiredArgsConstructor
public class SequenciaService {

    /** As chaves gravadas em {@code tenant_sequencia.chave}. Renomear exige migration. */
    public static final String SERVICO = "SERVICO";

    private static final String PROXIMO = """
            INSERT INTO tenant_sequencia (tenant_id, chave, ultimo)
            VALUES (?, ?, 1)
            ON CONFLICT (tenant_id, chave)
            DO UPDATE SET ultimo = tenant_sequencia.ultimo + 1
            RETURNING ultimo
            """;

    private final JdbcTemplate jdbcTemplate;

    @Transactional(propagation = Propagation.MANDATORY)
    public long proximo(UUID tenantId, String chave) {
        Long numero = jdbcTemplate.queryForObject(PROXIMO, Long.class, tenantId, chave);
        if (numero == null) {
            throw new IllegalStateException("Contador " + chave + " não devolveu número");
        }
        return numero;
    }
}
