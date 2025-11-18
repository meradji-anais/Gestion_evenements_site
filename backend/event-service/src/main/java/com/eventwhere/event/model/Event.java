package com.eventwhere.event.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    private String type;
    private String location;
    private LocalDateTime eventDate;
    private Integer capacity;
    
    private String organizerName;
    private String organizerEmail;
    
    @Column(length = 500)
    private String imageUrl;
    
    private LocalDateTime createdAt = LocalDateTime.now();
}