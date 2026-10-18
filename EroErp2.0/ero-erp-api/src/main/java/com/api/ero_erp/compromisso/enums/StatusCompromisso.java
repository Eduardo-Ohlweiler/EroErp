package com.api.ero_erp.compromisso.enums;

/**
 * Situação do compromisso — um status só, no lugar dos dois booleanos do
 * antigo (que deixavam "cancelado e concluído" ao mesmo tempo).
 *
 * <p>{@code AGENDADO} e {@code CONFIRMADO} estão abertos: ocupam a agenda e
 * aceitam alteração. Os outros três encerram e não voltam.
 */
public enum StatusCompromisso {

    AGENDADO,
    CONFIRMADO,
    CONCLUIDO,
    CANCELADO,
    FALTOU;

    public boolean aberto() {
        return this == AGENDADO || this == CONFIRMADO;
    }

    /** Cancelado e falta não ocupam o horário: a pessoa não esteve lá. */
    public boolean ocupaHorario() {
        return this != CANCELADO && this != FALTOU;
    }
}
