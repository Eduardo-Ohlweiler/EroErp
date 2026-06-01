package com.api.ero_erp.whatsapp.whatsapplog.service;

import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.whatsapp.whatsapplog.entity.WhatsappLog;
import com.api.ero_erp.whatsapp.whatsapplog.enums.WhatsappLogStatus;
import com.api.ero_erp.whatsapp.whatsapplog.repository.WhatsappLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WhatsappLogService {

    private final WhatsappLogRepository repository;

    public WhatsappLogService(WhatsappLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void criarPendente(Compromisso compromisso, String phoneCliente) {
        WhatsappLog log = new WhatsappLog();
        log.setCliente(compromisso.getCliente());
        log.setCompromisso(compromisso);
        log.setUsuario(compromisso.getUsuario());
        log.setPessoa(compromisso.getPessoa());
        log.setStatus(WhatsappLogStatus.PENDENTE);
        log.setPhoneCliente(phoneCliente);
        repository.save(log);
    }

    @Transactional
    public void marcarEnviado(WhatsappLog log) {
        log.setStatus(WhatsappLogStatus.ENVIADO);
        log.setEnviadoEm(LocalDateTime.now());
        repository.save(log);
    }

    @Transactional
    public void marcarErro(WhatsappLog log, String mensagemErro) {
        log.setStatus(WhatsappLogStatus.ERRO);
        log.setErro(mensagemErro);
        repository.save(log);
    }

    @Transactional
    public void cancelarPorCompromisso(Long compromissoId) {
        repository.findAllByCompromissoIdAndStatus(compromissoId, WhatsappLogStatus.PENDENTE)
                .forEach(log -> {
                    log.setStatus(WhatsappLogStatus.CANCELADO);
                    repository.save(log);
                });
    }

    @Transactional(readOnly = true)
    public List<WhatsappLog> buscarPendentes() {
        return repository.findAllByStatusWithDetails(WhatsappLogStatus.PENDENTE);
    }
}
