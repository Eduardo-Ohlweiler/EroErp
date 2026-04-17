package com.api.ero_erp.auth.controller;

import com.api.ero_erp.auth.dtos.AuthLoginDto;
import com.api.ero_erp.auth.dtos.AuthResponseDto;
import com.api.ero_erp.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Autenticação")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Login")
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthLoginDto dto) {
        return ResponseEntity.ok(authService.login(dto));
    }
}