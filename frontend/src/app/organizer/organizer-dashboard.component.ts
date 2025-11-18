import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../services/event.service';
import { ParticipantService, Participant } from '../services/participant.service';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.scss'
})

export class OrganizerDashboardComponent implements OnInit {
  events: Event[] = [];
  showCreateForm = false;
  showParticipants = false;
  showStats = false;
  showNotificationForm = false;
  selectedEventId: number | null = null;
  participants: Participant[] = [];
  stats: any = {};
  
  newEvent: Event = this.getEmptyEvent();

  newNotification = {
    email: '',
    type: 'EVENT_UPDATE',
    message: '',
    eventId: 0
  };

  constructor(
    private eventService: EventService,
    private participantService: ParticipantService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadMyEvents();
  }

  getEmptyEvent(): Event {
    return {
      title: '',
      description: '',
      type: 'CONFERENCE',
      location: '',
      eventDate: '',
      capacity: 50,
      organizerName: 'Admin',
      organizerEmail: 'admin@eventwhere.com'
    };
  }

  loadMyEvents() {
    this.eventService.getMyEvents('admin@eventwhere.com').subscribe({
      next: (data) => this.events = data,
      error: (err) => console.error('Erreur', err)
    });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  createEvent() {
    // Validation
    if (!this.newEvent.title || !this.newEvent.location || !this.newEvent.eventDate) {
      alert('Veuillez remplir tous les champs obligatoires !');
      return;
    }

    // Conversion de la date au bon format
    const formattedEvent = {
      ...this.newEvent,
      eventDate: new Date(this.newEvent.eventDate).toISOString()
    };

    this.eventService.createEvent(formattedEvent).subscribe({
      next: (created) => {
        alert('✅ Événement créé avec succès !');
        this.loadMyEvents();
        this.showCreateForm = false;
        this.resetForm();
      },
      error: (err) => {
        console.error('Erreur création', err);
        alert('❌ Erreur : ' + (err.error?.message || 'Problème serveur'));
      }
    });
  }

  deleteEvent(id: number) {
    if (confirm('⚠️ Supprimer cet événement ?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          alert('✅ Événement supprimé');
          this.loadMyEvents();
        },
        error: (err) => console.error('Erreur', err)
      });
    }
  }

  viewParticipants(eventId: number) {
    this.selectedEventId = eventId;
    this.showParticipants = true;
    this.participantService.getParticipantsByEvent(eventId).subscribe({
      next: (data) => this.participants = data,
      error: (err) => console.error('Erreur', err)
    });
  }

  viewStats() {
    this.showStats = true;
    // Grouper les événements par type et compter les participants
    const statsByType: any = {};
    
    this.events.forEach(event => {
      if (!statsByType[event.type]) {
        statsByType[event.type] = { count: 0, participants: 0 };
      }
      statsByType[event.type].count++;
      
      // Compter les participants (à améliorer avec vraie API)
      this.participantService.getParticipantsByEvent(event.id!).subscribe({
        next: (parts) => {
          statsByType[event.type].participants += parts.length;
        }
      });
    });
    
    this.stats = statsByType;
  }

  openNotificationForm() {
    this.showNotificationForm = true;
  }

  sendNotification() {
    if (!this.newNotification.email || !this.newNotification.message) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Note: Il faudrait créer une route dans NotificationService
    alert('Fonctionnalité de notification : à implémenter côté backend');
    this.showNotificationForm = false;
  }

  resetForm() {
    this.newEvent = this.getEmptyEvent();
  }

  closeModals() {
    this.showParticipants = false;
    this.showStats = false;
    this.showNotificationForm = false;
  }
}