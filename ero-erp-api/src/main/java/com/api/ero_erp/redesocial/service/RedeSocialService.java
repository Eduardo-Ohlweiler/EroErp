package com.api.ero_erp.redesocial.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.redesocial.dtos.RedeSocialItemDto;
import com.api.ero_erp.redesocial.entity.RedeSocial;
import com.api.ero_erp.redesocial.repository.RedeSocialRepository;
import com.api.ero_erp.tiporedesocial.entity.TipoRedeSocial;
import com.api.ero_erp.tiporedesocial.service.TipoRedeSocialService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RedeSocialService {

    private final RedeSocialRepository  redeSocialRepository;
    private final TipoRedeSocialService tipoRedeSocialService;
    private final SecurityUtils         securityUtils;

    public RedeSocialService(
            RedeSocialRepository  redeSocialRepository,
            TipoRedeSocialService tipoRedeSocialService,
            SecurityUtils         securityUtils
    ) {
        this.redeSocialRepository  = redeSocialRepository;
        this.tipoRedeSocialService = tipoRedeSocialService;
        this.securityUtils         = securityUtils;
    }

    @Transactional(readOnly = true)
    public RedeSocial findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return redeSocialRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Rede social não encontrada"));
    }

    @Transactional
    public void sincronizarRedesSociais(Pessoa pessoa, List<RedeSocialItemDto> dtos, Cliente cliente) {

        if (dtos == null || dtos.isEmpty()) {
            redeSocialRepository.deleteAll(
                    redeSocialRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId())
            );
            return;
        }

        Set<Long> idsRecebidos = dtos.stream()
                .filter(d -> d.id() != null)
                .map(RedeSocialItemDto::id)
                .collect(Collectors.toSet());

        // Remove os que não vieram
        List<RedeSocial> existentes = redeSocialRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId());
        existentes.stream()
                .filter(e -> !idsRecebidos.contains(e.getId()))
                .forEach(redeSocialRepository::delete);

        for (RedeSocialItemDto dto : dtos) {

            TipoRedeSocial tipoRedeSocial = tipoRedeSocialService.findById(dto.tipoRedeSocialId());

            if (dto.id() != null) {
                // Atualiza existente
                RedeSocial redeSocial = redeSocialRepository.findByIdAndClienteId(dto.id(), cliente.getId())
                        .orElseThrow(() -> new NotFoundException("Rede social não encontrada"));
                redeSocial.setTipoRedeSocial(tipoRedeSocial);
                redeSocial.setUsuario(dto.usuario());
                redeSocial.setUrl(dto.url());
                redeSocial.setObservacao(dto.observacao());
                RedeSocial salva = redeSocialRepository.save(redeSocial);

                pessoa.getRedesSociais().removeIf(e -> e.getId().equals(salva.getId()));
                pessoa.getRedesSociais().add(salva);
            } else {
                // Cria nova
                RedeSocial redeSocial = new RedeSocial();
                redeSocial.setCliente(cliente);
                redeSocial.setPessoa(pessoa);
                redeSocial.setTipoRedeSocial(tipoRedeSocial);
                redeSocial.setUsuario(dto.usuario());
                redeSocial.setUrl(dto.url());
                redeSocial.setObservacao(dto.observacao());
                RedeSocial salva = redeSocialRepository.save(redeSocial);
                pessoa.getRedesSociais().add(salva);
            }
        }
    }
}