package com.s2.LogiTrack.config;

import com.s2.LogiTrack.model.Usuario;
import com.s2.LogiTrack.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Creación OPCIONAL del primer administrador.
 * No habilita registro público como ADMIN ni modifica usuarios existentes.
 * Configurar ADMIN_EMAIL, ADMIN_PASSWORD y opcionalmente ADMIN_NAME antes de arrancar.
 */
@Configuration
@RequiredArgsConstructor
public class AdminBootstrapConfig {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;

    @Bean
    public ApplicationRunner bootstrapAdmin(
            @Value("${logitrack.bootstrap.admin-email:}") String email,
            @Value("${logitrack.bootstrap.admin-password:}") String password,
            @Value("${logitrack.bootstrap.admin-name:Administrador}") String name) {
        return args -> {
            if (email.isBlank() && password.isBlank()) return;
            if (email.isBlank() || password.length() < 8 || !email.contains("@")) {
                throw new IllegalStateException("ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) deben estar configurados correctamente");
            }
            if (usuarios.existsByCorreo(email.trim())) return;
            Usuario admin = new Usuario();
            admin.setNombre(name.isBlank() ? "Administrador" : name.trim());
            admin.setCorreo(email.trim());
            admin.setPassword(encoder.encode(password));
            admin.setRol(Usuario.Rol.ADMIN);
            admin.setEstado(Usuario.Estado.APROBADO);
            usuarios.save(admin);
        };
    }
}
