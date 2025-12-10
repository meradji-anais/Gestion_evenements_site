import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EventService, Event } from '../services/event.service';
import { AuthService } from '../services/auth.service';

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
  
  showProfileMenu = false;

  constructor(
    private eventService: EventService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

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