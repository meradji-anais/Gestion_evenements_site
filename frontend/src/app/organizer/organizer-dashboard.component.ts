import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../services/event.service';
import { ParticipantService, Participant } from '../services/participant.service';
import { NotificationService } from '../services/notification.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { merge, forkJoin, tap, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

type EventWithPreview = Event & { previewImageUrl?: string | null };

interface ParticipantGrouped {
  name: string;
  email: string;
  status: string | undefined;
  registeredAt: string | undefined;
  events: { title: string; date: string }[];
}

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './organizer-dashboard.html',
  styleUrls: ['./organizer-dashboard.scss']
})
export class OrganizerDashboardComponent implements OnInit {
  events: EventWithPreview[] = [];
  showCreateForm = false;
  showParticipants = false;
  showStats = false;
  showNotificationForm = false;
  selectedEventId: number | null = null;
  participants: Participant[] = [];
  participantsGrouped: ParticipantGrouped[] = [];
  stats: Record<string, { count: number; participants: number }> = {};
  selectedFile: File | null = null;
  uploadProgress = '';
  selectedImage: File | null = null;
  selectedVideo: File | null = null;
  selectedDocs: File[] = [];
  selectedImagePreview: string | null = null;
  selectedVideoPreview: string | null = null;
  selectedDocsPreviews: string[] = [];
  isEditing = false;
  editingEventId: number | null = null;
  isSubmitting = false;
  showEventDetailModal = false;
  selectedEvent: EventWithPreview | null = null;
  showMediaModal = false;
  selectedEventMedia: any[] = [];
  existingMedia: any[] = [];
  showPreviewModal = false;
  previewMedias: any[] = [];
  newEvent: EventWithPreview = this.getEmptyEvent() as EventWithPreview;
  newNotification = {
    email: '',
    type: 'REGISTRATION_CONFIRMED',
    message: '',
    eventId: 0
  };
  private readonly baseUrl = 'http://localhost:9090';
  private readonly defaultImage =
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=60';
  Object = Object;

  // UI profile menu
  showProfileMenu = false;

