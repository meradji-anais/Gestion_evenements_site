package com.eventwhere.event.controller;

import com.eventwhere.event.model.Event;
import com.eventwhere.event.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
//@CrossOrigin(origins = "http://localhost:4200")
public class EventController {
    
    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private final String UPLOAD_DIR = "uploads/";
    
    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        event.setCreatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }
    
    @PostMapping("/{eventId}/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        
       // String fileUrl = "http://localhost:9091/uploads/" + filename;
        String fileUrl = "http://localhost:9090/uploads/" + filename;
        
        eventRepository.findById(eventId).ifPresent(event -> {
            event.setImageUrl(fileUrl);
            eventRepository.save(event);
        });
        
        Map<String, String> response = new HashMap<>();
        response.put("url", fileUrl);
        response.put("filename", filename);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event event) {
        return eventRepository.findById(id)
            .map(existingEvent -> {
                event.setId(id);
                event.setCreatedAt(existingEvent.getCreatedAt());
                Event updated = eventRepository.save(event);
                
                notifyParticipants(id, "EVENT_MODIFIED", "L'événement '" + event.getTitle() + "' a été modifié. Consultez les détails.");
                
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        if (eventRepository.existsById(id)) {
            Event event = eventRepository.findById(id).orElse(null);
            if (event != null) {
                notifyParticipants(id, "EVENT_CANCELLED", "L'événement '" + event.getTitle() + "' a été annulé.");
            }
            eventRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/organizer/{email}")
    public List<Event> getEventsByOrganizer(@PathVariable String email) {
        return eventRepository.findByOrganizerEmail(email);
    }
    
    @GetMapping("/search")
    public List<Event> searchEvents(@RequestParam String keyword) {
        return eventRepository.search(keyword);
    }
    
    @GetMapping("/type/{type}")
    public List<Event> getEventsByType(@PathVariable String type) {
        return eventRepository.findByType(type);
    }
    
    @GetMapping("/location/{location}")
    public List<Event> getEventsByLocation(@PathVariable String location) {
        return eventRepository.findByLocationContainingIgnoreCase(location);
    }
    
    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("eventId", id);
        
        try {
            List participants = restTemplate.getForObject(
                "http://localhost:9092/api/participants/event/" + id,
                List.class
            );
            stats.put("totalParticipants", participants != null ? participants.size() : 0);
        } catch (Exception e) {
            stats.put("totalParticipants", 0);
        }
        
        return ResponseEntity.ok(stats);
    }
    
    private void notifyParticipants(Long eventId, String type, String message) {
        try {
            List<Map> participants = restTemplate.getForObject(
                "http://localhost:9092/api/participants/event/" + eventId,
                List.class
            );
            
            if (participants != null && !participants.isEmpty()) {
                for (Map participant : participants) {
                    Map<String, Object> notification = new HashMap<>();
                    notification.put("email", participant.get("email"));
                    notification.put("type", type);
                    notification.put("message", message);
                    notification.put("eventId", eventId);
                    
                    restTemplate.postForObject(
                        "http://localhost:9093/api/notifications",
                        notification,
                        Object.class
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur notification participants: " + e.getMessage());
        }
    }
}