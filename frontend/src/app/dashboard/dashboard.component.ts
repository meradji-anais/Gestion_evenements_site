import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService, Event } from '../services/event.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <section class="hero">
        <h2>Bienvenue {{ authService.currentUserValue?.name }} ! </h2>
        <p>Vous êtes connecté en tant que <strong>{{ authService.currentUserValue?.role }}</strong></p>

        <div class="cta-buttons" style="margin-top: 2rem;">
          <button class="primary" *ngIf="authService.isOrganizer()" routerLink="/organizer">
             Mon espace organisateur
          </button>
          <button class="primary" *ngIf="authService.isParticipant()" routerLink="/participant">
             Mon espace participant
          </button>
        </div>
      </section>

      <section class="events-list">
        <h3>Événements à venir</h3>

        <div *ngIf="loading" style="text-align: center; padding: 2rem;">
          <p>Chargement des événements...</p>
        </div>

        <div *ngIf="!loading && events.length === 0" style="text-align: center; padding: 2rem;">
          <p>Aucun événement disponible pour le moment.</p>
        </div>

        <div class="event-card" *ngFor="let event of events">
          <img [src]="event.imageUrl || 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=60'" />
          <div>
            <h4>{{ event.title }}</h4>
            <p>Date : {{ event.eventDate | date:'dd/MM/yyyy' }}</p>
            <p>Lieu : {{ event.location }}</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['../home/home.scss']
})
export class DashboardComponent implements OnInit {
  events: Event[] = [];
  loading = false;

  constructor(
    private eventService: EventService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = (data || []).slice(0, 3);
        this.loading = false;
      },
      error: (err) => {
        console.error(' Erreur:', err);
        this.events = [];
        this.loading = false;
      }
    });
  }
}