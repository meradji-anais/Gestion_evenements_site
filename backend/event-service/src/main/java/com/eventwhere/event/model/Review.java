package com.eventwhere.event.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long eventId;
    
    private String participantName;
    private String participantEmail;
    
    private Integer rating; // 1 à 5 étoiles
    
    @Column(length = 1000)
    private String comment;
    
    private LocalDateTime createdAt = LocalDateTime.now();
}