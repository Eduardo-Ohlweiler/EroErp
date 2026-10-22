package com.api.ero_erp.whatsapp.controller;

import com.api.ero_erp.whatsapp.dtos.ConectarDto;
import com.api.ero_erp.whatsapp.dtos.ConexaoDto;
import com.api.ero_erp.whatsapp.dtos.ConexaoUpdateDto;
import com.api.ero_erp.whatsapp.dtos.ModoUpdateDto;
import com.api.ero_erp.whatsapp.dtos.QrCodeDto;
import com.api.ero_erp.whatsapp.dtos.ServidorResponseDto;
import com.api.ero_erp.whatsapp.dtos.ServidorUpdateDto;
import com.api.ero_erp.whatsapp.dtos.WhatsappPainelDto;
import com.api.ero_erp.whatsapp.service.WhatsappService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Integrações › WhatsApp. Três públicos, e cada rota diz o seu:
 * <ul>
 *   <li>o superadmin cadastra o servidor, escolhe o modo do tenant e mexe na
 *       sobrescrita e na exclusão de cada conexão;</li>
 *   <li>quem lê a tela {@code WHATSAPP} vê as conexões e o status;</li>
 *   <li>quem escreve nela (e todo ADMIN) conecta pelo QR e desconecta.</li>
 * </ul>
 * Nenhuma resposta leva apikey; a instância só sai para o superadmin.
 */
@RestController
@RequestMapping("/integracoes/whatsapp")
@RequiredArgsConstructor
@Tag(name = "WhatsApp")
public class WhatsappController {

    private final WhatsappService whatsappService;

    @GetMapping("/servidor")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "O servidor Evolution do sistema", description = "Sem a apikey: só se há uma.")
    public ResponseEntity<ServidorResponseDto> servidor() {
        return ResponseEntity.ok(whatsappService.servidor());
    }

    @PutMapping("/servidor")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Grava o servidor Evolution", description = "Apikey vazia mantém a gravada.")
    public ResponseEntity<ServidorResponseDto> salvarServidor(@Valid @RequestBody ServidorUpdateDto dto) {
        return ResponseEntity.ok(whatsappService.salvarServidor(dto));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('WHATSAPP_LER')")
    @Operation(summary = "Modo e conexões do tenant",
            description = "O status vem do banco; a tela consulta cada conexão em `/conexoes/{id}/status`.")
    public ResponseEntity<WhatsappPainelDto> painel() {
        return ResponseEntity.ok(whatsappService.painel());
    }

    @PatchMapping("/modo")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Um número para o tenant ou um por filial")
    public ResponseEntity<WhatsappPainelDto> alterarModo(@Valid @RequestBody ModoUpdateDto dto) {
        return ResponseEntity.ok(whatsappService.alterarModo(dto));
    }

    @PostMapping("/conexoes/conectar")
    @PreAuthorize("hasAuthority('WHATSAPP_ESCREVER')")
    @Operation(summary = "Conecta pelo QR",
            description = """
                    Cria a conexão se ainda não existe e devolve o QR. Chamar de
                    novo renova o QR expirado. `filialId` só no modo POR_FILIAL.""")
    public ResponseEntity<QrCodeDto> conectar(@RequestBody ConectarDto dto) {
        return ResponseEntity.ok(whatsappService.conectar(dto));
    }

    @GetMapping("/conexoes/{id}/status")
    @PreAuthorize("hasAuthority('WHATSAPP_LER')")
    @Operation(summary = "Status da conexão, perguntado à Evolution agora")
    public ResponseEntity<ConexaoDto> status(@PathVariable UUID id) {
        return ResponseEntity.ok(whatsappService.status(id));
    }

    @PostMapping("/conexoes/{id}/desconectar")
    @PreAuthorize("hasAuthority('WHATSAPP_ESCREVER')")
    @Operation(summary = "Desconecta o aparelho", description = "A instância fica no servidor para conectar de novo.")
    public ResponseEntity<ConexaoDto> desconectar(@PathVariable UUID id) {
        return ResponseEntity.ok(whatsappService.desconectar(id));
    }

    @PatchMapping("/conexoes/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Sobrescrita do servidor e ativo da conexão")
    public ResponseEntity<ConexaoDto> atualizar(@PathVariable UUID id, @Valid @RequestBody ConexaoUpdateDto dto) {
        return ResponseEntity.ok(whatsappService.atualizar(id, dto));
    }

    @DeleteMapping("/conexoes/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Exclui a conexão", description = "Apaga a instância no servidor e a linha aqui.")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        whatsappService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
