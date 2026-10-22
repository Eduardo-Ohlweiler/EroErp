package com.api.ero_erp.whatsapp.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.exceptions.ServicoIndisponivelException;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.filial.repository.FilialRepository;
import com.api.ero_erp.whatsapp.dtos.ConectarDto;
import com.api.ero_erp.whatsapp.dtos.ConexaoDto;
import com.api.ero_erp.whatsapp.dtos.ConexaoUpdateDto;
import com.api.ero_erp.whatsapp.dtos.ModoUpdateDto;
import com.api.ero_erp.whatsapp.dtos.QrCodeDto;
import com.api.ero_erp.whatsapp.dtos.ServidorResponseDto;
import com.api.ero_erp.whatsapp.dtos.ServidorUpdateDto;
import com.api.ero_erp.whatsapp.dtos.WhatsappPainelDto;
import com.api.ero_erp.whatsapp.entity.WhatsappConexao;
import com.api.ero_erp.whatsapp.entity.WhatsappConfiguracao;
import com.api.ero_erp.whatsapp.entity.WhatsappServidor;
import com.api.ero_erp.whatsapp.enums.ModoWhatsapp;
import com.api.ero_erp.whatsapp.enums.StatusConexao;
import com.api.ero_erp.whatsapp.evolution.DestinoEvolution;
import com.api.ero_erp.whatsapp.evolution.EstadoEvolution;
import com.api.ero_erp.whatsapp.evolution.EvolutionApi;
import com.api.ero_erp.whatsapp.evolution.QrCodeEvolution;
import com.api.ero_erp.whatsapp.mapper.WhatsappMapper;
import com.api.ero_erp.whatsapp.repository.WhatsappConexaoRepository;
import com.api.ero_erp.whatsapp.repository.WhatsappConfiguracaoRepository;
import com.api.ero_erp.whatsapp.repository.WhatsappServidorRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * WhatsApp pela Evolution API — a conexão. Ver docs/13.
 *
 * <p>Quem conecta (conectar, status, desconectar, excluir) <b>não é
 * {@code @Transactional}</b>: a chamada à Evolution leva até 15 s, e segurar
 * uma conexão do banco durante ela esgotaria o pool com meia dúzia de telas
 * abertas no QR. O banco vai em transações curtas, antes e depois, pelo
 * {@code transacaoIndependente} (sem transação em volta, ele é uma comum).
 * O antigo fazia o HTTP dentro do {@code @Transactional}, e sem timeout.
 *
 * <p>O status é consultado à Evolution sempre que a tela pede: com
 * {@code APP_PUBLIC_URL} o webhook também avisa, mas sem ela (servidor sem
 * endereço público) a tela continua sabendo o que acontece.
 *
 * <p>Logs levam id da conexão, instância e operação — nunca apikey, número
 * ou segredo do webhook (regra 5).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappService {

    static final String CAMINHO_WEBHOOK = "/integracoes/whatsapp/webhook/";
    private static final String EVENTO_CONEXAO = "CONNECTION_UPDATE";

    private final WhatsappServidorRepository servidorRepository;
    private final WhatsappConfiguracaoRepository configuracaoRepository;
    private final WhatsappConexaoRepository conexaoRepository;
    private final FilialRepository filialRepository;
    private final EvolutionApi evolution;
    private final SecurityUtils securityUtils;
    private final TransactionTemplate transacaoIndependente;
    private final SecureRandom aleatorio = new SecureRandom();

    @Value("${app.public-url:}")
    private String urlPublica;

    // ═════════════════════════════════════════════════════════════════
    //  Servidor (superadmin)
    // ═════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public ServidorResponseDto servidor() {
        return WhatsappMapper.toServidor(servidorRepository.findFirstBy().orElse(null));
    }

    /** Apikey vazia mantém a gravada; no primeiro cadastro ela é obrigatória. */
    @Transactional
    public ServidorResponseDto salvarServidor(ServidorUpdateDto dto) {
        WhatsappServidor servidor = servidorRepository.findFirstBy().orElseGet(WhatsappServidor::new);
        String apiKey = textoOuNulo(dto.apiKey());
        if (apiKey == null && servidor.getApiKey() == null)
            throw new BadRequestException("Informe a apikey do servidor");

        servidor.setUrl(semBarraFinal(dto.url()));
        if (apiKey != null) servidor.setApiKey(apiKey);
        servidor.setAtivo(dto.ativo());

        WhatsappServidor salvo = servidorRepository.save(servidor);
        log.info("Servidor do WhatsApp gravado id={} apikeyTrocada={}", salvo.getId(), apiKey != null);
        return WhatsappMapper.toServidor(salvo);
    }

    // ═════════════════════════════════════════════════════════════════
    //  Painel e modo
    // ═════════════════════════════════════════════════════════════════

    /**
     * As linhas que a tela mostra: a do tenant inteiro, ou uma por filial
     * ativa. A linha sem conexão gravada (nunca conectada) vem vazia, para o
     * botão Conectar aparecer nela.
     */
    @Transactional(readOnly = true)
    public WhatsappPainelDto painel() {
        UUID tenantId = securityUtils.getTenantIdLogado();
        boolean superadmin = securityUtils.isSuperadmin();
        ModoWhatsapp modo = modoDo(tenantId);
        List<WhatsappConexao> todas = conexaoRepository.findAllByTenantId(tenantId);

        List<ConexaoDto> linhas = new ArrayList<>();
        Set<UUID> usadas = new HashSet<>();

        if (modo == ModoWhatsapp.TENANT) {
            WhatsappConexao doTenant = todas.stream().filter(c -> c.getFilial() == null).findFirst().orElse(null);
            if (doTenant != null) usadas.add(doTenant.getId());
            linhas.add(WhatsappMapper.toLinha(doTenant, null, superadmin));
        } else {
            Map<UUID, WhatsappConexao> porFilial = todas.stream()
                    .filter(c -> c.getFilial() != null)
                    .collect(Collectors.toMap(c -> c.getFilial().getId(), Function.identity()));
            for (Filial filial : filiaisAtivas(tenantId)) {
                WhatsappConexao conexao = porFilial.get(filial.getId());
                if (conexao != null) usadas.add(conexao.getId());
                linhas.add(WhatsappMapper.toLinha(conexao, filial, superadmin));
            }
        }

        List<ConexaoDto> foraDoModo = superadmin
                ? todas.stream()
                        .filter(c -> !usadas.contains(c.getId()))
                        .map(c -> WhatsappMapper.toLinha(c, true))
                        .toList()
                : null;

        return new WhatsappPainelDto(
                modo,
                servidorAtivo().isPresent(),
                linhas,
                foraDoModo,
                superadmin ? !urlPublica.isBlank() : null);
    }

    /** Não apaga conexão: a do outro modo fica em "fora do modo" para o superadmin decidir. */
    @Transactional
    public WhatsappPainelDto alterarModo(ModoUpdateDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        WhatsappConfiguracao configuracao = configuracaoRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    WhatsappConfiguracao nova = new WhatsappConfiguracao();
                    nova.setTenant(securityUtils.getTenantReference());
                    return nova;
                });
        configuracao.setModo(dto.modo());
        configuracaoRepository.save(configuracao);

        log.info("Modo do WhatsApp do tenant {} → {}", tenantId, dto.modo());
        return painel();
    }

    // ═════════════════════════════════════════════════════════════════
    //  Conexão
    // ═════════════════════════════════════════════════════════════════

    /**
     * Cria a linha se ainda não existe, garante a instância no servidor,
     * aponta o webhook (quando há URL pública) e pede o QR. Chamar de novo é
     * o que renova o QR que expirou.
     */
    public QrCodeDto conectar(ConectarDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        boolean superadmin = securityUtils.isSuperadmin();
        WhatsappConexao conexao = transacaoIndependente.execute(s -> obterOuCriar(tenantId, dto.filialId()));
        if (!Boolean.TRUE.equals(conexao.getAtivo()))
            throw new ConflictException("Esta conexão foi desativada pelo administrador do sistema");

        DestinoEvolution destino = destinoDe(conexao);
        evolution.criarInstancia(destino, conexao.getInstancia());
        configurarWebhook(destino, conexao);
        QrCodeEvolution qr = evolution.conectar(destino, conexao.getInstancia());

        WhatsappConexao atual;
        if (qr.jaConectada()) {
            EstadoEvolution estado = evolution.estadoConexao(destino, conexao.getInstancia());
            atual = gravarEstado(conexao.getId(), tenantId, estado.status(), estado.numero(), false);
        } else {
            atual = gravarEstado(conexao.getId(), tenantId, StatusConexao.AGUARDANDO_QR, null, false);
        }

        log.info("WhatsApp conectar conexao={} instancia={} status={}",
                atual.getId(), atual.getInstancia(), atual.getStatus());
        return new QrCodeDto(WhatsappMapper.toLinha(atual, superadmin), qr.base64(), qr.pairingCode());
    }

    /** O estado agora, perguntado à Evolution, e gravado. É o que o modal do QR consulta a cada 3 s. */
    public ConexaoDto status(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        WhatsappConexao conexao = buscar(id, tenantId);
        EstadoEvolution estado = evolution.estadoConexao(destinoDe(conexao), conexao.getInstancia());
        WhatsappConexao atual = gravarEstado(id, tenantId, estado.status(), estado.numero(), false);
        return WhatsappMapper.toLinha(atual, securityUtils.isSuperadmin());
    }

    /** Desliga o aparelho. A instância fica no servidor: conectar de novo reaproveita. */
    public ConexaoDto desconectar(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        WhatsappConexao conexao = buscar(id, tenantId);
        evolution.logout(destinoDe(conexao), conexao.getInstancia());
        WhatsappConexao atual = gravarEstado(id, tenantId, StatusConexao.DESCONECTADO, null, true);

        log.info("WhatsApp desconectar conexao={} instancia={}", id, conexao.getInstancia());
        return WhatsappMapper.toLinha(atual, securityUtils.isSuperadmin());
    }

    /** A sobrescrita do servidor e o ativo — do superadmin. */
    @Transactional
    public ConexaoDto atualizar(UUID id, ConexaoUpdateDto dto) {
        WhatsappConexao conexao = buscar(id, securityUtils.getTenantIdLogado());
        String url = textoOuNulo(dto.url());
        String apiKey = textoOuNulo(dto.apiKey());

        conexao.setUrl(url != null ? semBarraFinal(url) : null);
        if (dto.removerApiKey()) conexao.setApiKey(null);
        else if (apiKey != null) conexao.setApiKey(apiKey);
        conexao.setAtivo(dto.ativo());

        WhatsappConexao salva = conexaoRepository.save(conexao);
        log.info("WhatsApp conexao={} alterada urlPropria={} apikeyPropria={} ativo={}",
                id, salva.getUrl() != null, salva.getApiKey() != null, salva.getAtivo());
        return WhatsappMapper.toLinha(salva, true);
    }

    /**
     * Apaga a instância no servidor e a linha aqui. Se o servidor não
     * responde, nada é apagado: a linha é o único caminho de volta para uma
     * instância que ficaria viva lá, com o número dentro.
     */
    public void excluir(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        WhatsappConexao conexao = buscar(id, tenantId);
        destinoOpcional(conexao).ifPresent(destino -> evolution.excluirInstancia(destino, conexao.getInstancia()));

        transacaoIndependente.executeWithoutResult(s ->
                conexaoRepository.findByIdAndTenantId(id, tenantId).ifPresent(conexaoRepository::delete));
        log.info("WhatsApp conexao={} instancia={} excluída", id, conexao.getInstancia());
    }

    /**
     * A conexão que atende uma filial: no modo TENANT, a do tenant inteiro;
     * no POR_FILIAL, a da filial. Só a ativa. É por aqui que a fila de envio
     * (Fase 4) escolhe o número — recebe o tenant porque roda sem usuário
     * logado.
     */
    @Transactional(readOnly = true)
    public Optional<WhatsappConexao> conexaoPara(UUID tenantId, UUID filialId) {
        return localizar(tenantId, modoDo(tenantId), filialId)
                .filter(c -> Boolean.TRUE.equals(c.getAtivo()));
    }

    // ═════════════════════════════════════════════════════════════════
    //  Webhook
    // ═════════════════════════════════════════════════════════════════

    /**
     * O aviso da Evolution. O segredo do caminho diz a conexão; segredo que
     * não existe é 404, como rota que não existe. Só o
     * {@code CONNECTION_UPDATE} é tratado; os demais eventos são ignorados.
     */
    @Transactional
    public void webhook(String segredo, JsonNode corpo) {
        WhatsappConexao conexao = conexaoRepository.findByWebhookSegredo(segredo)
                .orElseThrow(() -> new NotFoundException("Recurso não encontrado"));

        String evento = corpo == null ? "" : corpo.path("event").asText("").trim().toUpperCase().replace('.', '_');
        if (!EVENTO_CONEXAO.equals(evento)) {
            log.debug("Webhook WhatsApp conexao={} evento {} ignorado", conexao.getId(), evento);
            return;
        }

        String instancia = textoOuNulo(corpo.path("instance").asText(null));
        if (instancia != null && !instancia.equals(conexao.getInstancia())) {
            log.warn("Webhook WhatsApp conexao={} com outra instância no corpo: ignorado", conexao.getId());
            return;
        }

        JsonNode dados = corpo.path("data");
        String estado = textoOuNulo(dados.path("state").asText(null));
        if (estado == null) return;

        StatusConexao status = EstadoEvolution.statusDe(estado);
        conexao.mudarStatus(status, Instant.now());
        if (status == StatusConexao.CONECTADO) {
            String numero = EstadoEvolution.numeroDe(dados.path("wuid").asText(null));
            if (numero != null) conexao.setNumero(numero);
        }
        log.info("Webhook WhatsApp conexao={} status={}", conexao.getId(), status);
    }

    // ═════════════════════════════════════════════════════════════════
    //  Apoio
    // ═════════════════════════════════════════════════════════════════

    private WhatsappConexao obterOuCriar(UUID tenantId, UUID filialId) {
        ModoWhatsapp modo = modoDo(tenantId);
        Filial filial = null;

        if (modo == ModoWhatsapp.TENANT) {
            if (filialId != null)
                throw new BadRequestException("O WhatsApp deste tenant é um número só: não se conecta por filial");
        } else {
            if (filialId == null)
                throw new BadRequestException("Escolha a filial: o WhatsApp deste tenant é um número por filial");
            filial = filialRepository.findByIdAndTenantId(filialId, tenantId)
                    .orElseThrow(() -> new NotFoundException("Filial não encontrada"));
            if (!Boolean.TRUE.equals(filial.getAtivo()))
                throw new BadRequestException("Filial inativa não conecta WhatsApp");
        }

        Optional<WhatsappConexao> existente = localizar(tenantId, modo, filialId);
        if (existente.isPresent()) return existente.get();

        // A linha nova não tem sobrescrita: sem servidor, ela nasceria órfã
        if (servidorAtivo().isEmpty()) throw semServidor();

        WhatsappConexao nova = new WhatsappConexao();
        nova.setTenant(securityUtils.getTenantReference());
        nova.setFilial(filial);
        nova.setInstancia(novaInstancia(tenantId));
        nova.setWebhookSegredo(novoSegredo());
        nova.setStatus(StatusConexao.DESCONECTADO);
        nova.setStatusEm(Instant.now());
        WhatsappConexao salva = conexaoRepository.save(nova);

        log.info("WhatsApp conexao={} criada instancia={} porFilial={}", salva.getId(), salva.getInstancia(), filial != null);
        return salva;
    }

    private Optional<WhatsappConexao> localizar(UUID tenantId, ModoWhatsapp modo, UUID filialId) {
        if (modo == ModoWhatsapp.TENANT) return conexaoRepository.findDoTenant(tenantId);
        if (filialId == null) return Optional.empty();
        return conexaoRepository.findDaFilial(tenantId, filialId);
    }

    /** Em transação curta: relê a linha e muda só o estado, sem atropelar o que o webhook gravou. */
    private WhatsappConexao gravarEstado(UUID id, UUID tenantId, StatusConexao status,
                                         String numero, boolean limparNumero) {
        return transacaoIndependente.execute(s -> {
            WhatsappConexao conexao = buscar(id, tenantId);
            conexao.mudarStatus(status, Instant.now());
            if (limparNumero) conexao.setNumero(null);
            else if (numero != null) conexao.setNumero(numero);
            return conexaoRepository.save(conexao);
        });
    }

    private WhatsappConexao buscar(UUID id, UUID tenantId) {
        return conexaoRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Conexão de WhatsApp não encontrada"));
    }

    private ModoWhatsapp modoDo(UUID tenantId) {
        return configuracaoRepository.findByTenantId(tenantId)
                .map(WhatsappConfiguracao::getModo)
                .orElse(ModoWhatsapp.TENANT);
    }

    /** As ativas, em ordem de nome — a mesma consulta do combo de filial. */
    private List<Filial> filiaisAtivas(UUID tenantId) {
        List<UUID> ids = filialRepository.findIdsForSelect(tenantId, null, null, null);
        if (ids.isEmpty()) return List.of();
        Map<UUID, Filial> porId = filialRepository.findAllComPessoa(ids, tenantId).stream()
                .collect(Collectors.toMap(Filial::getId, Function.identity()));
        return ids.stream().map(porId::get).toList();
    }

    private Optional<WhatsappServidor> servidorAtivo() {
        return servidorRepository.findFirstBy().filter(s -> Boolean.TRUE.equals(s.getAtivo()));
    }

    /** A sobrescrita da conexão, campo a campo; o que faltar vem do servidor global ativo. */
    private Optional<DestinoEvolution> destinoOpcional(WhatsappConexao conexao) {
        Optional<WhatsappServidor> servidor = servidorAtivo();
        String url = conexao.getUrl() != null ? conexao.getUrl() : servidor.map(WhatsappServidor::getUrl).orElse(null);
        String apiKey = conexao.getApiKey() != null
                ? conexao.getApiKey()
                : servidor.map(WhatsappServidor::getApiKey).orElse(null);
        if (url == null || apiKey == null) return Optional.empty();
        return Optional.of(new DestinoEvolution(url, apiKey));
    }

    private DestinoEvolution destinoDe(WhatsappConexao conexao) {
        return destinoOpcional(conexao).orElseThrow(WhatsappService::semServidor);
    }

    private static ConflictException semServidor() {
        return new ConflictException(
                "O servidor do WhatsApp ainda não foi configurado. Peça ao administrador do sistema");
    }

    /**
     * Sem {@code APP_PUBLIC_URL} não há para onde a Evolution avisar, e o
     * status vem só pela tela. Falhar aqui não impede o QR: pelo mesmo motivo.
     */
    private void configurarWebhook(DestinoEvolution destino, WhatsappConexao conexao) {
        if (urlPublica == null || urlPublica.isBlank()) return;
        try {
            evolution.configurarWebhook(destino, conexao.getInstancia(),
                    semBarraFinal(urlPublica) + CAMINHO_WEBHOOK + conexao.getWebhookSegredo());
        } catch (ServicoIndisponivelException e) {
            log.warn("WhatsApp conexao={}: webhook não configurado; o status segue pela tela", conexao.getId());
        }
    }

    /**
     * {@code ero-<8 do tenant>-<8 aleatórios>}: única no servidor, que é de
     * todos os tenants, e ainda reconhecível por quem olha o painel da Evolution.
     */
    private String novaInstancia(UUID tenantId) {
        byte[] bytes = new byte[4];
        aleatorio.nextBytes(bytes);
        return "ero-" + tenantId.toString().substring(0, 8) + "-" + HexFormat.of().formatHex(bytes);
    }

    /** 32 bytes aleatórios em base64url — 43 caracteres, sem preenchimento. */
    private String novoSegredo() {
        byte[] bytes = new byte[32];
        aleatorio.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String semBarraFinal(String url) {
        return url.trim().replaceAll("/+$", "");
    }

    private static String textoOuNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
