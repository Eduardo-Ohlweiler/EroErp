package com.api.ero_erp.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception e, WebRequest request) {
        log.error("Erro interno não tratado: {}", e.getMessage(), e);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro("Erro interno: " + e.getMessage())
                .codigo(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .timestamp(new Date())
                .path(request.getDescription(false))
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<Object> applicationException(ApplicationException e, WebRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro(e.getMessage())
                .codigo(HttpStatus.BAD_REQUEST.value())
                .timestamp(new Date())
                .path(request.getDescription(false)).build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> methodArgumentNotValidException(MethodArgumentNotValidException e, WebRequest request){

        String erros = e.getFieldErrors().stream()
                .map(item -> item.getField() + " " + item.getDefaultMessage() + "; ")
                .collect(Collectors.joining());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro(erros)
                .codigo(HttpStatus.BAD_REQUEST.value())
                .timestamp(new Date())
                .path(request.getDescription(false)).build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Object> notFoundException(NotFoundException e, WebRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro(e.getMessage())
                .codigo(HttpStatus.NOT_FOUND.value())
                .timestamp(new Date())
                .path(request.getDescription(false)).build();

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Object> conflictException(ConflictException e, WebRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro(e.getMessage())
                .codigo(HttpStatus.CONFLICT.value())
                .timestamp(new Date())
                .path(request.getDescription(false)).build();

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Object> badRequest(BadRequestException e, WebRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro(e.getMessage())
                .codigo(HttpStatus.BAD_REQUEST.value())
                .timestamp(new Date())
                .path(request.getDescription(false)).build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Object> unauthorizedException(UnauthorizedException e, WebRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .erro(e.getMessage())
                .codigo(HttpStatus.UNAUTHORIZED.value())
                .timestamp(new Date())
                .path(request.getDescription(false)).build();

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
}
