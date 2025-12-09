import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService, Event } from '../services/event.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  events: Event[] = [];
  loading = false;
  
  constructor(private eventService: EventService) {}
  
  ngOnInit() {
    this.loadEvents();
  }
  
  loadEvents() {
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        // Prendre juste les 3 premiers événements
        this.events = (data || []).slice(0, 3);
        console.log('✅ Événements chargés:', this.events);
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.events = [];
      }
    });
  }
}