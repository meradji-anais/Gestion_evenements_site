package com.eventwhere.notificationservice.controller;

import com.eventwhere.notificationservice.model.Notification;
import com.eventwhere.notificationservice.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
//@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(notificationRepository.save(notification));
    }
    
    @GetMapping("/{email}")
    public List<Notification> getNotifications(@PathVariable String email) {
        return notificationRepository.findByEmailOrderByCreatedAtDesc(email);
    }
    
    @GetMapping("/{email}/unread")
    public List<Notification> getUnreadNotifications(@PathVariable String email) {
        return notificationRepository.findByEmailAndIsReadFalseOrderByCreatedAtDesc(email);
    }
    
    @GetMapping("/{email}/unread/count")
    public Map<String, Long> getUnreadCount(@PathVariable String email) {
        Map<String, Long> result = new HashMap<>();
        result.put("count", notificationRepository.countByEmailAndIsReadFalse(email));
        return result;
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    notification.setIsRead(true);
                    return ResponseEntity.ok(notificationRepository.save(notification));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{email}/read-all")
    public ResponseEntity<String> markAllAsRead(@PathVariable String email) {
        List<Notification> notifications = notificationRepository.findByEmailAndIsReadFalseOrderByCreatedAtDesc(email);
        notifications.forEach(notif -> notif.setIsRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok("Toutes les notifications ont été marquées comme lues");
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        if (notificationRepository.existsById(id)) {
            notificationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}