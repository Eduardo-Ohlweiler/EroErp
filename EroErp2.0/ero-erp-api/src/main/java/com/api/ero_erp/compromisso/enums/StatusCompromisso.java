package com.api.ero_erp.compromisso.enums;

/**
 * Situação do compromisso — um status só, no lugar dos dois booleanos do
 * antigo (que deixavam "cancelado e concluído" ao mesmo tempo).
 *
 * <p>{@code AGENDADO}, {@code CONFIRMADO} e {@code EM_ATENDIMENTO} estão
 * abertos: ocupam a agenda e aceitam alteração. Os outros três encerram e não
 * voltam. {@code EM_ATENDIMENTO} só existe no compromisso que é consulta: é a
 * situação da consulta, que não tem status próprio (docs/12 §7).
 */
public enum StatusCompromisso {

    AGENDADO,
    CONFIRMADO,
    EM_ATENDIMENTO,
    CONCLUIDO,
    CANCELADO,
    FALTOU;

    public boolean aberto() {
        return this == AGENDADO || this == CONFIRMADO || this == EM_ATENDIMENTO;
    }

    /** Cancelado e falta não ocupam o horário: a pessoa não esteve lá. */
    public boolean ocupaHorario() {
        return this != CANCELADO && this != FALTOU;
    }
}
