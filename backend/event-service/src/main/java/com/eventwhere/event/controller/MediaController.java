package com.eventwhere.event.controller;

import com.eventwhere.event.model.Media;
import com.eventwhere.event.repository.MediaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
        media.setUrl("/api/events/file/" + filename);
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

    // TOUS : Servir les fichiers (vidéos, PDFs, images)
    @GetMapping("/file/{filename}")
    public ResponseEntity<?> serveFile(@PathVariable String filename,
                                       @RequestHeader(value = "Range", required = false) String rangeHeader) {
        try {
            // Validation du nom de fichier
            if (filename.contains("..") || filename.startsWith("/")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);

            if (!Files.exists(filePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            long fileSize = Files.size(filePath);
            String contentType = determineContentType(filename);

            if (rangeHeader == null) {
                byte[] all = Files.readAllBytes(filePath);
                return ResponseEntity.ok()
                        .header("Accept-Ranges", "bytes")
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(all);
            }

            
            String rangeValue = rangeHeader.replace("bytes=", "");
            long start = 0;
            long end = fileSize - 1;
            if (rangeValue.contains("-")) {
                String[] parts = rangeValue.split("-", 2);
                try {
                    if (!parts[0].isEmpty()) start = Long.parseLong(parts[0]);
                    if (parts.length > 1 && !parts[1].isEmpty()) end = Long.parseLong(parts[1]);
                } catch (NumberFormatException ignored) {}
            }

            if (start > end || start < 0 || end >= fileSize) {
                return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                        .header("Content-Range", "bytes */" + fileSize)
                        .build();
            }

            long contentLength = end - start + 1;
            byte[] data = new byte[(int) contentLength];
            try (var is = Files.newInputStream(filePath)) {
                is.skip(start);
                int read = is.read(data, 0, (int) contentLength);
                
            }

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header("Accept-Ranges", "bytes")
                    .header("Content-Range", "bytes " + start + "-" + end + "/" + fileSize)
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(contentLength)
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    
    private String determineContentType(String filename) {
        String fn = filename.toLowerCase();
        if (fn.endsWith(".mp4")) {
            return "video/mp4";
        } else if (fn.endsWith(".pdf")) {
            return "application/pdf";
        } else if (fn.endsWith(".png")) {
            return "image/png";
        } else if (fn.endsWith(".jpg") || fn.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        return "application/octet-stream";
    }
    
    // ORGANISATEUR : Supprimer un média
    @DeleteMapping("/media/{mediaId}")
    public ResponseEntity<Void> deleteMedia(@PathVariable Long mediaId) {
        try {
            var opt = mediaRepository.findById(mediaId);
            if (opt.isPresent()) {
                Media media = opt.get();
                
                try {
                    Path filePath = Paths.get(UPLOAD_DIR).resolve(media.getFilename());
                    Files.deleteIfExists(filePath);
                } catch (IOException e) {
                    
                    System.err.println("Warning: failed to delete file for media " + mediaId + " : " + e.getMessage());
                }
                mediaRepository.deleteById(mediaId);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}