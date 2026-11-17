package com.api.ero_api.compartilhado.util;

import org.hibernate.exception.ConstraintViolationException;

/**
 * Descobre qual índice único ou check recusou a gravação, para traduzir a violação
 * certa num erro com campo (409 com {@code erros[]}) e deixar as outras seguirem para
 * o tratamento global. O Hibernate extrai o nome da constraint da mensagem do PostgreSQL.
 */
public final class RestricaoViolada {

    private RestricaoViolada() {
    }

    /** A violação (em qualquer ponto da cadeia de causas) veio da constraint indicada? Sem diferenciar caixa. */
    public static boolean violou(Throwable e, String restricao) {
        for (Throwable c = e; c != null; c = c.getCause()) {
            if (c instanceof ConstraintViolationException cve && restricao.equalsIgnoreCase(cve.getConstraintName())) {
                return true;
            }
        }
        return false;
    }
}
