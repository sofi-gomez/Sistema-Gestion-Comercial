package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Usuario;
import com.example.Sistema_Gestion.repository.UsuarioRepository;
import com.example.Sistema_Gestion.security.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
            UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        log.info("Intento de login para usuario: {}", username);
        String password = loginRequest.get("password");

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken((UserDetails) authentication.getPrincipal());

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("username", username);
        response.put("authenticated", true);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Sesión cerrada");
    }

    @PostMapping("/update-credentials")
    public ResponseEntity<?> updateCredentials(@RequestBody Map<String, String> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentAuthenticatedUsername = auth.getName();

        String currentPassword = request.get("currentPassword");
        String newUsername = request.get("newUsername");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || currentPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña actual es requerida"));
        }

        Optional<Usuario> userOpt = usuarioRepository.findByUsername(currentAuthenticatedUsername);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no encontrado"));
        }

        Usuario usuario = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "La contraseña actual es incorrecta"));
        }

        boolean updated = false;

        if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.equals(usuario.getUsername())) {
            if (usuarioRepository.findByUsername(newUsername).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El nombre de usuario ya está en uso"));
            }
            usuario.setUsername(newUsername.trim());
            updated = true;
        }

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(newPassword));
            updated = true;
        }

        if (updated) {
            usuarioRepository.save(usuario);
            log.info("Credenciales actualizadas para el usuario (previo): {}", currentAuthenticatedUsername);
            return ResponseEntity.ok(
                    Map.of("message", "Credenciales actualizadas correctamente. Por favor inicie sesión nuevamente."));
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se proporcionaron nuevos datos para actualizar"));
        }
    }
}
