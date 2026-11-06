package com.api.ero_api.compartilhado.exception;

import com.api.ero_api.compartilhado.dtos.ErroCampoDto;
import com.api.ero_api.compartilhado.web.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Único lugar que transforma exceção em resposta HTTP (RFC 9457 / ProblemDetail).
 *
 * <p>Também recebe as falhas do Spring Security (401/403) e do RateLimitFilter,
 * que delegam para cá. Regra de ouro: erro inesperado NUNCA devolve a mensagem
 * interna — devolve um texto genérico e o {@code correlationId} para achar no log.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> negocio(ApiException ex, HttpServletRequest req) {
        return resposta(ex.getStatus(), ex.getCodigo(), ex.getMessage(), req, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> validacao(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ErroCampoDto> erros = ex.getBindingResult().getFieldErrors().stream()
                .map(GlobalExceptionHandler::erroCampo)
                .toList();
        return resposta(HttpStatus.BAD_REQUEST, "VALIDACAO", "Existem campos inválidos.", req, erros);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ProblemDetail> validacaoParametro(HandlerMethodValidationException ex, HttpServletRequest req) {
        return resposta(HttpStatus.BAD_REQUEST, "VALIDACAO", "Parâmetros inválidos.", req, null);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ProblemDetail> corpoInvalido(Exception ex, HttpServletRequest req) {
        return resposta(HttpStatus.BAD_REQUEST, "REQUISICAO_INVALIDA", "Requisição em formato inválido.", req, null);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> concorrencia(OptimisticLockingFailureException ex, HttpServletRequest req) {
        return resposta(HttpStatus.CONFLICT, "CONFLITO",
                "Este registro foi alterado por outra pessoa. Recarregue e tente de novo.", req, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> integridade(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Violação de integridade: {}", ex.getMostSpecificCause().getClass().getSimpleName());
        return resposta(HttpStatus.CONFLICT, "CONFLITO",
                "Não foi possível salvar: o registro conflita com outro já existente.", req, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> naoAutenticado(AuthenticationException ex, HttpServletRequest req) {
        return resposta(HttpStatus.UNAUTHORIZED, "NAO_AUTENTICADO", "Sessão inválida ou expirada.", req, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> semPermissao(AccessDeniedException ex, HttpServletRequest req) {
        return resposta(HttpStatus.FORBIDDEN, "ACESSO_NEGADO", "Você não tem permissão para esta operação.", req, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> inesperado(Exception ex, HttpServletRequest req) {
        if (ex instanceof ErrorResponse er) {
            // Exceções do próprio Spring MVC (404 de rota, 405, 415...): status certo, texto nosso.
            HttpStatusCode status = er.getStatusCode();
            return resposta(status, "HTTP_" + status.value(), textoPorStatus(status), req, null);
        }
        log.error("Erro inesperado em {} {}", req.getMethod(), req.getRequestURI(), ex);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "ERRO_INTERNO",
                "Erro interno. Informe o código " + MDC.get(CorrelationIdFilter.MDC_CHAVE) + " ao suporte.", req, null);
    }

    private static ErroCampoDto erroCampo(FieldError fe) {
        return new ErroCampoDto(fe.getField(), fe.getDefaultMessage());
    }

    private static String textoPorStatus(HttpStatusCode status) {
        return switch (status.value()) {
            case 404 -> "Recurso não encontrado.";
            case 405 -> "Método não permitido para este recurso.";
            case 406, 415 -> "Formato de conteúdo não suportado.";
            case 413 -> "Requisição grande demais.";
            default -> "Não foi possível processar a requisição.";
        };
    }

    private static ResponseEntity<ProblemDetail> resposta(HttpStatusCode status, String codigo, String detalhe,
                                                          HttpServletRequest req, List<ErroCampoDto> erros) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detalhe);
        pd.setTitle(HttpStatus.valueOf(status.value()).getReasonPhrase());
        pd.setInstance(URI.create(req.getRequestURI()));
        pd.setProperty("codigo", codigo);
        pd.setProperty("correlationId", MDC.get(CorrelationIdFilter.MDC_CHAVE));
        if (erros != null) {
            pd.setProperty("erros", erros);
        }
        return ResponseEntity.status(status).body(pd);
    }
}
