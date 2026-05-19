package com.api.ero_erp.endereco.service;

import com.api.ero_erp.cidade.entity.Cidade;
import com.api.ero_erp.cidade.service.CidadeService;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.endereco.dtos.EnderecoItemDto;
import com.api.ero_erp.endereco.entity.Endereco;
import com.api.ero_erp.endereco.repository.EnderecoRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.tipoendereco.entity.TipoEndereco;
import com.api.ero_erp.tipoendereco.service.TipoEnderecoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EnderecoService {

    private final EnderecoRepository  enderecoRepository;
    private final TipoEnderecoService tipoEnderecoService;
    private final CidadeService       cidadeService;
    private final SecurityUtils       securityUtils;

    public EnderecoService(
            EnderecoRepository  enderecoRepository,
            TipoEnderecoService tipoEnderecoService,
            CidadeService       cidadeService,
            SecurityUtils       securityUtils
    ) {
        this.enderecoRepository  = enderecoRepository;
        this.tipoEnderecoService = tipoEnderecoService;
        this.cidadeService       = cidadeService;
        this.securityUtils       = securityUtils;
    }

    @Transactional(readOnly = true)
    public Endereco findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return enderecoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Endereço não encontrado"));
    }

    @Transactional
    public void sincronizarEnderecos(Pessoa pessoa, List<EnderecoItemDto> dtos, Cliente cliente) {

        if (dtos == null || dtos.isEmpty()) {
            enderecoRepository.deleteAll(
                    enderecoRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId())
            );
            return;
        }

        long quantidadePrincipais = dtos.stream()
                .filter(d -> Boolean.TRUE.equals(d.principal()))
                .count();
        if (quantidadePrincipais > 1)
            throw new BadRequestException("Apenas um endereço pode ser o principal");

        Set<Long> idsRecebidos = dtos.stream()
                .filter(d -> d.id() != null)
                .map(EnderecoItemDto::id)
                .collect(Collectors.toSet());

        // Remove os que não vieram
        List<Endereco> existentes = enderecoRepository.findByPessoaIdAndClienteId(
                pessoa.getId(), cliente.getId()
        );
        existentes.stream()
                .filter(e -> !idsRecebidos.contains(e.getId()))
                .forEach(enderecoRepository::delete);

        boolean temPrincipal = quantidadePrincipais == 1;

        for (int i = 0; i < dtos.size(); i++) {
            EnderecoItemDto dto = dtos.get(i);

            TipoEndereco tipoEndereco = tipoEnderecoService.findById(dto.tipoEnderecoId());
            Cidade       cidade       = cidadeService.findById(dto.cidadeId());
            boolean      principal    = Boolean.TRUE.equals(dto.principal());

            if (!temPrincipal && i == 0) principal = true;

            if (dto.id() != null) {
                Endereco endereco = enderecoRepository.findByIdAndClienteId(dto.id(), cliente.getId())
                        .orElseThrow(() -> new NotFoundException("Endereço não encontrado"));
                endereco.setTipoEndereco(tipoEndereco);
                endereco.setCidade(cidade);
                endereco.setCep(dto.cep());
                endereco.setRua(dto.rua());
                endereco.setNumero(dto.numero());
                endereco.setBairro(dto.bairro());
                endereco.setComplemento(dto.complemento());
                endereco.setPrincipal(principal);
                Endereco salvo = enderecoRepository.save(endereco);

                pessoa.getEnderecos().removeIf(e -> e.getId().equals(salvo.getId()));
                pessoa.getEnderecos().add(salvo);
            } else {
                Endereco endereco = new Endereco();
                endereco.setCliente(cliente);
                endereco.setPessoa(pessoa);
                endereco.setTipoEndereco(tipoEndereco);
                endereco.setCidade(cidade);
                endereco.setCep(dto.cep());
                endereco.setRua(dto.rua());
                endereco.setNumero(dto.numero());
                endereco.setBairro(dto.bairro());
                endereco.setComplemento(dto.complemento());
                endereco.setPrincipal(principal);
                Endereco salvo = enderecoRepository.save(endereco);
                pessoa.getEnderecos().add(salvo);
            }
        }
    }
}