import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../services/event.service';
import { ParticipantService, Participant } from '../services/participant.service';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-participant-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participant-dashboard.html',
  styleUrl: './participant-dashboard.scss'
})
export class ParticipantDashboardComponent implements OnInit {
  events: Event[] = [];
  allEvents: Event[] = [];
  myRegistrations: Participant[] = [];
  notifications: Notification[] = [];
  unreadCount = 0;
  searchKeyword = '';
  searchDate = '';
  participantEmail = 'participant@mail.com';
  showNotifications = false;

  constructor(
    private eventService: EventService,
    private participantService: ParticipantService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadEvents();
    this.loadMyRegistrations();
    this.loadNotifications();
  }

  loadEvents() {
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.allEvents = data;
      },
      error: (err) => console.error('Erreur', err)
    });
  }

  searchEvents() {
    let filtered = [...this.allEvents];
    
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(keyword) ||
        event.location.toLowerCase().includes(keyword) ||
        event.type.toLowerCase().includes(keyword)
      );
    }
    
    if (this.searchDate) {
      const searchDateObj = new Date(this.searchDate);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate.toDateString() === searchDateObj.toDateString();
      });
    }
    
    this.events = filtered;
  }

  registerToEvent(eventId: number) {
    const registration: Participant = {
      eventId: eventId,
      name: 'Participant Test',
      email: this.participantEmail
    };

    this.participantService.register(registration).subscribe({
      next: () => {
        alert('✅ Inscription réussie ! Vous recevrez une notification de confirmation.');
        this.loadMyRegistrations();
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Erreur inscription', err);
        alert('❌ Erreur lors de l\'inscription');
      }
    });
  }

  loadMyRegistrations() {
    this.participantService.getMyRegistrations(this.participantEmail).subscribe({
      next: (data) => this.myRegistrations = data,
      error: (err) => console.error('Erreur', err)
    });
  }

  unregister(id: number) {
    if (confirm('⚠️ Se désinscrire de cet événement ?')) {
      this.participantService.unregister(id).subscribe({
        next: () => {
          alert('✅ Désinscription réussie');
          this.loadMyRegistrations();
        },
        error: (err) => console.error('Erreur', err)
      });
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications(this.participantEmail).subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter(n => !n.isRead).length;
      },
      error: (err) => console.error('Erreur notifications', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Erreur', err)
    });
  }
}