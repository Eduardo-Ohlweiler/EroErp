package com.api.ero_erp.config;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.repository.ClienteRepository;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.repository.RoleRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class DataSeeder implements ApplicationRunner {
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RoleRepository    roleRepository;
    private final PasswordEncoder   passwordEncoder;

    public DataSeeder(
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            RoleRepository    roleRepository,
            PasswordEncoder   passwordEncoder
    ) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.roleRepository    = roleRepository;
        this.passwordEncoder   = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        Cliente cliente = clienteRepository.findByEmailIgnoreCase("ero@eroerp.com")
                .orElseGet(() -> {
                    Cliente cliente1 = new Cliente();
                    cliente1.setNome("Ero Admin");
                    cliente1.setEmail("ero@eroerp.com");
                    cliente1.setAtivo(true);
                    cliente1.setTelefone("51992006747");
                    return clienteRepository.save(cliente1);
                });

        Role superAdminRole = roleRepository.findByNomeIgnoreCase("SUPERADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setNome("SUPERADMIN");
                    role.setDescricao("Acesso total ao sistema");
                    return roleRepository.save(role);
                });

        Role adminRole = roleRepository.findByNomeIgnoreCase("ADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setNome("ADMIN");
                    role.setDescricao("Acesso total ao sistema do cliente");
                    return roleRepository.save(role);
                });

        boolean jaExiste = usuarioRepository.existsBySuperAdmin();
        if (jaExiste) return;

        Usuario superAdmin = new Usuario();
        superAdmin.setCliente(cliente);
        superAdmin.setNome("Ero Admin");
        superAdmin.setEmail("ero@eroerp.com");
        superAdmin.setSenha(passwordEncoder.encode("Admin123@"));
        superAdmin.setTelefone("51992006747");
        superAdmin.setAtivo(true);
        superAdmin.setRoles(Set.of(superAdminRole));

        usuarioRepository.save(superAdmin);

        System.out.println("✅ SuperAdmin criado — email: ero@eroerp.com / senha: Admin123@");
    }
}