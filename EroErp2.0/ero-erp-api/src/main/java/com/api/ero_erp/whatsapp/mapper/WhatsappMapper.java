package com.api.ero_erp.whatsapp.mapper;

import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.whatsapp.dtos.ConexaoAdminResponseDto;
import com.api.ero_erp.whatsapp.dtos.ConexaoDto;
import com.api.ero_erp.whatsapp.dtos.ConexaoResponseDto;
import com.api.ero_erp.whatsapp.dtos.ServidorResponseDto;
import com.api.ero_erp.whatsapp.entity.WhatsappConexao;
import com.api.ero_erp.whatsapp.entity.WhatsappServidor;
import com.api.ero_erp.whatsapp.enums.StatusConexao;

import java.util.UUID;

public final class WhatsappMapper {

    private WhatsappMapper() {}

    public static ServidorResponseDto toServidor(WhatsappServidor servidor) {
        if (servidor == null) return new ServidorResponseDto(false, null, false, null, null);
        return new ServidorResponseDto(
                true,
                servidor.getUrl(),
                servidor.getApiKey() != null,
                servidor.getAtivo(),
                servidor.getUpdatedAt() != null ? servidor.getUpdatedAt() : servidor.getCreatedAt());
    }

    /**
     * A linha da tela. O formato é escolhido aqui, pela role, e não em cada
     * chamada: a instância e a sobrescrita só saem para o superadmin.
     *
     * @param conexao nula quando a linha ainda não foi conectada
     * @param filial  nula na linha do tenant inteiro
     */
    public static ConexaoDto toLinha(WhatsappConexao conexao, Filial filial, boolean superadmin) {
        String filialNome = filial != null ? filial.getPessoa().getNome() : null;
        String filialCor = filial != null ? filial.getCor() : null;

        if (conexao == null) {
            return superadmin
                    ? new ConexaoAdminResponseDto(null, filialId(filial), filialNome, filialCor,
                            StatusConexao.DESCONECTADO, null, null, true, null, null, false)
                    : new ConexaoResponseDto(null, filialId(filial), filialNome, filialCor,
                            StatusConexao.DESCONECTADO, null, null, true);
        }

        if (superadmin) {
            return new ConexaoAdminResponseDto(
                    conexao.getId(), filialId(filial), filialNome, filialCor,
                    conexao.getStatus(), conexao.getStatusEm(), conexao.getNumero(), conexao.getAtivo(),
                    conexao.getInstancia(), conexao.getUrl(), conexao.getApiKey() != null);
        }
        return new ConexaoResponseDto(
                conexao.getId(), filialId(filial), filialNome, filialCor,
                conexao.getStatus(), conexao.getStatusEm(), conexao.getNumero(), conexao.getAtivo());
    }

    /** A linha de uma conexão gravada, com a filial dela. */
    public static ConexaoDto toLinha(WhatsappConexao conexao, boolean superadmin) {
        return toLinha(conexao, conexao.getFilial(), superadmin);
    }

    private static UUID filialId(Filial filial) {
        return filial != null ? filial.getId() : null;
    }
}
