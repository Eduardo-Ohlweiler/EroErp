package com.api.ero_erp.compromisso.enums;

import java.time.ZonedDateTime;

/**
 * Como a série se repete. A n-ésima ocorrência é calculada <b>a partir da
 * primeira</b>, e não da anterior: "todo dia 31" continua no 31 depois de
 * fevereiro, em vez de escorregar para o 28 de vez.
 *
 * <p>Quinzenal é 14 dias, para cair no mesmo dia da semana (o antigo somava 15).
 * Domingo não é empurrado: a prévia mostra o dia da semana e quem agenda decide.
 */
public enum TipoRecorrencia {

    DIARIO,
    SEMANAL,
    QUINZENAL,
    MENSAL,
    TRIMESTRAL,
    SEMESTRAL,
    ANUAL;

    /** A ocorrência {@code n} (0 é a própria base), no fuso da base. */
    public ZonedDateTime ocorrencia(ZonedDateTime base, int n) {
        return switch (this) {
            case DIARIO -> base.plusDays(n);
            case SEMANAL -> base.plusWeeks(n);
            case QUINZENAL -> base.plusDays(14L * n);
            case MENSAL -> base.plusMonths(n);
            case TRIMESTRAL -> base.plusMonths(3L * n);
            case SEMESTRAL -> base.plusMonths(6L * n);
            case ANUAL -> base.plusYears(n);
        };
    }
}
