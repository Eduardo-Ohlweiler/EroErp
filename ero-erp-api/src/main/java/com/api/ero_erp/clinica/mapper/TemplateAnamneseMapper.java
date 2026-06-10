package com.api.ero_erp.clinica.mapper;

import com.api.ero_erp.clinica.dto.CampoAnamneseResponseDto;
import com.api.ero_erp.clinica.dto.TemplateAnamneseResponseDto;
import com.api.ero_erp.clinica.dto.TemplateAnamnesesSummaryDto;
import com.api.ero_erp.clinica.entity.CampoAnamnese;
import com.api.ero_erp.clinica.entity.TemplateAnamnese;

import java.util.List;

public class TemplateAnamneseMapper {

    private TemplateAnamneseMapper() {}

    public static TemplateAnamneseResponseDto toResponseDto(TemplateAnamnese t) {
        List<CampoAnamneseResponseDto> campos = t.getCampos() != null
                ? t.getCampos().stream().map(TemplateAnamneseMapper::toCampoDto).toList()
                : List.of();
        return new TemplateAnamneseResponseDto(
                t.getId(),
                t.getNome(),
                t.getFinalidade().name(),
                t.getDescricao(),
                t.getAtivo(),
                campos
        );
    }

    public static TemplateAnamnesesSummaryDto toSummaryDto(TemplateAnamnese t) {
        int totalCampos = t.getCampos() != null ? t.getCampos().size() : 0;
        return new TemplateAnamnesesSummaryDto(
                t.getId(),
                t.getNome(),
                t.getFinalidade().name(),
                t.getDescricao(),
                t.getAtivo(),
                totalCampos
        );
    }

    public static CampoAnamneseResponseDto toCampoDto(CampoAnamnese c) {
        return new CampoAnamneseResponseDto(
                c.getId(),
                c.getSecao(),
                c.getRotulo(),
                c.getTipo().name(),
                c.getOpcoes(),
                c.getOrdem(),
                c.getObrigatorio(),
                c.getAtivo()
        );
    }
}
