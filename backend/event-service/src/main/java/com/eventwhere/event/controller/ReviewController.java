package com.eventwhere.event.controller;

import com.eventwhere.event.model.Review;
import com.eventwhere.event.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
//@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")  
public class ReviewController {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    // Créer une évaluation (participant)
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        // Vérifier si le participant a déjà évalué cet événement
        var existing = reviewRepository.findByEventIdAndParticipantEmail(
            review.getEventId(), 
            review.getParticipantEmail()
        );
        
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().build(); // Déjà évalué
        }
        
        review.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(reviewRepository.save(review));
    }
    
    // Obtenir toutes les évaluations d'un événement (organisateur)
    @GetMapping("/event/{eventId}")
    public List<Review> getReviewsByEvent(@PathVariable Long eventId) {
        return reviewRepository.findByEventId(eventId);
    }
    
    // Vérifier si un participant a déjà évalué (participant)
    @GetMapping("/event/{eventId}/participant/{email}")
    public ResponseEntity<Boolean> hasParticipantReviewed(
            @PathVariable Long eventId, 
            @PathVariable String email) {
        boolean hasReviewed = reviewRepository
            .findByEventIdAndParticipantEmail(eventId, email)
            .isPresent();
        return ResponseEntity.ok(hasReviewed);
    }
    
    // Statistiques d'évaluations pour un événement
    @GetMapping("/event/{eventId}/stats")
    public ResponseEntity<Map<String, Object>> getEventReviewStats(@PathVariable Long eventId) {
        Map<String, Object> stats = new HashMap<>();
        
        Double avgRating = reviewRepository.getAverageRatingByEventId(eventId);
        Long totalReviews = reviewRepository.countByEventId(eventId);
        
        stats.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        stats.put("totalReviews", totalReviews != null ? totalReviews : 0);
        
        return ResponseEntity.ok(stats);
    }
}