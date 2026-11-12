package com.api.ero_api.auth.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.auth.dtos.CodigoEnviadoDto;
import com.api.ero_api.auth.entity.CodigoVerificacao;
import com.api.ero_api.auth.mapper.AuthMapper;
import com.api.ero_api.auth.repository.CodigoVerificacaoRepository;
import com.api.ero_api.compartilhado.email.EmailService;
import com.api.ero_api.compartilhado.exception.MuitasRequisicoesException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.exception.ServicoIndisponivelException;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import com.api.ero_api.seguranca.jwt.JwtService;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.service.UsuarioService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Código de 6 dígitos enviado por e-mail na segunda etapa do login (todos os
 * usuários, sempre).
 *
 * <ul>
 *   <li>{@link #emitir}: depois da senha certa. Apaga os códigos anteriores do
 *       usuário, grava o novo (cifrado), envia o e-mail e devolve o desafio JWT,
 *       cujo {@code jti} aponta para a linha gravada.</li>
 *   <li>{@link #reenviar}: manda o MESMO código de novo, sem estender a validade,
 *       no mínimo {@code codigoReenvioIntervalo} entre envios e no máximo
 *       {@code codigoMaxEnvios} envios.</li>
 *   <li>{@link #validar}: compara em tempo constante e marca o código como usado
 *       (uso único). Código anterior à última troca de senha não vale.</li>
 *   <li>{@link #invalidarDoUsuario}: conta bloqueada, código pendente apagado.</li>
 *   <li>{@link #limparVencidos}: job diário que apaga os vencidos e os usados.</li>
 * </ul>
 *
 * <p>Mesmo motivo do AuthService para não usar {@code @Transactional} nos fluxos
 * públicos: ainda não há tenant, então o contexto ROOT é ligado antes da transação.
 * O e-mail sai depois do commit (sem segurar conexão do banco esperando o SMTP).
 * O código nunca vai para log nem para a resposta.
 */
@Service
public class CodigoVerificacaoService {

    public static final String MSG_ENVIO_FALHOU = "Não foi possível enviar o código agora. Tente de novo em instantes.";
    public static final String MSG_ENTRE_DE_NOVO = "Entre de novo para receber outro código.";

    private static final Logger log = LoggerFactory.getLogger(CodigoVerificacaoService.class);

    private final CodigoVerificacaoRepository repository;
    private final UsuarioService usuarioService;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final EventoSegurancaService eventos;
    private final SegurancaProperties props;
    private final TransactionTemplate tx;
    private final SecureRandom random = new SecureRandom();

    public CodigoVerificacaoService(CodigoVerificacaoRepository repository, UsuarioService usuarioService,
                                    EmailService emailService, JwtService jwtService, EventoSegurancaService eventos,
                                    SegurancaProperties props, PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.usuarioService = usuarioService;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.eventos = eventos;
        this.props = props;
        this.tx = new TransactionTemplate(transactionManager);
    }

    /** Desafio para o front + dados do código enviado. */
    public record Emitido(String desafio, CodigoEnviadoDto codigo) {
    }

    /** Desafio já validado (assinatura, emissor, tipo e validade). */
    public record Desafio(UUID usuarioId, UUID jti) {
    }

    public enum ResultadoValidacao { OK, CODIGO_ERRADO, EXPIRADO }

    /** Dados lidos na transação para o envio fora dela. */
    private record ParaEnviar(UUID usuarioId, UUID tenantId, UUID jti, Instant expiraEm, String email, String nome,
                              String codigo, int envios, CodigoEnviadoDto dto) {

        @Override
        public String toString() {
            return "ParaEnviar[usuarioId=" + usuarioId + ", ***]";
        }
    }

    private sealed interface Reenvio {
        /** {@code envioAnterior}: para devolver o intervalo se o e-mail não sair. */
        record Enviar(ParaEnviar dados, Instant envioAnterior) implements Reenvio {
        }

        record Aguardar(long segundos) implements Reenvio {
        }

        record Recusado() implements Reenvio {
        }
    }

    // ---------------------------------------------------------------- fluxos

    public boolean envioConfigurado() {
        return emailService.configurado();
    }

    /**
     * Senha certa: novo código para o usuário. Login novo = desafio novo, então os
     * códigos anteriores dele são apagados. Se o e-mail não sair, o código também é
     * apagado e responde 503 (nenhuma sessão é aberta). A linha do usuário fica
     * travada na transação: dois logins ao mesmo tempo não deixam dois códigos valendo.
     */
    public Emitido emitir(UUID usuarioId) {
        Instant agora = agora();
        String codigo = sortearCodigo();
        ParaEnviar p = root(() -> {
            Usuario u = usuarioService.buscarComBloqueio(usuarioId)
                    .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
            String email = u.getEmail();
            String nome = u.getNome();
            UUID tenantId = u.getTenantId();
            repository.apagarDoUsuario(usuarioId);
            CodigoVerificacao c = new CodigoVerificacao();
            c.atribuirTenant(tenantId);
            c.setUsuarioId(usuarioId);
            c.setDesafioJti(UUID.randomUUID());
            c.setCodigo(codigo);
            c.setExpiraEm(agora.plus(props.desafio2fa()));
            c.setUltimoEnvioEm(agora);
            c.setEnvios(1);
            repository.save(c);
            return paraEnviar(c, tenantId, email, nome);
        });
        if (!emailService.enviarCodigoVerificacao(p.email(), p.nome(), p.codigo(), props.desafio2fa())) {
            root(() -> repository.apagarPorDesafio(p.jti()));
            throw falhaDeEnvio(p);
        }
        eventos.registrarIndependente(TipoEventoSeguranca.CODIGO_ENVIADO, p.usuarioId(), p.tenantId(), null);
        String desafio = jwtService.emitirDesafio2fa(p.usuarioId(), p.jti(), p.expiraEm()).token();
        return new Emitido(desafio, p.dto());
    }

    /**
     * Reenvia o mesmo código. Antes do intervalo: 429 com Retry-After. Código
     * usado, vencido, apagado por um login mais novo, anterior à última troca de
     * senha, já reenviado o máximo de vezes, ou conta inativa/bloqueada: 422 pedindo
     * para entrar de novo. Se o e-mail não sair (503), o envio
     * não conta: nem para o máximo nem para o intervalo.
     */
    public CodigoEnviadoDto reenviar(String token) {
        Desafio d = lerDesafio(token).orElseThrow(() -> new RegraNegocioException(MSG_ENTRE_DE_NOVO));
        Instant agora = agora();
        Reenvio r = root(() -> {
            Optional<CodigoVerificacao> encontrado = repository.buscarPorDesafioComBloqueio(d.jti());
            if (encontrado.isEmpty()) {
                return new Reenvio.Recusado();
            }
            CodigoVerificacao c = encontrado.get();
            if (!c.getUsuarioId().equals(d.usuarioId())) {
                return new Reenvio.Recusado();
            }
            Usuario u = usuarioService.buscarEntidade(c.getUsuarioId());
            if (!c.valeEm(agora, u.getSenhaAlteradaEm()) || c.getEnvios() >= props.codigoMaxEnvios()
                    || !u.isAtivo() || u.bloqueadoEm(agora)) {
                return new Reenvio.Recusado();
            }
            Instant liberado = c.getUltimoEnvioEm().plus(props.codigoReenvioIntervalo());
            if (agora.isBefore(liberado)) {
                return new Reenvio.Aguardar(segundosAte(agora, liberado));
            }
            Instant envioAnterior = c.getUltimoEnvioEm();
            c.setEnvios(c.getEnvios() + 1);
            c.setUltimoEnvioEm(agora);
            return new Reenvio.Enviar(paraEnviar(c, u.getTenantId(), u.getEmail(), u.getNome()), envioAnterior);
        });
        Reenvio.Enviar enviar = switch (r) {
            case Reenvio.Enviar e -> e;
            case Reenvio.Aguardar a -> throw new MuitasRequisicoesException(
                    "Aguarde " + a.segundos() + " segundos para pedir outro código.", a.segundos());
            case Reenvio.Recusado x -> throw new RegraNegocioException(MSG_ENTRE_DE_NOVO);
        };
        ParaEnviar p = enviar.dados();
        if (!emailService.enviarCodigoVerificacao(p.email(), p.nome(), p.codigo(), props.desafio2fa())) {
            desfazerReenvio(p, enviar.envioAnterior());
            throw falhaDeEnvio(p);
        }
        eventos.registrarIndependente(TipoEventoSeguranca.CODIGO_REENVIADO, p.usuarioId(), p.tenantId(),
                "envio " + p.envios() + " de " + props.codigoMaxEnvios());
        return p.dto();
    }

    /**
     * Confere o código digitado e, se certo, marca como usado. Roda dentro da
     * transação do AuthService (contexto ROOT, linha do usuário travada), então
     * dois envios do mesmo código ao mesmo tempo não abrem duas sessões. A linha do
     * código também é travada: um reenvio no mesmo instante espera, em vez de
     * derrubar a validação por conflito de versão (código certo virando 401).
     * Código emitido antes da última troca de senha conta como vencido.
     */
    @Transactional
    public ResultadoValidacao validar(Desafio d, Usuario u, String digitado, Instant agora) {
        Optional<CodigoVerificacao> encontrado = repository.buscarPorDesafioComBloqueio(d.jti());
        if (encontrado.isEmpty()) {
            return ResultadoValidacao.EXPIRADO;
        }
        CodigoVerificacao c = encontrado.get();
        if (!c.getUsuarioId().equals(u.getId()) || !c.valeEm(agora, u.getSenhaAlteradaEm())) {
            return ResultadoValidacao.EXPIRADO;
        }
        if (!confere(c.getCodigo(), digitado)) {
            return ResultadoValidacao.CODIGO_ERRADO;
        }
        c.setUsadoEm(agora);
        return ResultadoValidacao.OK;
    }

    /**
     * Conta bloqueada por excesso de erros: o código pendente morre junto. Sem isso,
     * o desbloqueio pelo administrador zeraria o contador e a mesma linha ganharia
     * mais 5 chutes. Roda dentro da transação do AuthService (contexto ROOT).
     */
    @Transactional
    public void invalidarDoUsuario(UUID usuarioId) {
        repository.apagarDoUsuario(usuarioId);
    }

    /**
     * Limpeza diária (mesmo horário da retenção da auditoria): códigos vencidos ou já
     * usados. A tabela é de contratante, então roda em contexto ROOT para alcançar todos.
     */
    @Scheduled(cron = "${app.auditoria.retencao-cron:0 30 3 * * *}")
    public void limparVencidos() {
        int apagados = root(() -> repository.apagarVencidosOuUsados(Instant.now()));
        log.info("retencao codigos_verificacao_apagados={}", apagados);
    }

    /** Assinatura, emissor, tipo ({@code desafio-2fa}) e validade do JWT. Vazio se não vale. */
    public Optional<Desafio> lerDesafio(String token) {
        try {
            Jwt jwt = jwtService.validarDesafio(token);
            if (jwt.getSubject() == null || jwt.getId() == null) {
                return Optional.empty();
            }
            return Optional.of(new Desafio(UUID.fromString(jwt.getSubject()), UUID.fromString(jwt.getId())));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    // ---------------------------------------------------------------- interno

    private ParaEnviar paraEnviar(CodigoVerificacao c, UUID tenantId, String email, String nome) {
        Instant reenvio = c.getUltimoEnvioEm().plus(props.codigoReenvioIntervalo());
        CodigoEnviadoDto dto = AuthMapper.toCodigoEnviadoDto(c, email, reenvio);
        return new ParaEnviar(c.getUsuarioId(), tenantId, c.getDesafioJti(), c.getExpiraEm(), email, nome,
                c.getCodigo(), c.getEnvios(), dto);
    }

    /**
     * O reenvio não saiu: devolve {@code envios} e {@code ultimo_envio_em} ao que
     * eram, para o 503 ("tente de novo em instantes") valer de fato. Só mexe se a
     * linha ainda é a deste envio (um login mais novo pode tê-la apagado).
     */
    private void desfazerReenvio(ParaEnviar p, Instant envioAnterior) {
        root(() -> {
            repository.buscarPorDesafioComBloqueio(p.jti())
                    .filter(c -> c.getEnvios() == p.envios())
                    .ifPresent(c -> {
                        c.setEnvios(p.envios() - 1);
                        c.setUltimoEnvioEm(envioAnterior);
                    });
            return null;
        });
    }

    /** Registra a falha (sem o código nem o e-mail) e devolve o 503 para quem chamou lançar. */
    private ServicoIndisponivelException falhaDeEnvio(ParaEnviar p) {
        eventos.registrarIndependente(TipoEventoSeguranca.EMAIL_FALHA_ENVIO, p.usuarioId(), p.tenantId(),
                "código de verificação");
        return new ServicoIndisponivelException(MSG_ENVIO_FALHOU);
    }

    /** Em milissegundos, como o front recebe: o banco guarda microssegundos e o valor não muda entre respostas. */
    private static Instant agora() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS);
    }

    private String sortearCodigo() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    /** Tempo constante: não revela quantos dígitos acertou. Aceita espaços e hífen ("123 456"). */
    private static boolean confere(String esperado, String digitado) {
        String limpo = digitado == null ? "" : digitado.replaceAll("[\\s-]", "");
        return MessageDigest.isEqual(esperado.getBytes(StandardCharsets.UTF_8), limpo.getBytes(StandardCharsets.UTF_8));
    }

    private static long segundosAte(Instant agora, Instant momento) {
        long millis = Duration.between(agora, momento).toMillis();
        return Math.max(1, (millis + 999) / 1000);
    }

    private <T> T root(Supplier<T> acao) {
        return TenantContext.comoRoot(() -> tx.execute(status -> acao.get()));
    }
}
