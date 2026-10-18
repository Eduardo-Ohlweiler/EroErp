package com.api.ero_erp.compromisso.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Uma linha por ocorrência (uma só, sem recorrência). O choque do responsável
 * impede salvar; o de convidado é só aviso — a tela mostra os dois.
 *
 * @param bloqueia algum choque é do responsável: salvar dará 409
 */
public record DisponibilidadeResponseDto(List<Ocorrencia> ocorrencias, boolean bloqueia) {

    public record Ocorrencia(Instant inicio, Instant fim, List<Choque> choques) {}

    /**
     * @param responsavel o usuário em choque é o responsável do compromisso
     *                    que se está montando (não o do que já existe)
     */
    public record Choque(UUID usuarioId,
                         String usuarioNome,
                         boolean responsavel,
                         UUID compromissoId,
                         String titulo,
                         Instant inicio,
                         Instant fim) {}
}
