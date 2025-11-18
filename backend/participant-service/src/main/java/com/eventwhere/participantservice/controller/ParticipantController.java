package com.eventwhere.participantservice.controller;

import com.eventwhere.participantservice.model.Participant;
import com.eventwhere.participantservice.repository.ParticipantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/participants")
@CrossOrigin(origins = "http://localhost:4200")
public class ParticipantController {
    
    @Autowired
    private ParticipantRepository participantRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @GetMapping
    public List<Participant> getAll() {
        return participantRepository.findAll();
    }
    
    @PostMapping
    public Participant create(@RequestBody Participant participant) {
        participant.setStatus("CONFIRMED");
        participant.setRegisteredAt(LocalDateTime.now());
        Participant saved = participantRepository.save(participant);
        
        try {
            Map<String, Object> event = restTemplate.getForObject(
                "http://localhost:9091/api/events/" + participant.getEventId(),
                Map.class
            );
            
            String eventTitle = event != null ? (String) event.get("title") : "l'événement";
            
            sendAutomaticNotification(
                participant.getEmail(),
                "REGISTRATION_CONFIRMED",
                "✅ Votre inscription à '" + eventTitle + "' a été confirmée avec succès !",
                participant.getEventId()
            );
        } catch (Exception e) {
            System.err.println("Erreur récupération événement: " + e.getMessage());
        }
        
        return saved;
    }
    
    @GetMapping("/event/{eventId}")
    public List<Participant> getByEvent(@PathVariable Long eventId) {
        return participantRepository.findByEventId(eventId);
    }
    
    @GetMapping("/email/{email}")
    public List<Participant> getByEmail(@PathVariable String email) {
        return participantRepository.findByEmail(email);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> unregister(@PathVariable Long id) {
        if (participantRepository.existsById(id)) {
            participantRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    private void sendAutomaticNotification(String email, String type, String message, Long eventId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("email", email);
            notification.put("type", type);
            notification.put("message", message);
            notification.put("eventId", eventId);
            
            restTemplate.postForObject(
                "http://localhost:9093/api/notifications",
                notification,
                Object.class
            );
        } catch (Exception e) {
            System.err.println("Erreur envoi notification: " + e.getMessage());
        }
    }
}