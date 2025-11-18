package com.eventwhere.notificationservice.repository;

import com.eventwhere.notificationservice.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByEmailOrderByCreatedAtDesc(String email);
    List<Notification> findByEmailAndIsReadFalseOrderByCreatedAtDesc(String email);
    Long countByEmailAndIsReadFalse(String email);
}