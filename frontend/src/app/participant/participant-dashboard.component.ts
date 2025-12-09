
import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../services/event.service';
import { ParticipantService, Participant } from '../services/participant.service';
import { NotificationService, Notification } from '../services/notification.service';
import { DomSanitizer } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

type NotificationWithEvent = Notification & { eventTitle?: string };

@Component({
  selector: 'app-participant-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participant-dashboard.html',
  styleUrls: ['./participant-dashboard.scss']
})
export class ParticipantDashboardComponent implements OnInit {
  events: Event[] = [];
  allEvents: Event[] = [];
  myRegistrations: Participant[] = [];
  notifications: NotificationWithEvent[] = [];
  unreadCount = 0;
  showMyRegistrationsModal = false;
  showEventDetailModal = false;
  selectedEvent: Event | null = null;
  showMediaModal = false;
  selectedEventMedia: any[] = [];
  pendingRegistrations: Set<number> = new Set();
  pendingUnregisterIds: Set<number> = new Set();
  searchKeyword = '';
  searchDate = '';
  participantEmail = 'meradji@mail.com';
  showNotifications = false;
  private readonly base = 'http://localhost:9090';

  constructor(
    private eventService: EventService,
    private participantService: ParticipantService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadEvents();
    this.loadMyRegistrations();
    this.loadNotifications();
  }

