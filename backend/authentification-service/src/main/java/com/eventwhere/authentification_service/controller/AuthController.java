package com.eventwhere.authentification_service.controller;

import com.eventwhere.authentification_service.model.User;
import com.eventwhere.authentification_service.repository.UserRepository;
import com.eventwhere.authentification_service.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$");

    private boolean isValidPassword(String password) {
        return PASSWORD_PATTERN.matcher(password).matches();
    }

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

    public static class ResetPasswordRequest {
        private String email;
        private String newPassword;
        private String confirmPassword;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }

    public static class MessageResponse {
        private String message;
        
        public MessageResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String email;
        private String name;
        private String role;
        
        public JwtResponse(String token, User user) {
            this.token = token;
            this.id = user.getId();
            this.email = user.getEmail();
            this.name = user.getName();
            this.role = user.getRole().name();
        }
        
        public String getToken() { return token; }
        public String getType() { return type; }
        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getRole() { return role; }
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
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        System.out.println("Tentative d'inscription: " + request.getEmail());
        
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email requis"));
        }
        
        if (request.getPassword() == null || !isValidPassword(request.getPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le mot de passe doit contenir au moins 6 caracteres dont au moins une lettre et un chiffre"));
        }
        
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Les mots de passe ne correspondent pas"));
        }
        
        if (request.getRole() == null || request.getRole().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Role requis"));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cet email est deja utilise"));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getEmail().split("@")[0]);
        
        try {
            user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Role invalide"));
        }

        User savedUser = userRepository.save(user);
        String jwt = jwtUtils.generateJwtToken(savedUser.getEmail());
        
        System.out.println("Inscription reussie et JWT genere");
        System.out.println("   - Email: " + savedUser.getEmail());
        System.out.println("   - Token: " + jwt.substring(0, 20) + "...");
        
        return ResponseEntity.ok(new JwtResponse(jwt, savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("Tentative de connexion: " + request.getEmail());
        
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email et password requis"));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            System.out.println("Utilisateur introuvable: " + request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Email ou mot de passe incorrect"));
        }

        User user = userOpt.get();
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            System.out.println("Mot de passe incorrect pour: " + request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Email ou mot de passe incorrect"));
        }

        String jwt = jwtUtils.generateJwtToken(user.getEmail());
        
        System.out.println("Connexion reussie");
        System.out.println("   - Email: " + user.getEmail());
        System.out.println("   - Token: " + jwt.substring(0, 20) + "...");

        return ResponseEntity.ok(new JwtResponse(jwt, user));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        System.out.println("Tentative de reinitialisation: " + request.getEmail());
        
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email requis"));
        }

        if (request.getNewPassword() == null || !isValidPassword(request.getNewPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le mot de passe doit contenir au moins 6 caracteres dont au moins une lettre et un chiffre"));
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Les mots de passe ne correspondent pas"));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            System.out.println("Utilisateur introuvable: " + request.getEmail());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Aucun compte associe a cet email"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        System.out.println("Mot de passe reinitialise pour: " + user.getEmail());
        
        return ResponseEntity.ok(new MessageResponse("Mot de passe reinitialise avec succes"));
    }

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser() {
        System.out.println("Verification du token JWT...");
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            System.out.println("Aucun utilisateur authentifie");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Non connecte"));
        }
        
        String email = authentication.getName();
        System.out.println("Email extrait du token: " + email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            System.out.println("Utilisateur " + email + " introuvable dans la BDD");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Session invalide"));
        }

        User user = userOpt.get();
        System.out.println("Utilisateur trouve: " + user.getEmail() + " (" + user.getRole() + ")");
        return ResponseEntity.ok(new AuthResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        System.out.println("Deconnexion (cote client supprime le token)");
        return ResponseEntity.ok(new MessageResponse("Deconnecte"));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service OK on port 9094 with JWT!");
    }
}