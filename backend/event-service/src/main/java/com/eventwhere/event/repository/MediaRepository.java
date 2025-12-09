package com.eventwhere.event.repository;

import com.eventwhere.event.model.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByEventId(Long eventId);
    List<Media> findByEventIdAndType(Long eventId, String type);
}