package com.api.ero_erp.configuracaomensagem.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.configuracaomensagem.dtos.ConfiguracaoMensagemResponseDto;
import com.api.ero_erp.configuracaomensagem.dtos.ConfiguracaoMensagemUpsertDto;
import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;
import com.api.ero_erp.configuracaomensagem.mapper.ConfiguracaoMensagemMapper;
import com.api.ero_erp.configuracaomensagem.repository.ConfiguracaoMensagemRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ConfiguracaoMensagemService {

    private final ConfiguracaoMensagemRepository repository;
    private final ClienteService                 clienteService;
    private final UsuarioService                 usuarioService;
    private final SecurityUtils                  securityUtils;

    public ConfiguracaoMensagemService(
            ConfiguracaoMensagemRepository repository,
            ClienteService                 clienteService,
            UsuarioService                 usuarioService,
            SecurityUtils                  securityUtils
    ) {
        this.repository     = repository;
        this.clienteService = clienteService;
        this.usuarioService = usuarioService;
        this.securityUtils  = securityUtils;
    }

    @Transactional(readOnly = true)
    public Optional<ConfiguracaoMensagem> findByUsuarioId(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId);
    }

    @Transactional(readOnly = true)
    public ConfiguracaoMensagemResponseDto getAtual() {
        Long clienteId = securityUtils.getClienteIdLogado();
        Long usuarioId = securityUtils.getUsuarioIdLogado();
        return repository.findByUsuarioIdAndClienteId(usuarioId, clienteId)
                .map(ConfiguracaoMensagemMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public ConfiguracaoMensagemResponseDto salvar(ConfiguracaoMensagemUpsertDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Long     usuarioId = securityUtils.getUsuarioIdLogado();
        Cliente  cliente   = clienteService.findById(clienteId);
        Usuario  usuario   = usuarioService.findById(usuarioId);

        ConfiguracaoMensagem config = repository
                .findByUsuarioIdAndClienteId(usuarioId, clienteId)
                .orElseGet(ConfiguracaoMensagem::new);

        config.setCliente(cliente);
        config.setUsuario(usuario);
        config.setCabecalhoAgendamento(dto.cabecalhoAgendamento());
        config.setRodapeAgendamento(dto.rodapeAgendamento());
        config.setCabecalhoLembrete(dto.cabecalhoLembrete());
        config.setRodapeLembrete(dto.rodapeLembrete());
        config.setCabecalhoCancelamento(dto.cabecalhoCancelamento());
        config.setRodapeCancelamento(dto.rodapeCancelamento());
        config.setCabecalhoConclusao(dto.cabecalhoConclusao());
        config.setRodapeConclusao(dto.rodapeConclusao());

        return ConfiguracaoMensagemMapper.toDto(repository.save(config));
    }

    @Transactional
    public void deletar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        Long usuarioId = securityUtils.getUsuarioIdLogado();
        repository.findByUsuarioIdAndClienteId(usuarioId, clienteId)
                .ifPresent(repository::delete);
    }
}
