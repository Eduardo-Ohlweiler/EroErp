package com.api.ero_erp.compromisso.dtos;

import java.util.List;

public record CompromissoDashboardDto(
        long totalAgendados,
        long totalCancelados,
        long totalConcluidos,
        long totalHoje,
        long totalSemana,
        List<ProximoDto>   proximosHoje,
        List<PorPessoaDto> topPessoas,
        List<PorDiaDto>    ultimosSeteDias,
        List<PorHoraDto>   distribuicaoHorario
) {
    public record ProximoDto(Long id, String titulo, String inicio, String fim, String pessoaNome) {}
    public record PorPessoaDto(String pessoaNome, long total) {}
    public record PorDiaDto(String diaSemana, String data, long total) {}
    public record PorHoraDto(int hora, long total) {}
}
