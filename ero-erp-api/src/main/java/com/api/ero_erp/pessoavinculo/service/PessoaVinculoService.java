package com.api.ero_erp.pessoavinculo.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import com.api.ero_erp.pessoavinculo.dtos.PessoaVinculoItemDto;
import com.api.ero_erp.pessoavinculo.entity.PessoaVinculo;
import com.api.ero_erp.pessoavinculo.repository.PessoaVinculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PessoaVinculoService {

    private final PessoaVinculoRepository pessoaVinculoRepository;
    private final PessoaRepository        pessoaRepository;

    public PessoaVinculoService(
            PessoaVinculoRepository pessoaVinculoRepository,
            PessoaRepository        pessoaRepository
    ) {
        this.pessoaVinculoRepository = pessoaVinculoRepository;
        this.pessoaRepository        = pessoaRepository;
    }

    @Transactional
    public void sincronizarVinculos(Pessoa pessoa, List<PessoaVinculoItemDto> dtos, Cliente cliente) {

        List<PessoaVinculo> existentes = pessoaVinculoRepository
                .findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId());

        if (dtos == null || dtos.isEmpty()) {
            existentes.forEach(v -> {
                removerDasColecoes(pessoa, v.getId());
                pessoaVinculoRepository.delete(v);
            });
            return;
        }

        Set<Long> idsRecebidos = dtos.stream()
                .map(PessoaVinculoItemDto::id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Remove os vínculos que não vieram no payload (órfãos)
        existentes.stream()
                .filter(v -> !idsRecebidos.contains(v.getId()))
                .forEach(v -> {
                    removerDasColecoes(pessoa, v.getId());
                    pessoaVinculoRepository.delete(v);
                });

        // Garante que as remoções sejam aplicadas antes dos inserts, evitando
        // conflito com a UNIQUE (cliente, origem, destino) por reordenação do Hibernate.
        pessoaVinculoRepository.flush();

        for (PessoaVinculoItemDto dto : dtos) {

            if (pessoa.getId().equals(dto.pessoaId()))
                throw new BadRequestException("Não é possível vincular a pessoa a si mesma");

            if (dto.id() != null) {
                // Atualização: mantém o par; ajusta tipo (na orientação gravada) e observação
                PessoaVinculo vinculo = pessoaVinculoRepository
                        .findByIdAndClienteId(dto.id(), cliente.getId())
                        .orElseThrow(() -> new NotFoundException("Vínculo não encontrado"));

                boolean pessoaEhOrigem = vinculo.getPessoaOrigem().getId().equals(pessoa.getId());
                vinculo.setTipo(pessoaEhOrigem ? dto.tipo() : dto.tipo().inverso());
                vinculo.setObservacao(dto.observacao());

                PessoaVinculo salvo = pessoaVinculoRepository.save(vinculo);
                substituirNasColecoes(pessoa, salvo);

            } else {
                Pessoa outra = pessoaRepository.findByIdAndClienteId(dto.pessoaId(), cliente.getId())
                        .orElseThrow(() -> new NotFoundException("Pessoa do vínculo não encontrada"));

                // Orientação canônica: origem = menor id (permite UNIQUE simples e evita par duplicado)
                boolean pessoaEhOrigem = pessoa.getId().compareTo(outra.getId()) < 0;
                Pessoa origem  = pessoaEhOrigem ? pessoa : outra;
                Pessoa destino = pessoaEhOrigem ? outra  : pessoa;
                var    tipoCanonico = pessoaEhOrigem ? dto.tipo() : dto.tipo().inverso();

                boolean jaExiste = pessoaVinculoRepository
                        .existsByClienteIdAndPessoaOrigem_IdAndPessoaDestino_Id(
                                cliente.getId(), origem.getId(), destino.getId());
                if (jaExiste)
                    throw new BadRequestException("Já existe vínculo com esta pessoa");

                PessoaVinculo vinculo = new PessoaVinculo();
                vinculo.setCliente(cliente);
                vinculo.setPessoaOrigem(origem);
                vinculo.setPessoaDestino(destino);
                vinculo.setTipo(tipoCanonico);
                vinculo.setObservacao(dto.observacao());

                PessoaVinculo salvo = pessoaVinculoRepository.save(vinculo);
                adicionarNasColecoes(pessoa, salvo);
            }
        }
    }

    // ─── Coerência das coleções em memória (espelha o padrão do EnderecoService) ──

    private void removerDasColecoes(Pessoa pessoa, Long vinculoId) {
        if (vinculoId == null) return;
        pessoa.getVinculosComoOrigem().removeIf(v -> vinculoId.equals(v.getId()));
        pessoa.getVinculosComoDestino().removeIf(v -> vinculoId.equals(v.getId()));
    }

    private void adicionarNasColecoes(Pessoa pessoa, PessoaVinculo salvo) {
        if (salvo.getPessoaOrigem() != null
                && pessoa.getId().equals(salvo.getPessoaOrigem().getId())) {
            pessoa.getVinculosComoOrigem().add(salvo);
        } else {
            pessoa.getVinculosComoDestino().add(salvo);
        }
    }

    private void substituirNasColecoes(Pessoa pessoa, PessoaVinculo salvo) {
        removerDasColecoes(pessoa, salvo.getId());
        adicionarNasColecoes(pessoa, salvo);
    }
}
