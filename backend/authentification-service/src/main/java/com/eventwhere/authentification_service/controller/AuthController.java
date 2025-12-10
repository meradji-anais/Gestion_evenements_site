package com.eventwhere.authentification_service.controller;

import com.eventwhere.authentification_service.model.User;
import com.eventwhere.authentification_service.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // DTOs
    public static class RegisterRequest {
        private String email;
        private String password;
        private String confirmPassword;
        private String role;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class LoginRequest {
        private String email;
        private String password;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private Long id;
        private String email;
        private String name;
        private String role;
        
        public AuthResponse(User user) {
            this.id = user.getId();
            this.email = user.getEmail();
            this.name = user.getName();
            this.role = user.getRole().name();
        }
        
        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getRole() { return role; }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpSession session) {
        System.out.println(" Tentative d'inscription: " + request.getEmail());
        
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email requis");
        }
        
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 6 caractères");
        }
        
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Les mots de passe ne correspondent pas");
        }
        
        if (request.getRole() == null || request.getRole().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Rôle requis");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Cet email est déjà utilisé");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setName(request.getEmail().split("@")[0]);
        
        try {
            user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rôle invalide");
        }

        User savedUser = userRepository.save(user);
        
        
        session.setAttribute("userId", savedUser.getId());
        session.setAttribute("userEmail", savedUser.getEmail());
        session.setAttribute("userName", savedUser.getName());
        session.setAttribute("userRole", savedUser.getRole().name());
        
        System.out.println(" Inscription réussie et session créée");
        System.out.println("   - Email: " + savedUser.getEmail());
        System.out.println("   - Session ID: " + session.getId());
        System.out.println("   - User ID: " + savedUser.getId());
        
        return ResponseEntity.ok(new AuthResponse(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        System.out.println(" Tentative de connexion: " + request.getEmail());
        
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body("Email et password requis");
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            System.out.println(" Utilisateur introuvable: " + request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou mot de passe incorrect");
        }

        User user = userOpt.get();
        
        if (!user.getPassword().equals(request.getPassword())) {
            System.out.println(" Mot de passe incorrect pour: " + request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou mot de passe incorrect");
        }

        session.setAttribute("userId", user.getId());
        session.setAttribute("userEmail", user.getEmail());
        session.setAttribute("userName", user.getName());
        session.setAttribute("userRole", user.getRole().name());
        
        System.out.println(" Connexion réussie");
        System.out.println("   - Email: " + user.getEmail());
        System.out.println("   - Session ID: " + session.getId());
        System.out.println("   - User ID: " + user.getId());

        return ResponseEntity.ok(new AuthResponse(user));
    }

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        System.out.println(" Vérification de la session...");
        System.out.println("   - Session ID: " + session.getId());
        System.out.println("   - Session new? " + session.isNew());
        
        Long userId = (Long) session.getAttribute("userId");
        
        if (userId == null) {
            System.out.println(" Aucun userId dans la session");
            System.out.println("   - Attributs disponibles: " + java.util.Collections.list(session.getAttributeNames()));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Non connecté");
        }
        
        System.out.println(" userId trouvé dans la session: " + userId);

        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            System.out.println(" Utilisateur ID " + userId + " introuvable dans la BDD");
            session.invalidate();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session invalide");
        }

        User user = userOpt.get();
        System.out.println(" Utilisateur trouvé: " + user.getEmail() + " (" + user.getRole() + ")");
        return ResponseEntity.ok(new AuthResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        System.out.println(" Déconnexion - Session ID: " + session.getId());
        session.invalidate();
        System.out.println(" Session invalidée");
        return ResponseEntity.ok("Déconnecté");
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service OK on port 9094!");
    }
}