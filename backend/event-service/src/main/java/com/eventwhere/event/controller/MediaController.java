package com.eventwhere.event.controller;

import com.eventwhere.event.model.Media;
import com.eventwhere.event.repository.MediaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:4200")
public class MediaController {
    
    @Autowired
    private MediaRepository mediaRepository;
    
    private final String UPLOAD_DIR = "uploads/";
    
    // ORGANISATEUR : Ajouter des médias (affiche, programme, plan, vidéo)
    @PostMapping("/{eventId}/media")
    public ResponseEntity<Media> uploadMedia(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) throws IOException {
        
        // Créer le dossier si nécessaire
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Sauvegarder le fichier
        String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        
        // Créer l'entité Media
        Media media = new Media();
        media.setEventId(eventId);
        media.setType(type);
        media.setFilename(filename);
        media.setUrl("/uploads/" + filename);
        media.setUploadedAt(LocalDateTime.now());
        
        return ResponseEntity.ok(mediaRepository.save(media));
    }
    
    // TOUS : Liste des médias d'un événement
    @GetMapping("/{eventId}/media")
    public List<Media> getMediaByEvent(@PathVariable Long eventId) {
        return mediaRepository.findByEventId(eventId);
    }
    
    // TOUS : Médias par type (ex: affiche, programme, plan)
    @GetMapping("/{eventId}/media/{type}")
    public List<Media> getMediaByEventAndType(
            @PathVariable Long eventId,
            @PathVariable String type) {
        return mediaRepository.findByEventIdAndType(eventId, type);
    }
    
    // ORGANISATEUR : Supprimer un média
    @DeleteMapping("/media/{mediaId}")
    public ResponseEntity<Void> deleteMedia(@PathVariable Long mediaId) {
        if (mediaRepository.existsById(mediaId)) {
            mediaRepository.deleteById(mediaId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}