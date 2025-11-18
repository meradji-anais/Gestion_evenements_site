package com.eventwhere.notificationservice.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String email;
    private String type;
    
    @Column(length = 1000)
    private String message;
    
    private Long eventId;
    private Boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}