  constructor(
    private eventService: EventService,
    private participantService: ParticipantService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    public authService: AuthService,
    private router: Router
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
    organizerName: 'Organisateur',
    organizerEmail: '' 
  } as Event;
}

  private addCacheBuster(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.includes('cb=')) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}cb=${Date.now()}`;
  }

  loadMyEvents() {
  const currentUserEmail = this.authService.currentUserValue?.email || 'admin@eventwhere.com';
  this.eventService.getMyEvents(currentUserEmail).subscribe({
      next: (data) => {
        data.sort((a: Event, b: Event) => (b.id || 0) - (a.id || 0));

        this.events = data.map((e) => ({ ...(e as Event), previewImageUrl: null })) as EventWithPreview[];
        const mediaCalls = this.events.map((ev) => (ev.id ? this.eventService.getEventMediaByEvent(ev.id) : of([])));
        forkJoin(mediaCalls).subscribe({
          next: (allMedias) => {
            const base = this.baseUrl;
            const updatedEvents = this.events.map((ev, i) => {
              const medias = (allMedias[i] || []) as any[];
              const imageMedia = medias.find((m) => m.type === 'image');
              const videoMedia = medias.find((m) => m.type === 'video');
              const docMedias = medias.filter((m) => m.type === 'doc');
              const updated: any = { ...ev };
              if (imageMedia && imageMedia.url) {
                const raw = imageMedia.url.startsWith('/') ? `${base}${imageMedia.url}` : imageMedia.url;
                updated.imageUrl = this.addCacheBuster(raw) || raw;
                updated.previewImageUrl = null;
              }
              if (videoMedia && videoMedia.url) {
                updated.videoUrl = videoMedia.url.startsWith('/') ? `${base}${videoMedia.url}` : videoMedia.url;
              }
              if (docMedias.length > 0) {
                updated.docs = docMedias.map((d: any) => ({
                  name: d.filename,
                  url: d.url.startsWith('/') ? `${base}${d.url}` : d.url
                }));
              }
              return updated;
            });
            this.ngZone.run(() => {
              this.events = updatedEvents;
              this.cdr.detectChanges();
            });
          },
          error: (err: any) => console.warn('Erreur chargement médias', err)
        });
      },
      error: (err: any) => console.error('Erreur', err)
    });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) this.resetForm();
  }

  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.uploadProgress = ` Fichier sélectionné : ${file.name}`;
      } else {
        alert('Type de fichier non autorisé. Utilisez JPG, PNG ou PDF.');
        this.selectedFile = null;
      }
    }
  }

  onFileSelectedByType(event: any, type: 'image' | 'video' | 'doc') {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (type === 'image') {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        alert('Type d\'image non autorisé. Utilisez JPG ou PNG.');
        return;
      }

      try {
        if (this.selectedImagePreview && typeof this.selectedImagePreview === 'string' && this.selectedImagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(this.selectedImagePreview);
        }
      } catch (e) {}

      this.selectedImage = file;
      this.uploadProgress = ` Image sélectionnée : ${file.name}`;

      try {
        this.selectedImagePreview = URL.createObjectURL(file);
        (this.newEvent as EventWithPreview).previewImageUrl = this.selectedImagePreview;

        if (!this.isEditing) {
          const tmp = this.events.find((ev) => !ev.id && ev.title === this.newEvent.title);
          if (tmp) tmp.previewImageUrl = this.selectedImagePreview;
        }
        this.ngZone.run(() => this.cdr.detectChanges());
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImagePreview = e.target.result;
          (this.newEvent as EventWithPreview).previewImageUrl = this.selectedImagePreview;
          if (!this.isEditing) {
            const tmp = this.events.find((ev) => !ev.id && ev.title === this.newEvent.title);
            if (tmp) tmp.previewImageUrl = this.selectedImagePreview;
          }
          this.ngZone.run(() => this.cdr.detectChanges());
        };
        reader.readAsDataURL(file);
      }
    } else if (type === 'video') {
      const allowed = ['video/mp4'];
      if (!allowed.includes(file.type)) {
        alert('Type de vidéo non autorisé. Utilisez MP4.');
        return;
      }
      this.selectedVideo = file;
      this.uploadProgress = ` Vidéo sélectionnée : ${file.name}`;
      try {
        this.selectedVideoPreview = URL.createObjectURL(file);
      } catch (e) {
        this.selectedVideoPreview = null;
      }
    } else if (type === 'doc') {
      const allowed = ['application/pdf'];
      if (!allowed.includes(file.type)) {
        alert('Type de document non autorisé. Utilisez PDF.');
        return;
      }
      this.selectedDocs.push(file);
      try {
        this.selectedDocsPreviews.push(URL.createObjectURL(file));
      } catch (e) {
        this.selectedDocsPreviews.push('');
      }
      this.uploadProgress = ` Document ajouté : ${file.name}`;
    }
  }

  createEvent() {
    if (!this.newEvent.title || !this.newEvent.location || !this.newEvent.eventDate) {
      alert('Veuillez remplir le titre, le lieu et la date !');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    
const currentUserEmail = this.authService.currentUserValue?.email || 'admin@eventwhere.com';
const currentUserName = this.authService.currentUserValue?.name || 'Organisateur';

const formattedEvent = { 
  ...this.newEvent, 
  eventDate: new Date(this.newEvent.eventDate).toISOString(),
  organizerEmail: currentUserEmail,
  organizerName: currentUserName
};

    if (this.isEditing && this.editingEventId != null) {
      this.eventService.updateEvent(this.editingEventId, formattedEvent).subscribe({
        next: (updated) => {
          this.loadMyEvents();
          if (this.selectedImage || this.selectedVideo || this.selectedDocs.length > 0) {
            this.uploadFiles(updated.id!);
            return;
          }
          alert('Événement mis à jour avec succès !');
          this.resetForm();
          this.isSubmitting = false;
          this.showCreateForm = false;
        },
        error: (err: any) => {
          console.error('Erreur mise à jour', err);
          alert('Erreur lors de la mise à jour : ' + (err.error?.message || err.message || 'Problème serveur'));
          this.isSubmitting = false;
        }
      });
      return;
    }

    this.eventService.createEvent(formattedEvent).subscribe({
      next: (created) => {
        if (created && created.id) {
          const createdId = created.id;
          const clientEvent = ({ ...(created as Event), previewImageUrl: this.selectedImagePreview || null } as EventWithPreview);
          if (!this.events.some((e) => e.id === clientEvent.id)) {
            this.ngZone.run(() => {
              this.events = [clientEvent, ...this.events];
              this.cdr.detectChanges();
            });
          }

          this.eventService.getEventMediaByEvent(createdId).subscribe({
            next: (medias) => {
              const base = this.baseUrl;
              const imageMedia = medias.find((m: any) => m.type === 'image');
              if (imageMedia && imageMedia.url) {
                const raw = imageMedia.url.startsWith('/') ? `${base}${imageMedia.url}` : imageMedia.url;
                const serverUrl = this.addCacheBuster(raw) || raw;
                const ev = this.events.find((e) => e.id === createdId) as EventWithPreview | undefined;
                if (ev) {
                  ev.imageUrl = serverUrl;
                  ev.previewImageUrl = null;
                  this.ngZone.run(() => {
                    this.events = [...this.events];
                    this.cdr.detectChanges();
                  });
                }
              }
            },
            error: (err: any) => {},
            complete: () => {
              if (this.selectedImage || this.selectedVideo || this.selectedDocs.length > 0) {
                this.uploadFiles(createdId, clientEvent);
                return;
              }
              alert('Événement créé avec succès !');
              this.resetForm();
              this.isSubmitting = false;
              this.showCreateForm = false;
            }
          });
        } else {
          if (created) {
            const minimal: any = { ...created, previewImageUrl: this.selectedImagePreview || null };
            if (!this.events.some((e) => e.id === minimal.id)) {
              this.ngZone.run(() => {
                this.events.unshift(minimal);
                this.cdr.detectChanges();
              });
            }
          }
          this.loadMyEvents();
          if (this.selectedImage || this.selectedVideo || this.selectedDocs.length > 0) {
            const id = created?.id;
            if (id) {
              this.uploadFiles(id, created as EventWithPreview);
              return;
            }
            const found = this.findCreatedEvent(formattedEvent);
            if (found?.id) {
              this.uploadFiles(found.id, created as EventWithPreview);
              return;
            }
          }
          alert('Événement créé avec succès !');
          this.resetForm();
          this.isSubmitting = false;
          this.showCreateForm = false;
        }
      },
      error: (err: any) => {
        console.error('Erreur création', err);

        const currentUserEmail = this.authService.currentUserValue?.email || 'admin@eventwhere.com';
  this.eventService.getMyEvents(currentUserEmail).subscribe({
          next: (data) => {
            this.events = data.map((e) => ({ ...(e as Event), previewImageUrl: null })) as EventWithPreview[];
            const found = this.findCreatedEvent(formattedEvent);
            if (found) {
              if (this.selectedFile && found.id) this.uploadFile(found.id);
              else {
                alert('Événement créé (vérifié) malgré une erreur réseau lors de la réponse.');
                this.resetForm();
                this.isSubmitting = false;
                this.showCreateForm = false;
              }
            } else {
              alert('Erreur lors de la création : ' + (err.error?.message || err.message || 'Problème serveur'));
              this.isSubmitting = false;
            }
            this.ngZone.run(() => this.cdr.detectChanges());
          },
          error: (e: any) => {
            console.error('Erreur reload après échec création', e);
            alert('Erreur : ' + (err.error?.message || err.message || 'Problème réseau et récupération impossible'));
            this.isSubmitting = false;
          }
        });
      }
    });
  }

  openEditForm(event: EventWithPreview) {
    this.isEditing = true;
    this.editingEventId = event.id ?? null;
    this.newEvent = { ...event } as EventWithPreview;
    const d = new Date(event.eventDate);
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.newEvent.eventDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}` as any;
    this.showCreateForm = true;
    this.selectedImage = null;
    this.selectedVideo = null;
    this.selectedDocs = [];
    this.selectedImagePreview = null;
    this.selectedVideoPreview = null;
    this.selectedDocsPreviews = [];
    this.existingMedia = [];
    if (event.id) {
      this.eventService.getEventMediaByEvent(event.id).subscribe({
        next: (medias) => {
          const imageMedia = medias.find((m: any) => m.type === 'image');
          const videoMedia = medias.find((m: any) => m.type === 'video');
          const docMedias = medias.filter((m: any) => m.type === 'doc');
          this.existingMedia = medias || [];
          if (imageMedia && imageMedia.url) {
            this.selectedImagePreview = imageMedia.url.startsWith('/') ? `${this.baseUrl}${imageMedia.url}` : imageMedia.url;
            (this.newEvent as EventWithPreview).previewImageUrl = this.selectedImagePreview;
          }
          if (videoMedia && videoMedia.url) {
            this.selectedVideoPreview = videoMedia.url.startsWith('/') ? `${this.baseUrl}${videoMedia.url}` : videoMedia.url;
          }
          if (docMedias && docMedias.length > 0) {
            this.selectedDocsPreviews = docMedias.map((d) => (d.url.startsWith('/') ? `${this.baseUrl}${d.url}` : d.url));
          }
          this.ngZone.run(() => this.cdr.detectChanges());
        },
        error: (err: any) => console.warn('Erreur loading existing media for edit', err)
      });
    }
  }

  removeSelectedDoc(index: number) {
    if (index < 0 || index >= this.selectedDocs.length) return;
    this.selectedDocs.splice(index, 1);
    if (this.selectedDocsPreviews && this.selectedDocsPreviews.length > index) {
      const url = this.selectedDocsPreviews.splice(index, 1)[0];
      try {
        if (url) URL.revokeObjectURL(url);
      } catch (e) {}
    }
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  confirmDeleteExistingMedia(media: any) {
    if (!confirm('Supprimer ce média existant ? Cette action est définitive.')) return;
    if (!media || !media.id) return;
    this.eventService.deleteMedia(media.id).subscribe({
      next: () => {
        this.existingMedia = this.existingMedia.filter((m: any) => m.id !== media.id);
        this.selectedEventMedia = this.selectedEventMedia.filter((m: any) => m.id !== media.id);

        if (this.selectedEvent && (this.selectedEvent as any).docs) {
          (this.selectedEvent as EventWithPreview & any).docs = (this.selectedEvent as any).docs.filter(
            (d: any) => d.url !== media.url && d.filename !== media.filename
          );
        }

        this.events = this.events.map((e) => {
          if (e.id === media.eventId) {
            const newE = { ...e } as any;
            newE.docs = (newE.docs || []).filter((d: any) => d.url !== media.url && d.name !== media.filename);
            if (media.type === 'image' && newE.imageUrl && newE.imageUrl === media.url) {
              newE.imageUrl = null;
              newE.previewImageUrl = null;
            }
            if (media.type === 'video' && newE.videoUrl && newE.videoUrl === media.url) {
              newE.videoUrl = null;
            }
            return newE;
          }
          return e;
        });

        if (this.isEditing && this.editingEventId === media.eventId) {
          if (media.type === 'image' && (this.newEvent as any).previewImageUrl === media.url) {
            (this.newEvent as any).previewImageUrl = null;
            this.selectedImagePreview = null;
          }
        }

        this.ngZone.run(() => {
          this.events = [...this.events];
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => console.error('Erreur suppression média', err)
    });
  }

  openEventInfo(event: EventWithPreview) {
    this.showCreateForm = false;
    if (event.id != null) {
      this.eventService.getEventById(event.id).subscribe({
        next: (full) => {
          const base = this.baseUrl;
          if (full.imageUrl && full.imageUrl.startsWith('/')) full.imageUrl = `${base}${full.imageUrl}`;
          if ((full as any).videoUrl && (full as any).videoUrl.startsWith('/'))
            (full as any).videoUrl = `${base}${(full as any).videoUrl}`;
          if ((full as any).docs && Array.isArray((full as any).docs)) {
            (full as any).docs = (full as any).docs.map((d: any) => ({
              ...d,
              url: d.url && d.url.startsWith('/') ? `${base}${d.url}` : d.url
            }));
          }

          const local = this.events.find((ev) => ev.id === event.id);
          if (!full.imageUrl && local && (local as EventWithPreview).previewImageUrl) {
            (full as EventWithPreview).previewImageUrl = (local as EventWithPreview).previewImageUrl;
          } else {
            if ((full as any).imageUrl) (full as any).previewImageUrl = null;
            if ((full as any).imageUrl) (full as any).imageUrl = this.addCacheBuster((full as any).imageUrl) || (full as any).imageUrl;
          }

          this.selectedEvent = full as EventWithPreview;
          this.showEventDetailModal = true;
          this.ngZone.run(() => this.cdr.detectChanges());
        },
        error: (err: any) => {
          console.warn('Erreur fetching event details, showing available data', err);

          this.selectedEvent = event;
          this.showEventDetailModal = true;
          this.ngZone.run(() => this.cdr.detectChanges());
        }
      });
    } else {
      this.selectedEvent = event;
      this.showEventDetailModal = true;
    }
  }

  openMediaModal(eventId: number) {
    this.eventService.getEventMediaByEvent(eventId).subscribe({
      next: (medias) => {
        const base = this.baseUrl;
        this.selectedEventMedia = (medias || []).map((m: any) => ({
          ...m,
          url: m.url && m.url.startsWith('/') ? `${base}${m.url}` : m.url
        }));
        this.showMediaModal = true;
      },
      error: (err: any) => {
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

  previewBeforePublish() {
    this.previewMedias = [];
    if (this.selectedImage) {
      this.previewMedias.push({ type: 'image', filename: this.selectedImage.name, preview: this.selectedImagePreview });
    }
    if (!this.selectedImage && this.selectedImagePreview) {
      this.previewMedias.push({ type: 'image', filename: '(existante)', preview: this.selectedImagePreview });
    }
    if (this.selectedVideo) {
      this.previewMedias.push({ type: 'video', filename: this.selectedVideo.name, preview: this.selectedVideoPreview || null });
    }
    if (!this.selectedVideo && this.selectedVideoPreview) {
      this.previewMedias.push({ type: 'video', filename: '(existante)', preview: this.selectedVideoPreview });
    }
    if (this.selectedDocs.length > 0) {
      this.selectedDocs.forEach((doc, idx) => {
        this.previewMedias.push({ type: 'doc', filename: doc.name, preview: this.selectedDocsPreviews[idx] || null });
      });
    }
    if ((this.selectedDocsPreviews && this.selectedDocsPreviews.length > 0) && (!this.selectedDocs || this.selectedDocs.length === 0)) {
      this.selectedDocsPreviews.forEach((p, idx) => {
        this.previewMedias.push({ type: 'doc', filename: '(existant)', preview: p || null });
      });
    }
    this.showPreviewModal = true;
  }

  closePreviewModal() {
    this.showPreviewModal = false;
    this.previewMedias = [];
    if (this.selectedVideoPreview) {
      try {
        URL.revokeObjectURL(this.selectedVideoPreview);
      } catch (e) {}
      this.selectedVideoPreview = null;
    }

    if (this.selectedImagePreview && this.selectedImagePreview.startsWith && this.selectedImagePreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.selectedImagePreview);
      } catch (e) {}

      this.selectedImagePreview = null;
      (this.newEvent as EventWithPreview).previewImageUrl = null;
    }
    if (this.selectedDocsPreviews && this.selectedDocsPreviews.length > 0) {
      this.selectedDocsPreviews.forEach((url) => {
        try {
          if (url) URL.revokeObjectURL(url);
        } catch (e) {}
      });
      this.selectedDocsPreviews = [];
    }
  }

  sanitizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatValue(v: any): string {
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
  }

  eventKeyValue(event: EventWithPreview | null): Record<string, any> {
    return (event as any) || {};
  }

  getEventImageUrl(ev: EventWithPreview | any): string {
    if (!ev) return this.defaultImage;
    const server = (ev as any).imageUrl;
    const preview = (ev as EventWithPreview).previewImageUrl;
    const url = server || preview || '';
    if (!url) return this.defaultImage;
    return url.startsWith('/') ? `${this.baseUrl}${url}` : url;
  }

  private findCreatedEvent(payload: any): EventWithPreview | undefined {
    return this.events.find(
      (ev) =>
        ev.title === payload.title &&
        new Date(ev.eventDate).toISOString() === new Date(payload.eventDate).toISOString() &&
        (ev.organizerEmail === payload.organizerEmail || !payload.organizerEmail)
    ) as EventWithPreview | undefined;
  }

  uploadFile(eventId: number) {
    if (!this.selectedFile) return;
    this.uploadSingleFile(eventId, this.selectedFile, 'file').subscribe({
      next: () => {},
      error: (err: any) => {
        console.error('Erreur uploadFile', err);
        alert('Erreur lors de l\'upload du fichier.');
      },
      complete: () => {
        this.loadMyEvents();
      }
    });
  }

  private uploadSingleFile(eventId: number, file: File, mediaType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', mediaType);
    this.uploadProgress = 'Upload en cours...';
    return this.http.post(`http://localhost:9090/api/events/${eventId}/media`, formData).pipe(
      tap((response: any) => {
        this.uploadProgress = ` ${file.name} uploadé`;
        try {
          const base = this.baseUrl;
          const raw = response?.url ? (response.url.startsWith('/') ? `${base}${response.url}` : response.url) : null;
          const url = this.addCacheBuster(raw);
          const ev = this.events.find((e) => e.id === eventId) as any;
          if (ev && url) {
            if (response.type === 'image') {
              ev.imageUrl = url;
              ev.previewImageUrl = null;
            } else if (response.type === 'video') {
              ev.videoUrl = url;
            } else if (response.type === 'doc') {
              ev.docs = ev.docs || [];
              ev.docs.push({ name: response.filename || file.name, url });
            }
          }
          this.ngZone.run(() => {
            this.events = [...this.events];
            this.cdr.detectChanges();
          });
          if (this.selectedEvent && this.selectedEvent.id === eventId) {
            if (response.type === 'image') {
              (this.selectedEvent as any).imageUrl = url;
              (this.selectedEvent as any).previewImageUrl = null;
            } else if (response.type === 'video') {
              (this.selectedEvent as any).videoUrl = url;
            } else if (response.type === 'doc') {
              (this.selectedEvent as any).docs = (this.selectedEvent as any).docs || [];
              (this.selectedEvent as any).docs.push({ name: response.filename || file.name, url });
            }
            this.ngZone.run(() => this.cdr.detectChanges());
          }
        } catch (e) {}
      }),
      catchError((err: any) => {
        console.error('Erreur upload:', err);
        this.uploadProgress = `Erreur upload ${file.name}`;
        throw err;
      })
    );
  }

  closeEventDetails() {
    this.showEventDetailModal = false;
    this.selectedEvent = null;
  }

  uploadFiles(eventId: number, createdEvent?: EventWithPreview) {
    const proceedWithUploads = () => {
      const uploads: any[] = [];
      if (this.selectedImage) uploads.push(this.uploadSingleFile(eventId, this.selectedImage!, 'image'));
      if (this.selectedVideo) uploads.push(this.uploadSingleFile(eventId, this.selectedVideo!, 'video'));
      if (this.selectedDocs && this.selectedDocs.length > 0) {
        this.selectedDocs.forEach((doc) => {
          uploads.push(this.uploadSingleFile(eventId, doc, 'doc'));
        });
      }
      if (uploads.length === 0) {
        this.resetForm();
        alert('Événement créé !');
        this.isSubmitting = false;
        if (createdEvent) this.events = [createdEvent, ...this.events];
        else this.loadMyEvents();
        this.showCreateForm = false;
        return;
      }
      merge(...uploads).subscribe({
        next: () => {},
        error: (err: any) => {
          console.error('Upload error:', err);
          this.isSubmitting = false;
          this.loadMyEvents();
          alert('Événement créé mais une erreur est survenue lors de l\'upload des médias.');
        },
        complete: () => {
          this.resetForm();
          this.isSubmitting = false;
          if (createdEvent) {
            const exists = this.events.some((e) => e.id === createdEvent.id);
            if (!exists) this.events = [createdEvent, ...this.events];
            this.eventService.getEventMediaByEvent(createdEvent.id!).subscribe({
              next: (medias) => {
                const base = this.baseUrl;
                const imageMedia = medias.find((m: any) => m.type === 'image');
                if (imageMedia && imageMedia.url) {
                  const raw = imageMedia.url.startsWith('/') ? `${base}${imageMedia.url}` : imageMedia.url;
                  const url = this.addCacheBuster(raw);
                  const ev = this.events.find((e) => e.id === createdEvent.id) as any;
                  if (ev) {
                    ev.imageUrl = url;
                    ev.previewImageUrl = null;
                  }
                  this.ngZone.run(() => {
                    this.events = [...this.events];
                    this.cdr.detectChanges();
                  });
                }
              },
              error: (err: any) => {},
              complete: () => {
                this.loadMyEvents();
              }
            });
          } else {
            this.loadMyEvents();
          }
          alert('Événement créé et médias uploadés !');
          this.showCreateForm = false;
        }
      });
    };

    if (this.isEditing && eventId) {
      this.eventService.getEventMediaByEvent(eventId).subscribe({
        next: (medias) => {
          const deletes: any[] = [];
          if (this.selectedImage) {
            const existingImages = medias.filter((m: any) => m.type === 'image');
            existingImages.forEach((m: any) => deletes.push(this.eventService.deleteMedia(m.id)));
          }
          if (this.selectedVideo) {
            const existingVideos = medias.filter((m: any) => m.type === 'video');
            existingVideos.forEach((m: any) => deletes.push(this.eventService.deleteMedia(m.id)));
          }
          if (deletes.length > 0) {
            forkJoin(deletes).subscribe({ complete: () => proceedWithUploads(), error: () => proceedWithUploads() });
          } else {
            proceedWithUploads();
          }
        },
        error: (err: any) => {
          proceedWithUploads();
        }
      });
    } else {
      proceedWithUploads();
    }
  }

  confirmDeleteMedia(media: any) {
    if (!confirm('Supprimer ce média ? Cette action est définitive.')) return;
    if (!media || !media.id) return;
    this.eventService.deleteMedia(media.id).subscribe({
      next: () => {
        this.selectedEventMedia = this.selectedEventMedia.filter((m) => m.id !== media.id);
        if (this.selectedEvent && (this.selectedEvent as any).docs) {
          (this.selectedEvent as any).docs = (this.selectedEvent as any).docs.filter(
            (d: any) => d.url !== media.url && d.filename !== media.filename
          );
        }
        this.events = this.events.map((e) => {
          if (e.id === media.eventId) {
            const newE = { ...e } as any;
            newE.docs = (newE.docs || []).filter((d: any) => d.url !== media.url && d.name !== media.filename);
            if (media.type === 'image' && newE.imageUrl && newE.imageUrl === media.url) {
              newE.imageUrl = null;
              newE.previewImageUrl = null;
            }
            if (media.type === 'video' && newE.videoUrl && newE.videoUrl === media.url) {
              newE.videoUrl = null;
            }
            return newE;
          }
          return e;
        });
        this.ngZone.run(() => {
          this.events = [...this.events];
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => console.error('Erreur suppression média', err)
    });
  }

  deleteEvent(id: number) {
    if (confirm('Supprimer cet événement ? Les participants seront notifiés automatiquement.')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          alert('Événement supprimé et participants notifiés');
          this.events = this.events.filter((e) => e.id !== id);
          this.loadMyEvents();
        },
        error: (err: any) => console.error('Erreur', err)
      });
    }
  }

  viewParticipants(eventId?: number) {
    this.showParticipants = true;
    if (eventId) {
      this.selectedEventId = eventId;
      this.participantService.getParticipantsByEvent(eventId).subscribe({
        next: (data) => {
          this.participants = data;
          this.participantsGrouped = [];
        },
        error: (err: any) => console.error('Erreur', err)
      });
    } else {
      this.selectedEventId = null;
      this.participants = [];
      this.loadAllParticipantsGrouped();
    }
  }

  loadAllParticipantsGrouped() {
    const allParticipants: Participant[] = [];
    let completedRequests = 0;
    if (this.events.length === 0) {
      this.participantsGrouped = [];
      return;
    }
    this.events.forEach((event) => {
      this.participantService.getParticipantsByEvent(event.id!).subscribe({
        next: (data) => {
          data.forEach((p) => {
            allParticipants.push({ ...p, eventId: event.id, eventTitle: event.title, eventDate: event.eventDate } as any);
          });
          completedRequests++;
          if (completedRequests === this.events.length) {
            this.groupParticipantsByEmail(allParticipants);
          }
        },
        error: (err: any) => {
          console.error('Erreur chargement participants', err);
          completedRequests++;
          if (completedRequests === this.events.length) {
            this.groupParticipantsByEmail(allParticipants);
          }
        }
      });
    });
  }

  groupParticipantsByEmail(allParticipants: any[]) {
    const grouped: { [email: string]: ParticipantGrouped } = {};
    allParticipants.forEach((p) => {
      if (!grouped[p.email]) {
        grouped[p.email] = { name: p.name, email: p.email, status: p.status, registeredAt: p.registeredAt, events: [] };
      }
      grouped[p.email].events.push({ title: p.eventTitle || 'Événement inconnu', date: p.eventDate || '' });
    });
    this.participantsGrouped = Object.values(grouped);
  }

  exportParticipantsToCSV() {
    if (this.participantsGrouped.length === 0) {
      alert('Aucun participant à exporter');
      return;
    }
    const headers = ['Nom', 'Email', 'Statut', 'Date dinscription', 'Événements'];
    const rows = this.participantsGrouped.map((p) => [
      p.name,
      p.email,
      p.status || 'N/A',
      p.registeredAt ? new Date(p.registeredAt).toLocaleDateString('fr-FR') : 'N/A',
      p.events.map((e) => e.title).join(' | ')
    ]);
    let csvContent = headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `participants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Export CSV réussi !');
  }

  viewStats() {
    this.showStats = true;
    const statsByType: any = {};
    this.events.forEach((event) => {
      if (!statsByType[event.type]) {
        statsByType[event.type] = { count: 0, participants: 0 };
      }
      statsByType[event.type].count++;
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
    const notification = {
      email: this.newNotification.email,
      type: this.newNotification.type,
      message: this.newNotification.message,
      eventId: this.newNotification.eventId || this.events[0]?.id || 0
    };
    this.notificationService.createNotification(notification).subscribe({
      next: () => {
        alert('Notification envoyée avec succès !');
        this.showNotificationForm = false;
        this.newNotification = { email: '', type: 'REGISTRATION_CONFIRMED', message: '', eventId: 0 };
      },
      error: (err: any) => {
        console.error('Erreur notification', err);
        alert('Erreur lors de l envoi de la notification');
      }
    });
  }

  resetForm() {
    try {
      if (this.selectedImagePreview && this.selectedImagePreview.startsWith && this.selectedImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.selectedImagePreview);
      }
    } catch (e) {}
    try {
      if (this.selectedVideoPreview) {
        URL.revokeObjectURL(this.selectedVideoPreview);
      }
    } catch (e) {}
    if (this.selectedDocsPreviews && this.selectedDocsPreviews.length > 0) {
      this.selectedDocsPreviews.forEach((url) => {
        try {
          if (url) URL.revokeObjectURL(url);
        } catch (e) {}
      });
      this.selectedDocsPreviews = [];
    }

    this.newEvent = this.getEmptyEvent() as EventWithPreview;
    this.selectedFile = null;
    this.selectedImage = null;
    this.selectedVideo = null;
    this.selectedDocs = [];
    this.uploadProgress = '';
    this.isEditing = false;
    this.editingEventId = null;
    this.selectedImagePreview = null;
    (this.newEvent as EventWithPreview).previewImageUrl = null;
    this.existingMedia = [];
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  closeModals() {
    this.showParticipants = false;
    this.showStats = false;
    this.showNotificationForm = false;
  }

  // Profile UI
  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
  this.authService.logout().subscribe({
    next: () => {
      this.showProfileMenu = false;
      window.location.href = '/home';
    },
    error: () => {
      this.showProfileMenu = false;
      window.location.href = '/home';
    }
  });
}
}