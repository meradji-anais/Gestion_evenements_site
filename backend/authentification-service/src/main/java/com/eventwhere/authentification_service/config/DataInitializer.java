package com.eventwhere.authentification_service.config;

import com.eventwhere.authentification_service.model.User;
import com.eventwhere.authentification_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            System.out.println("Utilisateurs déjà présents");
            return;
        }

        System.out.println(" Création des comptes avec mots de passe hashés...");

        User admin = new User();
        admin.setEmail("admin@eventwhere.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setName("Admin");
        admin.setRole(User.Role.ORGANIZER);
        userRepository.save(admin);
        System.out.println(" admin@eventwhere.com / admin123");

        User org2 = new User();
        org2.setEmail("organizer2@eventwhere.com");
        org2.setPassword(passwordEncoder.encode("org123"));
        org2.setName("Organisateur 2");
        org2.setRole(User.Role.ORGANIZER);
        userRepository.save(org2);
        System.out.println(" organizer2@eventwhere.com / org123");

        User participant = new User();
        participant.setEmail("meradji@mail.com");
        participant.setPassword(passwordEncoder.encode("meradji123"));
        participant.setName("Meradji Anais");
        participant.setRole(User.Role.PARTICIPANT);
        userRepository.save(participant);
        System.out.println(" meradji@mail.com / meradji123");

        System.out.println(" 3 comptes créés avec JWT activé!");
    }
}