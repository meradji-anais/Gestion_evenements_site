package com.eventwhere.event.repository;

import com.eventwhere.event.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByEventId(Long eventId);
    
    // Vérifier si un participant a déjà évalué cet événement
    Optional<Review> findByEventIdAndParticipantEmail(Long eventId, String participantEmail);
    
    // Moyenne des étoiles pour un événement
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.eventId = :eventId")
    Double getAverageRatingByEventId(@Param("eventId") Long eventId);
    
    // Nombre total d'évaluations
    Long countByEventId(Long eventId);
}