package com.api.ero_erp.configuracaopedido.repository;

import com.api.ero_erp.configuracaopedido.entity.ConfiguracaoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoPedidoRepository extends JpaRepository<ConfiguracaoPedido, Long> {
    Optional<ConfiguracaoPedido> findByClienteId(Long clienteId);
}
