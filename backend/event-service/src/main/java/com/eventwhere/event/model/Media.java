package com.eventwhere.event.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long eventId;
    private String type; // IMAGE, VIDEO, DOCUMENT, AFFICHE, PROGRAMME, PLAN
    private String filename;
    private String url;
    private LocalDateTime uploadedAt = LocalDateTime.now();
}