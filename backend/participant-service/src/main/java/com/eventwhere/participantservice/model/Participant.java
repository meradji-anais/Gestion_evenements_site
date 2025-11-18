package com.eventwhere.participantservice.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long eventId;
    private String name;
    private String email;
    private String status;
    private LocalDateTime registeredAt = LocalDateTime.now();
}