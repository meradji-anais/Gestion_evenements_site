package com.eventwhere.event.repository;

import com.eventwhere.event.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    
    List<Event> findByOrganizerEmail(String email);
    
    List<Event> findByType(String type);
    
    List<Event> findByLocationContainingIgnoreCase(String location);
    
    @Query("SELECT e FROM Event e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.type) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> search(@Param("keyword") String keyword);
}
