package com.api.ero_erp.configuracaomensagem.repository;

import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoMensagemRepository extends JpaRepository<ConfiguracaoMensagem, Long> {

    Optional<ConfiguracaoMensagem> findByUsuarioIdAndClienteId(Long usuarioId, Long clienteId);
    Optional<ConfiguracaoMensagem> findByUsuarioId(Long usuarioId);
}
