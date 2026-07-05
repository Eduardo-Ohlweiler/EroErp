package com.api.ero_erp.telefone.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.telefone.dtos.TelefoneItemDto;
import com.api.ero_erp.telefone.entity.Telefone;
import com.api.ero_erp.telefone.repository.TelefoneRepository;
import com.api.ero_erp.telefone.util.TelefoneUtils;
import com.api.ero_erp.tipotelefone.entity.TipoTelefone;
import com.api.ero_erp.tipotelefone.service.TipoTelefoneService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TelefoneService {

    private final TelefoneRepository    telefoneRepository;
    private final TipoTelefoneService   tipoTelefoneService;
    private final SecurityUtils         securityUtils;

    public TelefoneService(
            TelefoneRepository  telefoneRepository,
            TipoTelefoneService tipoTelefoneService,
            SecurityUtils       securityUtils
    ) {
        this.telefoneRepository     = telefoneRepository;
        this.tipoTelefoneService    = tipoTelefoneService;
        this.securityUtils          = securityUtils;
    }

    @Transactional(readOnly = true)
    public Telefone findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return telefoneRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Telefone não encontrado"));
    }

    @Transactional
    public void sincronizarTelefones(Pessoa pessoa, List<TelefoneItemDto> dtos, Cliente cliente) {

        if(dtos == null || dtos.isEmpty()) {
            telefoneRepository.deleteAll(
                    telefoneRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId())
            );
            return;
        }

        long quantidadePrincipais = dtos.stream()
                .filter(d -> Boolean.TRUE.equals(d.principal()))
                .count();
        if (quantidadePrincipais > 1)
            throw new BadRequestException("Apenas um telefone pode ser o principal");

        validarNumerosUnicos(pessoa, dtos, cliente);

        Set<Long> idsRecebidos = dtos.stream()
                .filter(d -> d.id() != null)
                .map(TelefoneItemDto::id)
                .collect(Collectors.toSet());

        // Remove os que não vieram
        List<Telefone> existentes = telefoneRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId());
        existentes.stream()
                .filter(e -> !idsRecebidos.contains(e.getId()))
                .forEach(telefoneRepository::delete);

        // Só um seja principal
        boolean temPrincipal = quantidadePrincipais == 1;

        for (int i = 0; i < dtos.size(); i++) {
            TelefoneItemDto dto = dtos.get(i);

            TipoTelefone tipoTelefone = tipoTelefoneService.findById(dto.tipoTelefoneId());
            boolean principal   = Boolean.TRUE.equals(dto.principal());

            // Se nenhum marcou principal, o primeiro vira principal
            if (!temPrincipal && i == 0) principal = true;

            if (dto.id() != null) {
                // Atualiza existente
                Telefone telefone = telefoneRepository.findByIdAndClienteId(dto.id(), cliente.getId())
                        .orElseThrow(() -> new NotFoundException("Telefone não encontrado"));
                telefone.setTipoTelefone(tipoTelefone);
                telefone.setNumero(dto.numero());
                telefone.setCodigoPais(TelefoneUtils.defaultDdi(dto.codigoPais()));
                telefone.setObservacao(dto.observacao());
                telefone.setPrincipal(principal);
                Telefone salvo = telefoneRepository.save(telefone);

                pessoa.getTelefones().removeIf(e -> e.getId().equals(salvo.getId()));
                pessoa.getTelefones().add(salvo);
            } else {
                // Cria novo
                Telefone telefone = new Telefone();
                telefone.setCliente(cliente);
                telefone.setPessoa(pessoa);
                telefone.setTipoTelefone(tipoTelefone);
                telefone.setNumero(dto.numero());
                telefone.setCodigoPais(TelefoneUtils.defaultDdi(dto.codigoPais()));
                telefone.setObservacao(dto.observacao());
                telefone.setPrincipal(principal);

                Telefone salvo = telefoneRepository.save(telefone);
                pessoa.getTelefones().add(salvo);
            }
        }
    }

    /**
     * Garante que um número pertença a apenas UM cadastro do cliente: bloqueia números
     * repetidos no próprio payload e números já cadastrados em outra pessoa, informando
     * de quem é. A comparação usa as variantes com/sem o nono dígito brasileiro
     * ({@link TelefoneUtils#variantes}) — para o WhatsApp/CRM as duas formas são o
     * mesmo contato, e é isso que evita atendimentos duplicados no Kanban.
     */
    private void validarNumerosUnicos(Pessoa pessoa, List<TelefoneItemDto> dtos, Cliente cliente) {
        Set<String> vistos = new java.util.HashSet<>();

        for (TelefoneItemDto dto : dtos) {
            String completo = TelefoneUtils.montarNumeroEnvio(dto.codigoPais(), dto.numero());

            if (!vistos.add(TelefoneUtils.canonico(completo)))
                throw new BadRequestException(
                        "Telefone " + dto.numero() + " informado mais de uma vez, verifique!");

            telefoneRepository.findByClienteIdAndNumeroCompleto(cliente.getId(), TelefoneUtils.variantes(completo))
                    .stream()
                    .filter(t -> t.getPessoa() != null && !t.getPessoa().getId().equals(pessoa.getId()))
                    .findFirst()
                    .ifPresent(t -> {
                        throw new BadRequestException(
                                "O telefone " + dto.numero() + " já está cadastrado para "
                                + t.getPessoa().getNome() + ", verifique!");
                    });
        }
    }
}