  private addCacheBuster(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.includes('cb=')) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}cb=${Date.now()}`;
  }

  loadEvents() {
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        data.sort((a: Event, b: Event) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        this.events = data;
        this.allEvents = data;
        this.events.forEach(event => {
          if (event.id) {
            this.eventService.getEventMediaByEvent(event.id).subscribe({
              next: (medias) => {
                const imageMedia = (medias || []).find((m: any) => m.type === 'image');
                const videoMedia = (medias || []).find((m: any) => m.type === 'video');
                const docMedias = (medias || []).filter((m: any) => m.type === 'doc');
                if (imageMedia && imageMedia.url) {
                  const raw = imageMedia.url.startsWith('/') ? `${this.base}${imageMedia.url}` : imageMedia.url;
                  const final = this.addCacheBuster(raw) ?? raw;
                  event.imageUrl = final || undefined;
                } else {
                  event.imageUrl = undefined;
                }
                if (videoMedia && videoMedia.url) {
                  event.videoUrl = videoMedia.url.startsWith('/') ? `${this.base}${videoMedia.url}` : videoMedia.url;
                }
                if (docMedias.length > 0) {
                  event.docs = docMedias.map(d => ({ name: d.filename, url: d.url.startsWith('/') ? `${this.base}${d.url}` : d.url }));
                }
                this.ngZone.run(() => this.cdr.detectChanges());
              },
              error: (err) => console.warn('Erreur chargement médias pour event', event.id, err)
            });
          } else {
            event.imageUrl = undefined;
          }
        });
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
    if (!eventId) return;
    if (this.pendingRegistrations.has(eventId)) return; 
    if (this.isRegistered(eventId)) return; 

    
    this.pendingRegistrations.add(eventId);
    const tempId = -Date.now(); 
    const tempRegistration: Participant = {
      id: tempId,
      eventId: eventId,
      name: 'Meradji Anais',
      email: this.participantEmail
    };
   
    this.myRegistrations.push(tempRegistration);

    const registrationPayload: Participant = {
      eventId: eventId,
      name: 'Meradji Anais',
      email: this.participantEmail
    };

    this.participantService.register(registrationPayload).subscribe({
      next: (created) => {
       
        const idx = this.myRegistrations.findIndex(r => r.id === tempId);
        if (idx !== -1 && created) {
          this.myRegistrations[idx] = created;
        } else if (created) {
          
          this.myRegistrations.push(created);
        }
        this.pendingRegistrations.delete(eventId);
        this.unreadCount = this.unreadCount + 1;
        this.loadNotifications();
        this.loadMyRegistrations(); 
      },
      error: (err) => {
        
        this.pendingRegistrations.delete(eventId);
        this.myRegistrations = this.myRegistrations.filter(r => r.id !== tempId);
        console.error('Erreur inscription', err);
      }
    });
  }

  loadMyRegistrations() {
    this.participantService.getMyRegistrations(this.participantEmail).subscribe({
      next: (data) => this.myRegistrations = data || [],
      error: (err) => {
        this.myRegistrations = [];
        console.error('Erreur', err);
      }
    });
  }

  
  unregister(id: number) {
    if (id == null) return;
    const reg = this.myRegistrations.find(r => r.id === id);
    if (!reg) return;
    const eventId = reg.eventId;

    if (!confirm('Se désinscrire de cet événement ?')) return;
    
    if (id < 0) {
      
      this.pendingRegistrations.delete(eventId!);
      this.myRegistrations = this.myRegistrations.filter(r => r.id !== id);
      
      return;
    }

    if (this.pendingUnregisterIds.has(id)) return;
    this.pendingUnregisterIds.add(id);

    this.participantService.unregister(id).subscribe({
      next: () => {
        this.pendingUnregisterIds.delete(id);
        this.myRegistrations = this.myRegistrations.filter(r => r.id !== id);
        this.unreadCount = this.unreadCount + 1;
        const evUnreg = this.events.find(e => e.id === eventId);
        const noteUnreg = {
          email: this.participantEmail,
          type: 'REGISTRATION_CANCELLED',
          message: `Vous vous êtes désinscrit avec succès de l'événement: "${evUnreg?.title || 'événement'}".`,
          eventId: eventId || 0
        };
        this.notificationService.createNotification(noteUnreg).subscribe({
          next: () => {
            this.loadNotifications();
            this.loadMyRegistrations();
          },
          error: () => {
            this.loadNotifications();
            this.loadMyRegistrations();
          }
        });
      },
      error: (err) => {
        this.pendingUnregisterIds.delete(id);
        console.error('Erreur', err);
        this.loadMyRegistrations();
      }
    });
  }

  isRegistered(eventId: number | undefined): boolean {
    if (!eventId) return false;
    return this.myRegistrations.some(r => r.eventId === eventId);
  }

  getRegistrationId(eventId: number | undefined): number | undefined {
    if (!eventId) return undefined;
    const reg = this.myRegistrations.find(r => r.eventId === eventId);
    return reg ? reg.id : undefined;
  }

  loadNotifications() {
    this.notificationService.getNotifications(this.participantEmail).subscribe({
      next: (data) => {
        const normalize = (s: string) => s ? s.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF])/g, '').trim() : s;
        const seen = new Set<string>();
        const unique: NotificationWithEvent[] = [];
        (data || []).forEach(n => {
          const msg = n.message || '';
          const normMsg = normalize(msg);
          const key = `${n.type}::${n.eventId}::${normMsg}`;
          if (!seen.has(key)) {
            seen.add(key);
            const notifWithEvent: NotificationWithEvent = { ...n, message: normMsg };
            const event = this.events.find(e => e.id === n.eventId);
            if (event) {
              notifWithEvent.eventTitle = event.title;
            }
            unique.push(notifWithEvent);
          }
        });
        this.notifications = unique;
        this.unreadCount = unique.filter(n => !n.isRead).length;
      },
      error: (err) => console.error('Erreur notifications', err)
    });
  }

  markAsRead(id: number) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
    this.notificationService.markAsRead(id).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Erreur marquer comme lu', err);
        this.loadNotifications();
      }
    });
  }

  clearNotifications() {
    const toDelete = this.notifications.filter(n => n.id != null).map(n => n.id!) as number[];
    if (toDelete.length === 0) {
      this.notifications = [];
      this.unreadCount = 0;
      this.showNotifications = false;
      return;
    }
    if (!confirm('Supprimer définitivement toutes les notifications affichées ? Cette action est irréversible.')) return;
    const ops = toDelete.map(id => this.notificationService.deleteNotification(id));
    forkJoin(ops).subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.showNotifications = false;
      },
      error: (err) => {
        console.error('Erreur lors de la suppression des notifications', err);
        this.loadNotifications();
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  toggleRegistrationsModal() {
    this.showMyRegistrationsModal = !this.showMyRegistrationsModal;
  }

  openEventDetails(ev: Event) {
    this.selectedEvent = ev;
    this.showEventDetailModal = true;
  }

  closeEventDetails() {
    this.showEventDetailModal = false;
    this.selectedEvent = null;
  }

  openMediaModal(eventId: number) {
    this.eventService.getEventMediaByEvent(eventId).subscribe({
      next: (medias) => {
        const base = this.base;
        this.selectedEventMedia = (medias || []).map((m: any) => ({ ...m, url: m.url && m.url.startsWith('/') ? `${base}${m.url}` : m.url }));
        this.showMediaModal = true;
      },
      error: (err) => {
        console.error('Erreur chargement médias', err);
        this.selectedEventMedia = [];
        this.showMediaModal = true;
      }
    });
  }

  closeMediaModal() {
    this.showMediaModal = false;
    this.selectedEventMedia = [];
  }

  sanitizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getRegisteredEventList(): Event[] {
    const ids = new Set(this.myRegistrations.map(r => r.eventId));
    return this.events.filter(e => e.id != null && ids.has(e.id));
  }
}