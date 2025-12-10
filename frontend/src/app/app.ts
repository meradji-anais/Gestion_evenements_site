import { Component } from '@angular/core';
import { Router, RouterModule, RouterLink, RouterOutlet } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from './services/auth.service'; 
import { HttpClientModule } from '@angular/common/http'; 

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [CommonModule, RouterModule, RouterLink, RouterOutlet, HttpClientModule], 
  templateUrl: './app.html', 
  styleUrls: ['./app.scss'] 
})
export class AppComponent {
  
  
  showProfileMenu: boolean = false;
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  
  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  
  logout() {
  this.showProfileMenu = false;
  
  this.authService.logout().subscribe({
    next: () => {
      
      window.location.href = '/home';
    },
    error: (err) => {
      console.error('Erreur de déconnexion, mais navigation vers /home', err);
      window.location.href = '/home';
    }
  });
}
}