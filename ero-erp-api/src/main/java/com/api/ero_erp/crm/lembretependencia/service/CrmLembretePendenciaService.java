package com.api.ero_erp.crm.lembretependencia.service;

import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.lembretependencia.dtos.LembretePendenciaItemDto;
import com.api.ero_erp.crm.lembretependencia.dtos.LembretePendenciaResponseDto;
import com.api.ero_erp.crm.lembretependencia.entity.CrmLembretePendencia;
import com.api.ero_erp.crm.lembretependencia.repository.CrmLembretePendenciaRepository;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CrmLembretePendenciaService {

    private final CrmLembretePendenciaRepository repository;

    public CrmLembretePendenciaService(CrmLembretePendenciaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void sincronizar(ConfiguracaoCrm config, List<LembretePendenciaItemDto> dtos) {

        if (dtos == null || dtos.isEmpty()) {
            repository.deleteAll(
                    repository.findByConfiguracaoCrmIdOrderByOrdemAsc(config.getId())
            );
            return;
        }

        Set<Long> idsRecebidos = dtos.stream()
                .filter(d -> d.id() != null)
                .map(LembretePendenciaItemDto::id)
                .collect(Collectors.toSet());

        // Remove os que não vieram
        List<CrmLembretePendencia> existentes =
                repository.findByConfiguracaoCrmIdOrderByOrdemAsc(config.getId());
        existentes.stream()
                .filter(e -> !idsRecebidos.contains(e.getId()))
                .forEach(repository::delete);

        for (int i = 0; i < dtos.size(); i++) {
            LembretePendenciaItemDto dto = dtos.get(i);
            Integer ordem = dto.ordem() != null ? dto.ordem() : i;

            if (dto.id() != null) {
                CrmLembretePendencia lembrete = repository.findById(dto.id())
                        .filter(l -> l.getConfiguracaoCrm().getId().equals(config.getId()))
                        .orElseThrow(() -> new NotFoundException("Lembrete de pendência não encontrado, verifique!"));
                lembrete.setTempoHoras(dto.tempoHoras());
                lembrete.setMensagem(dto.mensagem());
                lembrete.setOrdem(ordem);
                repository.save(lembrete);
            } else {
                CrmLembretePendencia lembrete = new CrmLembretePendencia();
                lembrete.setConfiguracaoCrm(config);
                lembrete.setTempoHoras(dto.tempoHoras());
                lembrete.setMensagem(dto.mensagem());
                lembrete.setOrdem(ordem);
                repository.save(lembrete);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<LembretePendenciaResponseDto> listar(Long configId) {
        return repository.findByConfiguracaoCrmIdOrderByOrdemAsc(configId)
                .stream()
                .map(l -> new LembretePendenciaResponseDto(
                        l.getId(),
                        l.getTempoHoras(),
                        l.getMensagem(),
                        l.getOrdem()
                ))
                .toList();
    }
}
